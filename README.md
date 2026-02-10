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

Log in with the password from `admin_password.txt`.
Set it back to:
```txt
false

and restart backend again:
```bash
docker compose restart backend

## Stop / reset

Stop containers:
```bash
docker compose down

Full reset (removes volumes: database + stored data):
```bash
docker compose down -v

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





  



