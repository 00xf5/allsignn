# Express Backend

The API runs on **Express** (Node.js). The old Supabase Edge Functions folder has been removed — **`server/` is the only backend**.

## Structure

```
server/
├── index.ts              # App entry, CORS, static /dist in production
├── config/env.ts         # Environment variables
├── lib/
│   ├── security.ts       # AES decrypt, gate tokens, Turnstile
│   ├── botShield.ts      # Bot detection + redirect pool
│   ├── pow.ts            # Proof-of-work challenge/verify
│   ├── geo.ts            # ipwho.is lookup
│   └── telegram.ts       # Telegram notifications
└── routes/
    ├── gate.ts           # POST /api/gate
    └── login.ts          # POST /api/login
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/gate` | POW challenge + Turnstile gate (issues 3-min session token) |
| POST | `/api/login` | Encrypted login (requires `X-Access-Token`) |
| GET | `/api/health` | Health check |

Legacy aliases: `/functions/v1/gate` and `/functions/v1/login`

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:3000 (Vite)
- API: http://localhost:8787 (Express)
- Vite proxies `/api` → Express

## Production

```bash
npm run build   # vite build + bundle Express → server-dist/index.mjs
npm start       # node server-dist/index.mjs on PORT (default 8787)
```

Serves `dist/` and API on one port. Listens on **`0.0.0.0`** and reads **`PORT`** from the environment.

Health check: `GET /health` or `GET /api/health`

## Pxxl deploy

Pxxl often auto-detects **Vite** and deploys static/`preview` only. POST `/api/gate` then returns **405** because Express never runs.

`pxxl.toml` sets `framework = "express"` and `entry = "server.js"` to force the Node server.

| Setting | Value |
|---------|--------|
| **Framework override** | Express (not Vite / not Static Site) |
| **Port** | `8787` |
| **Install** | `npm install` |
| **Build** | `npm run build` |
| **Start** | `npm run start:prod` |
| **Output directory** | **empty** — do not publish `dist` as static-only |

Verify after deploy:

- `GET /health` → JSON (not HTML)
- `GET /api/gate` → `{"ok":true,"endpoint":"gate","method":"POST"}`
- `POST /api/gate` → JSON (not 405 HTML)

Set env vars in the Pxxl dashboard:

```
NODE_ENV=production
APP_URL=https://your-subdomain.pxxl.pro
ALLOWED_ORIGINS=https://your-subdomain.pxxl.pro
VITE_API_BASE_URL=
```

After deploy, check **Live Logs** for:

`[startup] Allsign listening on http://0.0.0.0:8787 (production)`

Repo includes `pxxl.toml` with these defaults.

## Environment

See `.env.example` for all variables. Frontend and server must share the same `PAYLOAD_ENCRYPTION_KEY` / `VITE_PAYLOAD_ENCRYPTION_KEY`.
