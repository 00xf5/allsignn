# Deploy on Render

Single **Web Service** runs Express + the built React app on one URL. Render injects `PORT` and `RENDER_EXTERNAL_URL` automatically.

## Quick deploy (Blueprint)

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect the repo — Render reads `render.yaml`.
4. Set **secret env vars** when prompted (Turnstile, encryption keys, Telegram, etc.).
5. Deploy. Your URL will look like `https://allsign.onrender.com`.

## Manual Web Service

| Setting | Value |
|---------|--------|
| **Type** | Web Service |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` |

Do **not** create a separate Static Site. Express serves `dist/` and handles `POST /api/*`.

## Verify after deploy

| Check | Expected |
|-------|----------|
| `GET /health` | JSON `{"ok":true,...}` |
| `GET /api/gate` | JSON `{"ok":true,"endpoint":"gate",...}` |
| `POST /api/gate` | JSON (not 405) |
| Main page | Black BotGate → app (not blank white) |

Logs should show:

```
[startup] Allsign listening on http://0.0.0.0:XXXX (production)
[startup] Serving frontend from /dist
```

## Environment variables

Set these in **Render → Service → Environment**.

### Required for production

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` (set in `render.yaml`) |
| `VITE_API_BASE_URL` | Leave **empty** for same-origin `/api` |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key — **needed at build time** |
| `VITE_PAYLOAD_ENCRYPTION_KEY` | Must **exactly match** `PAYLOAD_ENCRYPTION_KEY` |
| `TURNSTILE_SECRET` | Cloudflare Turnstile secret |
| `PAYLOAD_ENCRYPTION_KEY` | Server AES key (same as `VITE_*` above) |
| `GATE_SESSION_SECRET` | Random string for signed gate tokens |
| `POW_SECRET` | Random string for POW challenges (or reuse gate secret) |

### Optional

| Variable | Default / notes |
|----------|-----------------|
| `APP_URL` | Auto from `RENDER_EXTERNAL_URL` if unset |
| `ALLOWED_ORIGINS` | Auto-includes Render URL origin if unset |
| `TELEGRAM_BOTS` | JSON array `[{"token":"...","chatId":"..."}]` |
| `GEMINI_API_KEY` | Only if using Gemini features |
| `POW_DIFFICULTY` | `5` |
| `RATE_LIMIT_*` | See `.env.example` |

### Render-provided (do not set manually)

| Variable | Purpose |
|----------|---------|
| `PORT` | Port Express listens on |
| `RENDER_EXTERNAL_URL` | e.g. `https://allsign.onrender.com` — used for CORS |

## Custom domain

1. Render → **Settings** → **Custom Domains** → add your domain.
2. Set `APP_URL=https://yourdomain.com`.
3. Set `ALLOWED_ORIGINS=https://yourdomain.com`.
4. **Redeploy** so Vite rebuilds with any changed `VITE_*` values.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:8787 (Vite proxies `/api`)

## Architecture

```
Browser
  → GET  /              → Express → dist/index.html
  → GET  /assets/*      → Express → dist/assets/*
  → POST /api/gate      → Express gate route (POW + Turnstile)
  → POST /api/login     → Express login route (encrypted)
  → GET  /health        → Express health (Render health check)
```

Legacy aliases: `/functions/v1/gate`, `/functions/v1/login`

## Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| Blank white page | JS bundle 404 or build failed | Check build logs; confirm `dist/` exists |
| POST `/api/gate` → 405 | Static host, not Express | Use **Web Service**, not Static Site |
| `/health` returns HTML | Same as above | Fix service type / start command |
| BotGate “Security service unavailable” | API down or CORS | Check logs; set secrets; confirm `/health` JSON |
| Turnstile fails | Wrong site key / domain | Add Render URL to Turnstile allowed domains |
| Login decrypt fails | Key mismatch | `VITE_PAYLOAD_ENCRYPTION_KEY` must match `PAYLOAD_ENCRYPTION_KEY`; redeploy after changing |

## Free tier note

Render free web services spin down after inactivity. First request after sleep may take ~30s.
