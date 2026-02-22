#include <Wire.h>
#include <SPI.h>
#include <SD.h>

#include <MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>

#include <TinyGPS++.h>
#include <math.h>

// ===== NEW: WiFi + HTTP =====
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ===================== WIFI  =====================
static const char* WIFI_SSID = "[WRITE HERE YOUR MOBILE HOTSPOT SSID OR WIFI SSID]"; // YOUR SSID
static const char* WIFI_PASS = "[WRITE HERE YOUR MOBILE HOTSPOT PASSWORD OR WIFI PASSWORD]";  // YOUR PASSWORD

// ===================== Cloudflare Worker =====================
static const char* WORKER_BASE = "https://fdr-inbox-worker.samuel-gergel.workers.dev";
static const char* WORKER_UPLOAD_PATH = "/upload";

// Toto je device, ktoré si už pridelil userovi (MVP hardcode)
static const char* DEVICE_ID  = "[PASTE HERE DEV_ID ADMIN GAVE YOU]";  // YOUR DEVICE ID NEEDED NEEDED FOR CLOUD SYNC TO WORK !!
static const char* DEVICE_KEY = "[PASTE HERE DEV_KEY YOU RECEIVED FROM ADMIN]";  // YOUR DEVICE_KEY NEEDED FOR CLOUD SYNC TO WORK !!

// ===================== GPS (ESP32 UART1) =====================
// GPS (TX) -> ESP RX = D16
// GPS (RX) -> ESP TX = D17
static const int GPS_RX_PIN = 16;
static const int GPS_TX_PIN = 17;
static const uint32_t GPSBaud = 9600;

HardwareSerial ss(1);
TinyGPSPlus gps;

// ===================== SD (ESP32 VSPI) =====================
static const int SD_CS = 5;
static const int SD_SCK  = 18;
static const int SD_MISO = 19;
static const int SD_MOSI = 23;

// ===================== Sensors =====================
MPU6050 mpu;
Adafruit_BMP280 bmp280;

// ===================== log every ~200 ms =====================
const uint16_t LOG_INTERVAL_MS = 200;
unsigned long  lastLogMs = 0;

// ===================== post-fix stabilization window =====================
const uint32_t WARMUP_MS = 15000;
bool           gpsReady = false;
bool           loggingActive = false;
unsigned long  fixTimeMs = 0;
int            lastCountdownSec = -1;

// ===================== angles (deg) =====================
float angleX, angleY, angleZ;

// ===================== MPU6050 offsets (UNO hodnoty) =====================
const float offsetX = 1263;
const float offsetY =   28;
const float offsetZ = 2668;

// ===================== turbulence (RMS of | |a|-1 | ) =====================
float turbSumSq = 0.0;
uint16_t turbCnt = 0;

// ===================== SD status =====================
bool  sdHealthy = true;
static bool sdBusy = false;

// ===== BMP constants =====
const float PRESSURE_OFFSET_HPA = 0.0f;
const float QNH_OFFSET_HPA      = 21.0f;

// ===================== NEW: Baro altitude fix using p0 + GPS offset =====================
bool  baroRefReady = false;
float p0_hpa = NAN;

bool  gpsAlt0Ready = false;
float gpsAlt0_m = NAN;

static inline float altitudeFromPressureRelative(float p_hpa, float p0_hpa_local) {
  return 44330.0f * (1.0f - powf(p_hpa / p0_hpa_local, 0.19029495f));
}

float computeAltitudeMeters(float p_station_hpa) {
  if (!baroRefReady || isnan(p0_hpa) || p0_hpa <= 0.0f) {
    float pCorr = p_station_hpa + QNH_OFFSET_HPA;
    return bmp280.readAltitude(pCorr);
  }
  float rel = altitudeFromPressureRelative(p_station_hpa, p0_hpa);
  if (gpsAlt0Ready && !isnan(gpsAlt0_m)) return gpsAlt0_m + rel;
  return rel;
}

// ========== CET/CEST helpers ==========
int dayOfWeek(int y,int m,int d){ if(m<3){m+=12;y-=1;}int K=y%100,J=y/100;int h=(d+13*(m+1)/5+K+K/4+J/4+5*J)%7;return(h+6)%7;}
int lastSunday(int y,int m){for(int d=31;d>=25;d--)if(dayOfWeek(y,m,d)==0)return d;return 31;}
int euUtcOffset(int y,int m,int d,int hUTC){
  int s = lastSunday(y, 3), e = lastSunday(y,10);
  if(m<3||(m==3&&(d<s || (d==s && hUTC<1)))) return 1;
  if(m>10||(m==10&&(d>e || (d==e && hUTC>=1)))) return 1;
  return 2;
}

// ===================== UBX helpers =====================
void ubxChecksum(const uint8_t* payload, uint16_t len, uint8_t &ckA, uint8_t &ckB){
  ckA = 0; ckB = 0;
  for (uint16_t i=0;i<len;i++){ ckA += payload[i]; ckB += ckA; }
}
void sendUBX(uint8_t cls, uint8_t id, const uint8_t* payload, uint16_t len){
  uint8_t ckA, ckB;
  uint8_t hdr[4] = { cls, id, (uint8_t)(len & 0xFF), (uint8_t)(len >> 8) };
  ubxChecksum(hdr, 4, ckA, ckB);
  ubxChecksum(payload, len, ckA, ckB);

  ss.write(0xB5); ss.write(0x62);
  ss.write(hdr, 4);
  ss.write(payload, len);
  ss.write(ckA); ss.write(ckB);
}
void gpsSet5Hz(){
  uint8_t rate[6] = { 200 & 0xFF, 200 >> 8, 1, 0, 1, 0 };
  sendUBX(0x06, 0x08, rate, 6);
}
void gpsEnableGGA_RMC_only(){
  uint8_t off1[3] = {0xF0, 0x01, 0}; sendUBX(0x06,0x01, off1, 3);
  uint8_t off2[3] = {0xF0, 0x02, 0}; sendUBX(0x06,0x01, off2, 3);
  uint8_t off3[3] = {0xF0, 0x03, 0}; sendUBX(0x06,0x01, off3, 3);
  uint8_t off4[3] = {0xF0, 0x05, 0}; sendUBX(0x06,0x01, off4, 3);
  uint8_t on1 [3] = {0xF0, 0x00, 1}; sendUBX(0x06,0x01, on1 , 3);
  uint8_t on2 [3] = {0xF0, 0x04, 1}; sendUBX(0x06,0x01, on2 , 3);
}

// ===================== NEW: Cloud chunking =====================
static const size_t CHUNK_TARGET_BYTES = 16 * 1024; // 16KB (MVP)
String flightId = "";
uint32_t chunkNo = 0;
String chunkBuf = "";

unsigned long lastWiFiTryMs = 0;
unsigned long lastOutboxTryMs = 0;

String pad6(uint32_t n) {
  char b[7];
  snprintf(b, sizeof(b), "%06lu", (unsigned long)n);
  return String(b);
}

String genFlightId() {
  // prefer GPS date+time if valid
  if (gps.date.isValid() && gps.time.isValid()) {
    char b[32];
    snprintf(b, sizeof(b), "F_%04d%02d%02d_%02d%02d%02d",
             gps.date.year(), gps.date.month(), gps.date.day(),
             gps.time.hour(), gps.time.minute(), gps.time.second());
    return String(b);
  }
  // fallback random
  uint32_t r = (uint32_t)esp_random();
  char b[32];
  snprintf(b, sizeof(b), "F_RAND_%08lx", (unsigned long)r);
  return String(b);
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  unsigned long now = millis();
  if (now - lastWiFiTryMs < 5000) return;
  lastWiFiTryMs = now;

  Serial.print("[WiFi] connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
}

bool uploadToWorker(const String& fId, uint32_t cNo, const String& payload) {
  if (WiFi.status() != WL_CONNECTED) return false;

  String url = String(WORKER_BASE) + WORKER_UPLOAD_PATH;

  WiFiClientSecure client;
  client.setInsecure(); // MVP: TLS without cert validation

  HTTPClient http;
  if (!http.begin(client, url)) return false;

  http.addHeader("X-DEVICE-ID", DEVICE_ID);
  http.addHeader("X-DEVICE-KEY", DEVICE_KEY);
  http.addHeader("X-FLIGHT-ID", fId);
  http.addHeader("X-CHUNK-NUMBER", String(cNo));
  http.addHeader("Content-Type", "text/plain; charset=utf-8");

  int code = http.PUT((uint8_t*)payload.c_str(), payload.length());
  String resp = http.getString();
  http.end();

  if (code >= 200 && code < 300) {
    Serial.print("[Cloud] upload OK chunk ");
    Serial.print(cNo);
    Serial.print(" -> ");
    Serial.println(resp);
    return true;
  } else {
    Serial.print("[Cloud] upload FAIL HTTP ");
    Serial.print(code);
    Serial.print(" resp=");
    Serial.println(resp);
    return false;
  }
}

bool writeOutboxFile(const String& fId, uint32_t cNo, const String& payload) {
  if (!sdHealthy) return false;
  if (!SD.exists("/outbox")) SD.mkdir("/outbox");

  String fn = "/outbox/" + fId + "_" + pad6(cNo) + ".log";

  // FIX: aby sa nikdy neappendovalo do existujúceho súboru
  if (SD.exists(fn)) SD.remove(fn);

  File f = SD.open(fn, FILE_WRITE);
  if (!f) return false;
  f.print(payload);
  f.close();
  return true;
}

bool deleteOutboxFile(const String& path) {
  if (!SD.exists(path)) return true;
  return SD.remove(path);
}

void trySendOutbox() {
  if (!sdHealthy) return;
  if (WiFi.status() != WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastOutboxTryMs < 5000) return; // nepreťažuj
  lastOutboxTryMs = now;

  File dir = SD.open("/outbox");
  if (!dir) return;

  File f = dir.openNextFile();
  if (!f) { dir.close(); return; }

  // entryName býva často len "F_....log" bez "/outbox/"
  String entryName = String(f.name());

  // FIX: zostav FULL PATH tak, aby mazanie bolo vždy správne
  String fullPath;
  if (entryName.startsWith("/outbox/")) fullPath = entryName;
  else if (entryName.startsWith("outbox/")) fullPath = "/" + entryName;
  else if (entryName.startsWith("/")) fullPath = entryName; // fallback
  else fullPath = String("/outbox/") + entryName;

  // base filename na parsing (bez priečinkov)
  String base = fullPath;
  int slash = base.lastIndexOf('/');
  if (slash >= 0) base = base.substring(slash + 1);

  // načítaj payload (rezervuj kapacitu, menej fragmentácie)
  String payload;
  payload.reserve(f.size() + 1);
  while (f.available()) payload += (char)f.read();

  f.close();
  dir.close();

  // parse filename: <flightId>_<chunk>.log
  int us = base.lastIndexOf('_');
  int dot = base.lastIndexOf('.');
  if (us < 0 || dot < 0 || dot < us) {
    Serial.print("[Outbox] bad filename, skipping: ");
    Serial.println(base);
    return;
  }

  String fId = base.substring(0, us);
  String cStr = base.substring(us + 1, dot);
  uint32_t cNo = (uint32_t)cStr.toInt();

  if (uploadToWorker(fId, cNo, payload)) {
    bool removed = SD.remove(fullPath);
    if (removed) {
      Serial.print("[Outbox] sent & deleted: ");
      Serial.println(fullPath);
    } else {
      Serial.print("[Outbox] sent but DELETE FAILED: ");
      Serial.println(fullPath);
    }
  }
}

void flushChunkIfNeeded(bool force) {
  if (!loggingActive) return;
  if (!force && chunkBuf.length() < CHUNK_TARGET_BYTES) return;
  if (chunkBuf.length() == 0) return;

  chunkNo++;
  String payload = chunkBuf;
  chunkBuf = "";

  // vždy najprv uložiť na SD do outboxu
  if (sdHealthy) {
    if (!writeOutboxFile(flightId, chunkNo, payload)) {
      Serial.println("[Outbox] write failed (still continuing)");
    }
  }

  // potom skúsiť poslať hneď
  if (uploadToWorker(flightId, chunkNo, payload)) {
    // ak upload prešiel a outbox súbor existuje, zmaž ho
    String fn = "/outbox/" + flightId + "_" + pad6(chunkNo) + ".log";
    deleteOutboxFile(fn);
  }
}

// ===================== SD init + header =====================
bool initSD() {
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (!SD.begin(SD_CS, SPI)) return false;

  if (!SD.exists("/outbox")) SD.mkdir("/outbox");

  File f = SD.open("/data.txt", FILE_APPEND);
  if (!f) return false;

  if (f.size() == 0) {
    f.println(F("Time\t\tLatitude\tLongitude\tTemperature(C)\tPressure(hPa)\tAltitude(m)\taX(g)\taY(g)\taZ(g)\tTurbulence\tX(deg)\tY(deg)\tZ(deg)\tSpeed(kn)"));
  }
  f.close();
  return true;
}

// ===== helper: build one TSV line exactly like SD output =====
String buildTsvLine(const char* tBuf,
                    float lat, float lng,
                    float tempC, float pCorr, float alt,
                    float ax_g, float ay_g, float az_g,
                    float turbulence,
                    float angX, float angY, float angZ,
                    float speedKn) {

  String s;
  s.reserve(220);

  // presne ako tvoj pôvodný SD write (zarovnanie cez dvojité taby)
  s += tBuf;                 s += '\t';
  s += String(lat, 6);       s += '\t';
  s += String(lng, 6);       s += '\t';

  s += String(tempC, 2);     s += '\t';  s += '\t';
  s += String(pCorr, 2);     s += '\t';  s += '\t';
  s += String(alt, 2);       s += '\t';  s += '\t';

  s += String(ax_g, 3);      s += '\t';
  s += String(ay_g, 3);      s += '\t';
  s += String(az_g, 3);      s += '\t';

  s += String(turbulence, 3); s += '\t';
  s += '\t'; // extra tab pred uhlami (presne ako u teba)

  s += String(angX, 2);      s += '\t';
  s += String(angY, 2);      s += '\t';
  s += String(angZ, 2);      s += '\t';

  s += String(speedKn, 2);
  s += '\n';

  return s;
}

// ===================== SAVE LOCATION (SD + Cloud buffer) =====================
bool saveLocation(float ax_g, float ay_g, float az_g,
                  float angX, float angY, float angZ) {

  if (!sdHealthy) { if (!initSD()) return false; sdHealthy = true; }
  if (sdBusy) return false;
  sdBusy = true;

  File dataFile = SD.open("/data.txt", FILE_APPEND);
  if (!dataFile) {
    Serial.println(F("! SD write error – retrying"));
    SD.end(); delay(50);
    if (!initSD()) {
      Serial.println(F("! SD init failed – sample skipped"));
      sdHealthy = false; sdBusy = false; return false;
    }
    dataFile = SD.open("/data.txt", FILE_APPEND);
    if (!dataFile) {
      Serial.println(F("! SD fatal – sample skipped"));
      sdHealthy = false; sdBusy = false; return false;
    }
  }

  int off = euUtcOffset(gps.date.year(), gps.date.month(), gps.date.day(), gps.time.hour());
  int h = (gps.time.hour() + off) % 24;
  int m =  gps.time.minute();
  int s =  gps.time.second();
  char tBuf[9]; sprintf(tBuf, "%02d:%02d:%02d", h, m, s);

  float p_station = bmp280.readPressure() / 100.0f + PRESSURE_OFFSET_HPA;
  float pCorr = p_station + QNH_OFFSET_HPA;
  float alt = computeAltitudeMeters(p_station);

  float turbulence = (turbCnt > 0) ? sqrt(turbSumSq / turbCnt) : 0.0;
  turbSumSq = 0.0; turbCnt = 0;

  float tempC = bmp280.readTemperature();
  float speedKn = gps.speed.knots();

  // 1) build TSV line
  String line = buildTsvLine(
    tBuf,
    gps.location.lat(), gps.location.lng(),
    tempC, pCorr, alt,
    ax_g, ay_g, az_g,
    turbulence,
    angX, angY, angZ,
    speedKn
  );

  // 2) write to SD
  dataFile.print(line);
  dataFile.close();

  // 3) echo to Serial
  Serial.print(line);

  // 4) append to cloud chunk buffer + flush if needed
  chunkBuf += line;
  flushChunkIfNeeded(false);

  sdBusy = false;
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(300);

  // WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  // GPS UART
  ss.begin(GPSBaud, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // SD
  if (!initSD()) { Serial.println(F("! SD card error")); while (true) delay(1000); }

  // BMP
  if (!bmp280.begin(0x76)) { Serial.println(F("! BMP280 not found")); while (true) delay(1000); }

  // MPU
  mpu.initialize();

  Serial.println(F("Configuring GPS (5Hz @9600, GGA+RMC)…"));
  gpsSet5Hz();
  gpsEnableGGA_RMC_only();
  Serial.println(F("GPS configured. Waiting for fix…"));
}

void loop() {
  ensureWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    static bool once = false;
    if (!once) {
      once = true;
      Serial.print("[WiFi] Connected, IP=");
      Serial.println(WiFi.localIP());
    }
  }

  // ----- MPU6050 -----
  int16_t rawAx, rawAy, rawAz;
  mpu.getAcceleration(&rawAx, &rawAy, &rawAz);

  float ax = rawAx - offsetX;
  float ay = rawAy - offsetY;
  float az = rawAz - offsetZ;

  angleX = atan2(ay, az) * 180.0 / PI;
  angleY = atan2(-ax, az) * 180.0 / PI;
  angleZ = atan2(az, sqrt(ax*ax + ay*ay)) * 180.0 / PI;

  const float LSB_PER_G = 16384.0;
  float ax_g = ax / LSB_PER_G;
  float ay_g = ay / LSB_PER_G;
  float az_g = az / LSB_PER_G;

  float gMag   = sqrt(ax_g*ax_g + ay_g*ay_g + az_g*az_g);
  float deltaG = fabs(gMag - 1.0);
  turbSumSq += deltaG * deltaG;
  ++turbCnt;

  // ----- GPS stream -----
  while (ss.available()) gps.encode(ss.read());

  // first fix -> start warm-up countdown
  if (!gpsReady &&
      gps.time.isValid() && gps.date.isValid() &&
      gps.location.isValid()) {
    gpsReady   = true;
    fixTimeMs  = millis();
    lastCountdownSec = -1;
    Serial.println(F("FIX OK – stabilizing before logging…"));
  }

  // warm-up countdown
  if (gpsReady && !loggingActive) {
    unsigned long elapsed = millis() - fixTimeMs;
    if (elapsed < WARMUP_MS) {
      int remainSec = (int)((WARMUP_MS - elapsed + 999) / 1000);
      if (remainSec != lastCountdownSec) {
        Serial.print(F("Stabilizing GPS… ")); Serial.print(remainSec); Serial.println(F(" s"));
        lastCountdownSec = remainSec;
      }
    } else {
      loggingActive = true;
      lastLogMs = millis();
      Serial.println(F("GPS stabilized – starting log at 5 Hz"));

      // set baro reference
      float p_station = bmp280.readPressure() / 100.0f + PRESSURE_OFFSET_HPA;
      p0_hpa = p_station;
      baroRefReady = true;

      if (gps.altitude.isValid()) {
        gpsAlt0_m = gps.altitude.meters();
        gpsAlt0Ready = true;
      } else {
        gpsAlt0Ready = false;
      }

      // NEW: start flight session for cloud
      flightId = genFlightId();
      chunkNo = 0;
      chunkBuf = "";

      Serial.print("[Cloud] flightId=");
      Serial.println(flightId);
    }
  }

  if (loggingActive && !gpsAlt0Ready && gps.altitude.isValid()) {
    gpsAlt0_m = gps.altitude.meters();
    gpsAlt0Ready = true;
  }

  // log every ~200 ms
  if (loggingActive && (millis() - lastLogMs) >= LOG_INTERVAL_MS) {
    if (saveLocation(ax_g, ay_g, az_g, angleX, angleY, angleZ)) {
      lastLogMs += LOG_INTERVAL_MS;
      if (millis() - lastLogMs > LOG_INTERVAL_MS) lastLogMs = millis();
    } else {
      lastLogMs = millis();
    }
  }

  // NEW: retry send outbox sometimes
  trySendOutbox();
}
