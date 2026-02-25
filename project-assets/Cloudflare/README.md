# Cloudflare Worker + R2 Setup (FDR Cloud Inbox)

Tento dokument popisuje kompletné nastavenie Cloudflare časti pre FDR systém:
- R2 bucket na ukladanie log chunkov
- Worker API endpointy pre upload + synchronizáciu
- prepojenie so secretmi v backende

> Tento priečinok je doplnková infra dokumentácia (nie frontend/backend runtime kód aplikácie).

---

## Architektúra (stručne)

1. **Zariadenie** posiela log chunky na Worker endpoint `PUT /upload`.
2. Worker overí `X-DEVICE-ID` + `X-DEVICE-KEY` podľa secretu `DEVICE_KEYS_JSON`.
3. Dáta sa uložia do **R2 bucketu** pod kľúč:
   `deviceId/flightId/000001.log`
4. **Backend sync** endpointy (`/pending-flights`, `/flight/...`, `/ack`) používajú bearer token `SYNC_TOKEN`.

---

## 1) Vytvorenie R2 bucketu

1. V Cloudflare Dashboard otvor **R2**.
2. Vytvor nový bucket, napr.:
    - `fdr-cloud-inbox`

Odporúčanie:
- názov bucketu drž stabilný (nepremenovávať počas prevádzky),
- používať jeden bucket pre inbox flow.

---

## 2) Vytvorenie Worker-a

1. V Cloudflare Dashboard otvor **Workers & Pages**.
2. Vytvor nový Worker, napr.:
    - `fdr-inbox-worker`

---

## 3) Binding Worker -> R2

Vo Worker nastaveniach pridaj binding:

- **Type:** `R2 bucket`
- **Binding name:** `INBOX_BUCKET`
- **Bucket:** `fdr-cloud-inbox` (alebo tvoj názov)

Výsledok: v kóde Worker-a bude dostupné `env.INBOX_BUCKET`.

---

## 4) Variables and Secrets

Vo Worker -> **Settings -> Variables and Secrets** pridaj **2x Secret**:

1. `DEVICE_KEYS_JSON`
2. `SYNC_TOKEN`

### `DEVICE_KEYS_JSON` (secret)
JSON objekt mapujúci device ID na device key:

```json
{
  "DEV_5161fa0eb676": "0935dedb5d9b36fb4a92a76e15202bb6"
}
```
## 5) Nasadenie Worker kódu

1. Otvor Worker.
2. Klikni Edit code (vpravo hore).
3. Vlož/aktualizuj worker.js obsah.
4. Ulož a deployni zmeny.

## 6) Worker endpointy
# Health
- `GET /`
- Očakávané: `{ ok: true, service: "FDR Cloud Inbox", ... }`

# Upload z device
- `PUT /upload`
- Required headers:
    - `X-DEVICE-ID`
    - `X-DEVICE-KEY`
    - `X-FLIGHT-ID`
    - `X-CHUNK-NUMBER`
- Body: text log chunk

## Sync (backend)

### Autorizácia:

```http
Authorization: Bearer <SYNC_TOKEN>
```
### Endpointy: 
- `GET /pending-flights?deviceId=...`
- `GET /flight/{deviceId}/{flightId}/{fileName}`
- `PUT /ack` body:
```JSON
{ "deviceId": "...", "flightId": "..." }
```
## 7) Prevádzkový postup (admin)

- User požiada pri registrácii o vlastné zariadenie.
- Admin v aplikácii získa `deviceId` a `deviceKey`.
- Admin doplní pár do `DEVICE_KEYS_JSON` secretu vo Worker-i.
- Backend používa rovnaký `SYNC_TOKEN` zo `secrets/cloud_inbox_sync_token.txt`.

## 8) Bezpečnostné odporúčania

- Nikdy necommituj reálne tokeny ani keys do Git-u.
- Do repozitára dávaj len príklady (`*.example`, anonymizované hodnoty).
- `DEVICE_KEYS_JSON` a `SYNC_TOKEN` drž výhradne v Cloudflare Secrets.
- Pri podozrení na leak okamžite rotuj `SYNC_TOKEN` aj device keys.

## 9) Troubleshooting

### 401 Unauthorized

Skontroluj:

- `SYNC_TOKEN` v Cloudflare == `secrets/cloud_inbox_sync_token.txt`
- správny `Authorization: Bearer ...`
- správny `X-DEVICE-KEY` pre `X-DEVICE-ID`

### Chýbajú dáta v `pending-flights`

- Over, že sa uploaduje pod správny prefix: `deviceId/flightId/*.log`
- Over, že flight nie je už označený `_ACKED`.

## 10) Rýchly checklist po zmene

- [x] Worker nasadený s aktuálnym `worker.js`
- [x] R2 binding `INBOX_BUCKET` existuje a smeruje na správny bucket
- [x] Secret `DEVICE_KEYS_JSON` je validný JSON
- [x] Secret `SYNC_TOKEN` sedí s backend secretom
- [x] Health endpoint `GET /` vracia `ok: true`