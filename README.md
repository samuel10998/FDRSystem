# FDRSystem

If you want to run this app use **Docker Desktop** + for example **IntelliJ** (recommended).

## Requirements
- Docker Desktop (with Docker Compose)
- (Optional) IntelliJ IDEA

---

## 1) First time setup (Secrets)
This project uses **Docker secrets**. The `secrets/` folder is **not** pushed to GitHub (it is ignored), so you must create it locally.

Create this structure in the project root:
secrets/(folder) and files:
jwt_secret.txt
db_password.txt
db_root_password.txt
admin_email.txt
admin_password.txt
admin_seed_force_reset.txt
cloud_inbox_sync_token.txt
worker_device_keys.json (local helper file for admin)

## Secrets (required)
Each file must contain **exactly 1 line** (no quotes).
### Recommended secret values
### JWT secret
Generate a strong JWT signing secret (Git Bash / WSL):
```bash
openssl rand -base64 48
```

Paste the output into:
- `secrets/jwt_secret.txt`

### Database passwords
Put any strong passwords you want into:
- `secrets/db_password.txt` (password for MySQL user) first line
- `secrets/db_root_password.txt` (password for MySQL root) first line

### Admin account (seeded automatically on startup)
- `secrets/admin_email.txt`  
  Example:
  ```txt
  admin@student.ukf.sk
  
- `secrets/admin_password.txt`  
  Example:
  ```txt
  CHANGE_ME_ADMIN_PASSWORD
### Admin force reset (optional but reccomended)
- `secrets/admin_seed_force_reset.txt`  
  Example:
  ```txt
  false
Tip: If you want to reset the admin password on next start, set it to `true`, restart backend, then set it back to `false`.

---

 **Cloud Inbox (Cloudflare Worker + R2) – NEW**

This project supports cloud upload + sync via Cloudflare Worker + R2.

### 1. `cloud_inbox_sync_token.txt` (required)

Backend uses this token to securely call the Cloudflare Worker “sync” endpoints.

**Create:**

- `secrets/cloud_inbox_sync_token.txt`

**Example:**
```txt
  MY_SUPER_SYNC_TOKEN_123
```

**Important:** The same value must be configured in Cloudflare Worker as secret (usually named `SYNC_TOKEN`).

### 2. `worker_device_keys.json` (recommended helper file)

This file is **not** used by Docker directly. It’s a local admin helper so you keep track of `deviceId → deviceKey` mapping that must be added into Cloudflare Worker secret `DEVICE_KEYS_JSON`.

**Create:**
- `secrets/worker_device_keys.json`

**Example:**
```json
{
  "DEV_5161fa0eb676": "0935dedb5d9b36fb4a92a76e15202bb6"
}
```
How it’s used:
In Cloudflare Worker settings you keep a secret called DEVICE_KEYS_JSON.
It contains a JSON object with multiple device mappings (so you DON’T overwrite older devices when adding new ones).
When admin assigns a new device to a user, admin also adds that deviceId+key into the Worker’s DEVICE_KEYS_JSON.

Recommendation: Always keep DEVICE_KEYS_JSON as one JSON object with many entries, like:
```json
{
  "DEV_aaa": "key1",
  "DEV_bbb": "key2",
  "DEV_ccc": "key3"
}
```

## 2) Build & run
From the project root:
```bash
docker compose up --build
```

## Admin account
On backend startup, an admin user is created (if it does not exist yet) using:
- Email from `secrets/admin_email.txt`
- Password from `secrets/admin_password.txt`
You can check this on phpMyAdmin: http://localhost:8081 with user - name and password you set in secret folder. 

### Force reset admin password
Set:
```txt
true
```
in `secrets/admin_seed_force_reset.txt`

Restart backend:
```bash
docker compose restart backend
```

Log in with the password from `admin_password.txt`.
Set it back to:
```txt
false
```
and restart backend again:
```bash
docker compose restart backend
```

## Stop / reset

Stop containers:
```bash
docker compose down
```

Full reset (removes volumes: database + stored data):
```bash
docker compose down -v
```
!!! After `down -v`, the database is empty and will be initialized again on next startup (including admin seeding). 

---


## Services & Ports

- Frontend: http://localhost:3000  
- Backend: http://localhost:8080  
- phpMyAdmin: http://localhost:8081  
- smtp4dev UI: http://localhost:4000  
- smtp4dev SMTP: localhost:2525  
- MySQL: localhost:3306  

---


## Notes

- Never commit `secrets/` to GitHub.
- If you clone this project on a new machine, you must recreate the `secrets/` folder before running Docker Compose.
- Cloud sync requires Cloudflare Worker + R2 configured (Worker URL + secrets: SYNC_TOKEN, DEVICE_KEYS_JSON).


## Production deployment (plan – “last step”)
Right now I’m presenting/defending this project in a local setup (Docker Compose).  
However, I prepared the system so it is **deployment-ready** in the sense that the **only remaining step** would be buying a domain + server and putting a reverse proxy in front of it.

What the “last step” would look like in practice:
- On a VPS/server I would run Docker Compose (backend + database + mail service).
- I would put a reverse proxy in front of it (e.g., Nginx), which would:
  - terminate HTTPS (Let’s Encrypt certificate),
  - serve the built frontend static files,
  - and proxy `/api/*` requests to the backend over the internal Docker network.
- In production, the backend would **not** be exposed directly to the public internet on a port (safer).  
  Only the reverse proxy would be public.
- The frontend is ready for a production build and can be served via Nginx (see the commented `frontend_prod` skeleton in `docker-compose.yml`).

In short: the application code does not need major changes for production — the remaining work is mainly infrastructure (domain/server + reverse proxy + HTTPS).





  



