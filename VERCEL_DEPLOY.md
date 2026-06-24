# Vercel Deploy

Frontend only — API stays on **Supabase Edge Functions**.

## 1. Deploy Supabase functions first

See [SUPABASE_BACKEND.md](./SUPABASE_BACKEND.md). Without deployed `gate` and `login`, the app will fail at BotGate.

## 2. Connect repo to Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import GitHub repo.
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Install command: `npm install`

`vercel.json` is included for SPA routing.

## 3. Environment variables (Vercel → Settings → Environment Variables)

Set for **Production** (and Preview if you use it):

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://nxzvpcbudbqotujuuczo.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `VITE_PAYLOAD_ENCRYPTION_KEY` | Same as Supabase `PAYLOAD_ENCRYPTION_KEY` |

Redeploy after changing any `VITE_*` variable (they are baked in at build time).

## 4. Cloudflare Turnstile

Add your Vercel domain (e.g. `your-app.vercel.app`) to Turnstile **allowed domains**.

## 5. Verify

1. Open your Vercel URL → BotGate should load (black screen + Turnstile).
2. DevTools → Network → `POST` to `…supabase.co/functions/v1/gate` → **200 JSON** (not 405).
3. Complete gate → app loads.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error | Redeploy Supabase functions (CORS headers are in `_shared/security.ts`) |
| 401 on functions | Check `VITE_SUPABASE_ANON_KEY`; ensure `verify_jwt = false` in `supabase/config.toml` |
| Decrypt / login fails | Match `VITE_PAYLOAD_ENCRYPTION_KEY` ↔ Supabase `PAYLOAD_ENCRYPTION_KEY` |
| Turnstile fails | Add Vercel domain to Turnstile; check `TURNSTILE_SECRET` in Supabase |
