🇬🇧 **English** | 🇸🇰 [Slovensky](README.md)

# Cloudflare Worker + R2 Setup (FDR Cloud Inbox)

This document describes the complete setup of the Cloudflare part of the FDR system:

- R2 bucket for storing log chunks
- Worker API endpoints for upload + synchronization
- integration with secrets in the backend

> This folder is supplementary infrastructure documentation (not frontend/backend runtime application code).

---

## Architecture (brief)

1. The **device** sends log chunks to the Worker endpoint `PUT /upload`.
2. The Worker verifies `X-DEVICE-ID` + `X-DEVICE-KEY` against the `DEVICE_KEYS_JSON` secret.
3. The data is stored in the **R2 bucket** under the key:
   `deviceId/flightId/000001.log`
4. The **backend sync** endpoints (`/pending-flights`, `/flight/...`, `/ack`) use the `SYNC_TOKEN` bearer token.

---

## 1) Creating the R2 bucket

1. In the Cloudflare Dashboard, open **R2**.
2. Create a new bucket, e.g.:
    - `fdr-cloud-inbox`

Recommendation:
- keep the bucket name stable (do not rename during operation),
- use a single bucket for the inbox flow.

---

## 2) Creating the Worker

1. In the Cloudflare Dashboard, open **Workers & Pages**.
2. Create a new Worker, e.g.:
    - `fdr-inbox-worker`

---

## 3) Binding Worker -> R2

In the Worker settings, add a binding:
- **Type:** `R2 bucket`
- **Binding name:** `INBOX_BUCKET`
- **Bucket:** `fdr-cloud-inbox` (or your name)

Result: `env.INBOX_BUCKET` will be available in the Worker code.

---

## 4) Variables and Secrets

In Worker -> **Settings -> Variables and Secrets** add **2x Secret**:

1. `DEVICE_KEYS_JSON`
2. `SYNC_TOKEN`

### `DEVICE_KEYS_JSON` (secret)

JSON object mapping device ID to device key:

```json
{
  "DEV_5161fa0eb676": "0935dedb5d9b36fb4a92a76e15202bb6"
}
```

## 5) Deploying the Worker code

1. Open the Worker.
2. Click Edit code (top right).
3. Paste/update the worker.js content.
4. Save and deploy the changes.

## 6) Worker endpoints

# Health
- `GET /`
- Expected: `{ ok: true, service: "FDR Cloud Inbox", ... }`

# Upload from device
- `PUT /upload`
- Required headers:
    - `X-DEVICE-ID`
    - `X-DEVICE-KEY`
    - `X-FLIGHT-ID`
    - `X-CHUNK-NUMBER`
- Body: text log chunk

## Sync (backend)

### Authorization:
```http
Authorization: Bearer <SYNC_TOKEN>
```

### Endpoints:
- `GET /pending-flights?deviceId=...`
- `GET /flight/{deviceId}/{flightId}/{fileName}`
- `PUT /ack` body:
```JSON
{ "deviceId": "...", "flightId": "..." }
```

## 7) Operational procedure (admin)

- The user requests their own device during registration.
- The admin obtains the `deviceId` and `deviceKey` in the application.
- The admin adds the pair to the `DEVICE_KEYS_JSON` secret in the Worker.
- The backend uses the same `SYNC_TOKEN` from `secrets/cloud_inbox_sync_token.txt`.

## 8) Security recommendations

- Never commit real tokens or keys to Git.
- Only put examples in the repository (`*.example`, anonymized values).
- Keep `DEVICE_KEYS_JSON` and `SYNC_TOKEN` exclusively in Cloudflare Secrets.
- If you suspect a leak, immediately rotate the `SYNC_TOKEN` and device keys.

## 9) Troubleshooting

### 401 Unauthorized

Check:
- `SYNC_TOKEN` in Cloudflare == `secrets/cloud_inbox_sync_token.txt`
- correct `Authorization: Bearer ...`
- correct `X-DEVICE-KEY` for `X-DEVICE-ID`

### Missing data in `pending-flights`

- Verify that uploads use the correct prefix: `deviceId/flightId/*.log`
- Verify that the flight is not already marked `_ACKED`.

## 10) Quick checklist after a change

- [x] Worker deployed with the current `worker.js`
- [x] R2 binding `INBOX_BUCKET` exists and points to the correct bucket
- [x] Secret `DEVICE_KEYS_JSON` is valid JSON
- [x] Secret `SYNC_TOKEN` matches the backend secret
- [x] Health endpoint `GET /` returns `ok: true`
