<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Allsign

React + Express app (BotGate, encrypted login API, Turnstile, POW).

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env
# Edit .env with your Turnstile keys and secrets
npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:8787 (Vite proxies `/api`)

## Deploy on Render

See **[RENDER_DEPLOY.md](./RENDER_DEPLOY.md)** for the full checklist.

**Quick steps:**

1. Push to GitHub.
2. Render → **New** → **Blueprint** → connect repo (`render.yaml` included).
3. Set secret env vars (Turnstile, encryption keys, `TELEGRAM_BOTS`, etc.).
4. Deploy → open `https://<service>.onrender.com/health` (must return JSON).

| Setting | Value |
|---------|--------|
| Build | `npm install && npm run build` |
| Start | `npm start` |
| Health check | `/health` |

**Important:** Use one **Web Service** (not a Static Site). Express serves the UI and `POST /api/*`.

## Docs

- [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) — production deploy + env vars + troubleshooting  
- [EXPRESS_BACKEND.md](./EXPRESS_BACKEND.md) — API structure and endpoints
