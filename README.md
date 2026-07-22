# Rykochet.io

Physics-based .io multiplayer game. Client (TypeScript → Vite bundle) + Node server (Fastify + TypeScript) + PostgreSQL. Deployed behind Cloudflare with nginx on the origin box.

Domain: **rykochet.io** · Staging: **dev.rykochet.io** · Origin IP: **45.76.56.138**

---

## Repo layout

```
client/        Vite + TS. UI, later the game renderer.
server/        Fastify + TS. HTTP API + WebSockets.
shared/        Types shared between client + server.
deploy/
  nginx/       Site configs for rykochet.io and dev.rykochet.io.
  postgres/    init.sql for the initial schema.
ecosystem.config.cjs   PM2 process manager config (prod:3000, dev:3001).
```

## Local development

```
npm install
cp .env.example .env         # then edit values
npm run dev                  # client on :5173, server on :3000
```

Client dev server proxies `/api` and `/ws` to the server, so you can call `fetch('/api/health')` with no CORS drama.

```
npm run lint      # ESLint
npm run format    # Prettier
npm run typecheck # tsc -b across all packages
npm run build     # build shared + server + client
```

Pre-commit: `husky` + `lint-staged` runs `eslint --fix` and `prettier --write` on staged files. First-time only, on a fresh clone:

```
npm run prepare   # installs the git hook
```

---

## Server (45.76.56.138) — first-time setup

Run these once, as root.

### 1. Base packages + firewall

```
apt update && apt upgrade -y
apt install -y curl git build-essential ufw nginx
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

### 2. Node 20 + PM2

```
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
pm2 startup systemd -u root --hp /root
# paste + run the command PM2 prints
mkdir -p /var/log/rykochet
```

### 3. Postgres 16

```
apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql

sudo -u postgres psql -c "CREATE USER rykochet WITH PASSWORD 'CHANGE_ME_STRONG';"
sudo -u postgres psql -c "CREATE DATABASE rykochet OWNER rykochet;"
sudo -u postgres psql -c "CREATE DATABASE rykochet_dev OWNER rykochet;"
```

### 4. Cloudflare Origin Certificate

In the Cloudflare dashboard for rykochet.io:

- **DNS** → add A records (proxy 🟠 ON):
  - `rykochet.io      → 45.76.56.138`
  - `www              → 45.76.56.138`
  - `dev              → 45.76.56.138`
- **SSL/TLS → Overview** → set mode to **Full (strict)**.
- **SSL/TLS → Origin Server → Create Certificate** — hostnames: `rykochet.io, *.rykochet.io`. Download the certificate + private key.

On the server:

```
mkdir -p /etc/ssl/cloudflare
nano /etc/ssl/cloudflare/rykochet.io.pem   # paste certificate
nano /etc/ssl/cloudflare/rykochet.io.key   # paste private key
chmod 600 /etc/ssl/cloudflare/rykochet.io.key
```

### 5. Deploy the app

```
mkdir -p /var/www
cd /var/www
git clone https://github.com/ep1764/rykochet.git
cd rykochet
cp .env.example .env
nano .env          # set DATABASE_URL, SESSION_SECRET, etc.

npm ci
npm run build

# Load database schema.
sudo -u postgres psql -d rykochet     -f deploy/postgres/init.sql
sudo -u postgres psql -d rykochet_dev -f deploy/postgres/init.sql

# Start both prod (:3000) + dev (:3001) via PM2.
pm2 start ecosystem.config.cjs
pm2 save
```

### 6. Install nginx site configs

```
cp deploy/nginx/cloudflare-real-ip.conf /etc/nginx/cloudflare-real-ip.conf
cp deploy/nginx/rykochet.io.conf      /etc/nginx/sites-available/rykochet.io.conf
cp deploy/nginx/dev.rykochet.io.conf  /etc/nginx/sites-available/dev.rykochet.io.conf
ln -sf /etc/nginx/sites-available/rykochet.io.conf     /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dev.rykochet.io.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
```

Visit https://rykochet.io — you should see the login screen.

---

## Redeploy loop

```
cd /var/www/rykochet
git pull
npm ci
npm run build
pm2 reload all
```

## Useful PM2 commands

```
pm2 status
pm2 logs rykochet-prod
pm2 logs rykochet-dev
pm2 reload rykochet-prod
pm2 restart all
```

---

## What's in this scaffold vs. what's not

**Included now:** the UI shell (login + main menu HTML/CSS in the emerald theme), tooling (Vite, TypeScript, ESLint, Prettier, husky, Terser, javascript-obfuscator), server skeleton (Fastify + Postgres + role middleware), the DB schema, PM2 config, nginx configs (with Cloudflare real-IP), and this README.

**Not yet:** auth logic (Argon2 hashing, session tokens, remember-me), the admin panel HTML/logic, avatar composition pipeline, map editor, physics engine, WebSocket game protocol, recording playback. These land in later passes.
