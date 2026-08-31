# FDRSystem

FDRSystem je systém na zber, synchronizáciu, analýzu a vizualizáciu letových údajov zo zariadení Flight Data Recorder (FDR). Aplikácia umožňuje nahrávať logy (upload alebo cloud sync), spracovať ich do reportov, a následne zobraziť letové trasy, grafy a štatistiky v prehľadnom webovom rozhraní.

Ak chceš túto appku spustiť, použi **Docker Desktop** + napríklad **IntelliJ** (odporúčané).

A ak chceš vidieť, ako aplikácia vyzerá, choď do project-assets/Application_screenshots.

## Požiadavky
- Docker Desktop (s Docker Compose)
- (Voliteľné) IntelliJ IDEA
- Cloudflare účet (vytvorený R2 + Worker, ak chceš Cloud Upload inbox)

---

## 1) Prvotné nastavenie (Secrets)
Tento projekt používa **Docker secrets**. Priečinok `secrets/` sa **nepushuje** na GitHub (je ignorovaný), takže si ho musíš vytvoriť lokálne.

Vytvor v koreni projektu túto štruktúru:
secrets/(priečinok) a súbory:
- jwt_secret.txt
- db_password.txt
- db_root_password.txt
- admin_email.txt
- admin_password.txt
- admin_name.txt
- admin_surname.txt
- admin_seed_force_reset.txt
- cloud_inbox_sync_token.txt
- worker_device_keys.json (lokálny pomocný súbor pre admina)

## Secrets (povinné)
Každý súbor musí obsahovať **presne 1 riadok** (bez úvodzoviek).
### Odporúčané hodnoty secretov
### JWT secret
Vygeneruj silný JWT podpisovací secret (Git Bash / WSL):
```bash
openssl rand -base64 48
```

Vlož výstup do:
- `secrets/jwt_secret.txt`

### Heslá do databázy
Vlož akékoľvek silné heslá podľa vlastného výberu do:
- `secrets/db_password.txt` (heslo pre MySQL používateľa) prvý riadok
- `secrets/db_root_password.txt` (heslo pre MySQL root) prvý riadok

### Admin účet (vytvorí sa automaticky pri štarte)
- `secrets/admin_name.txt`  
  Príklad:
  ```txt
  Admin
  ```
- `secrets/admin_surname.txt`  
  Príklad:
  ```txt
  User
  ```
  
- `secrets/admin_email.txt`  
  Príklad:
  ```txt
  admin@student.ukf.sk
  
- `secrets/admin_password.txt`  
  Príklad:
  ```txt
  CHANGE_ME_ADMIN_PASSWORD
### Vynútený reset admina (voliteľné, ale odporúčané)
- `secrets/admin_seed_force_reset.txt`  
  Príklad:
  ```txt
  false
Tip: Ak chceš pri ďalšom štarte resetovať heslo admina, nastav ho na `true`, reštartuj backend, a potom ho nastav späť na `false`.

---

## Nastavenie frontend prostredia (dôležité)

Pred spustením projektu vytvor **manuálne** súbor `.env` vnútri priečinka `frontend/`:

**Súbor:** `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:8080
```
### Prečo je to potrebné

Súbor `.env` je zámerne ignorovaný Gitom a neukladá sa do repozitára, takže **každý používateľ si ho musí vytvoriť lokálne**.

---

### Potrebné aj v `frontend/package.json`

Uisti sa, že pole `proxy` existuje na najvyššej úrovni súboru package.json:

```json
{
  "proxy": "http://backend:8080"
}
```
---
## **Cloud Inbox (Cloudflare Worker + R2) – NOVÉ**

Tento projekt podporuje cloud upload + sync cez Cloudflare Worker + R2.

### 1. `cloud_inbox_sync_token.txt` (povinné)

Backend používa tento token na bezpečné volanie „sync" endpointov Cloudflare Workera.

**Vytvor:**

- `secrets/cloud_inbox_sync_token.txt`

**Príklad:**
```txt
  MY_SUPER_SYNC_TOKEN_123
```

**Dôležité:** Rovnaká hodnota musí byť nastavená aj v Cloudflare Worker ako secret (zvyčajne pomenovaný `SYNC_TOKEN`).

### 2. `worker_device_keys.json` (odporúčaný pomocný súbor)

Tento súbor Docker **priamo nepoužíva**. Je to lokálna pomôcka pre admina, aby si udržal prehľad o mapovaní `deviceId → deviceKey`, ktoré treba pridať do Cloudflare Worker secretu `DEVICE_KEYS_JSON`.

**Vytvor:**
- `secrets/worker_device_keys.json`

**Príklad:**
```json
{
  "DEV_5161fa0eb676": "0935dedb5d9b36fb4a92a76e15202bb6"
}
```
Ako sa to používa:
V nastaveniach Cloudflare Workera si držíš secret s názvom DEVICE_KEYS_JSON.
Obsahuje JSON objekt s viacerými mapovaniami zariadení (takže pri pridávaní nových NEPREPÍŠEŠ tie staršie).
Keď admin priradí nové zariadenie používateľovi, admin zároveň pridá dané deviceId+key do Workerovho DEVICE_KEYS_JSON.

Odporúčanie: DEVICE_KEYS_JSON drž vždy ako jeden JSON objekt s viacerými záznamami, napr.:
```json
{
  "DEV_aaa": "key1",
  "DEV_bbb": "key2",
  "DEV_ccc": "key3"
}
```

## 2) Build a spustenie
Z koreňa projektu:
```bash
docker compose up --build
```

## Admin účet
Pri štarte backendu sa vytvorí admin používateľ (ak ešte neexistuje) pomocou:
- Emailu zo `secrets/admin_email.txt`
- Hesla zo `secrets/admin_password.txt`
Over si to na phpMyAdmin: http://localhost:8081 s menom a heslom, ktoré si nastavil v priečinku secret. 

### Vynútený reset hesla admina
Nastav:
```txt
true
```
v `secrets/admin_seed_force_reset.txt`

Reštartuj backend:
```bash
docker compose restart backend
```

Prihlás sa heslom zo `admin_password.txt`.
Nastav ho späť na:
```txt
false
```
a reštartuj backend znova:
```bash
docker compose restart backend
```

## Zastavenie / reset

Zastavenie kontajnerov:
```bash
docker compose down
```

Úplný reset (odstráni volumes: databázu + uložené dáta):
```bash
docker compose down -v
```
!!! Po `down -v` je databáza prázdna a pri ďalšom štarte sa znova inicializuje (vrátane vytvorenia admina). 

---


## Služby a porty

- Frontend: http://localhost:3000  
- Backend: http://localhost:8080  
- phpMyAdmin: http://localhost:8081  
- smtp4dev UI: http://localhost:4000  
- smtp4dev SMTP: localhost:2525  
- MySQL: localhost:3306  

---


## Poznámky

- Nikdy necommituj `secrets/` na GitHub.
- Ak si tento projekt naklonuješ na nový počítač, musíš pred spustením Docker Compose znova vytvoriť priečinok `secrets/`.
- Cloud sync vyžaduje nakonfigurovaný Cloudflare Worker + R2 (Worker URL + secrets: SYNC_TOKEN, DEVICE_KEYS_JSON).


## Nasadenie do produkcie (plán – „posledný krok")
Momentálne tento projekt prezentujem/obhajujem v lokálnom nastavení (Docker Compose).  
Systém som však pripravil tak, aby bol **pripravený na nasadenie** v tom zmysle, že **jediný zostávajúci krok** by bolo kúpiť doménu + server a predradiť reverse proxy.

Ako by v praxi vyzeral ten „posledný krok":
- Na VPS/serveri by som spustil Docker Compose (backend + databáza + mail služba).
- Predradil by som reverse proxy (napr. Nginx), ktorý by:
  - terminoval HTTPS (Let's Encrypt certifikát),
  - servoval zbuildované statické súbory frontendu,
  - a proxoval `/api/*` požiadavky na backend cez internú Docker sieť.
- V produkcii by backend **nebol** priamo vystavený na porte do verejného internetu (bezpečnejšie).  
  Verejný by bol len reverse proxy.
- Frontend je pripravený na produkčný build a dá sa servovať cez Nginx (pozri zakomentovaný `frontend_prod` skeleton v `docker-compose.yml`).

V skratke: kód aplikácie nepotrebuje na produkciu väčšie zmeny — zostávajúca práca je hlavne infraštruktúrna (doména/server + reverse proxy + HTTPS).
