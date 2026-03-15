FDRSystem – Device Code Template Setup
======================================

Tento balík obsahuje:
1) Device_code_template.ino
2) README_SETUP.txt (tento súbor)

Účel
-----
Šablóna `Device_code_template.ino` slúži na rýchle nastavenie zariadenia (ESP32),
ktoré bude zapisovať letové údaje a odosielať ich do FDRSystem cloud workflow.

Dôležité
--------
Zariadenie, ktoré dostaneš, je hardvérovo pripravené (zapojenie je už hotové).
Stačí upraviť konfiguračné údaje v kóde a nahrať firmware.

Predtým, než začneš
-------------------
- Potrebuješ Arduino IDE (alebo PlatformIO) a nainštalované knižnice použité v kóde.
- Potrebuješ funkčné Wi-Fi / hotspot pripojenie.
- Potrebuješ údaje od admina:
  - DEVICE_ID
  - DEVICE_KEY

POZOR:
DEVICE_KEY je citlivý údaj.
Nezdieľaj ho verejne, neposielaj ho cez screenshoty a neukladaj do verejných repozitárov.

Krok 1 – Otvor súbor
--------------------
Otvor `Device_code_template.ino` v Arduino IDE.

Krok 2 – Vyplň placeholders
---------------------------
V hornej časti súboru vyplň tieto hodnoty:

- WIFI_SSID
  [WRITE HERE YOUR MOBILE HOTSPOT SSID OR WIFI SSID]

- WIFI_PASS
  [WRITE HERE YOUR MOBILE HOTSPOT PASSWORD OR WIFI PASSWORD]

- DEVICE_ID
  [PASTE HERE DEV_ID ADMIN GAVE YOU]

- DEVICE_KEY
  [PASTE HERE DEV_KEY YOU RECEIVED FROM ADMIN]

Nepoužívaj hranaté zátvorky v reálnej hodnote, nahraď celý text vlastnou hodnotou.

Krok 3 – Nahraj firmware
------------------------
- Vyber správnu dosku (ESP32) a COM port.
- Klikni Upload.
- Po nahratí otvor Serial Monitor (115200 baud).

Krok 4 – Over beh zariadenia
----------------------------
V Serial Monitori sleduj:
- pripojenie na Wi-Fi
- GPS fix/stabilizáciu
- logovanie
- cloud upload chunkov (OK/FAIL hlášky)

Ak vidíš upload OK, zariadenie komunikuje správne.

Najčastejšie problémy
---------------------
1) Wi-Fi sa nepripojí
   - skontroluj SSID/heslo
   - skontroluj dosah hotspotu/Wi-Fi

2) Cloud upload FAIL (401/403)
   - zlé DEVICE_ID alebo DEVICE_KEY
   - prepíš údaje presne podľa admina

3) GPS dlho bez fixu
   - daj zariadenie na otvorené priestranstvo
   - počkaj na prvý fix + stabilizačný čas

4) SD chyby
   - reštartuj zariadenie
   - ak problém pretrváva, kontaktuj admina

Bezpečnostné odporúčania
------------------------
- DEVICE_KEY ukladaj iba lokálne a bezpečne.
- Neposielaj celý `.ino` súbor verejne, ak obsahuje reálne credentials.
- Pred zdieľaním vždy vráť placeholders.

Poznámka
--------
Táto šablóna je určená na rýchly štart.
Po otestovaní si môžeš kód upraviť podľa svojho zariadenia/hardvéru.
