# Express Backend

The API runs on **Express** (Node.js). Supabase Edge Functions are no longer used.

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
npm run build
npm start
```

Serves `dist/` and API on one port (`PORT`, default **8787**).

## Environment

See `.env.example` for all variables. Frontend and server must share the same `PAYLOAD_ENCRYPTION_KEY` / `VITE_PAYLOAD_ENCRYPTION_KEY`.
