import { Router } from 'express';
import { evaluateBotSignals, sendBotRedirect } from '../lib/botShield.ts';
import { issuePowChallenge, verifyPowSolution } from '../lib/pow.ts';
import { getClientIp, issueGateToken, verifyTurnstile } from '../lib/security.ts';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const body = req.body ?? {};

    if (body.action === 'challenge') {
      const botCheck = evaluateBotSignals(req, body.clientSignals);
      if (botCheck.isBot) {
        sendBotRedirect(res, botCheck.reason);
        return;
      }

      const challenge = await issuePowChallenge();
      res.json({
        success: true,
        action: 'challenge',
        ...challenge,
      });
      return;
    }

    const botCheck = evaluateBotSignals(req, body.clientSignals);
    if (botCheck.isBot) {
      sendBotRedirect(res, botCheck.reason);
      return;
    }

    const powCheck = await verifyPowSolution(body.pow);
    if (!powCheck.valid) {
      res.status(403).json({
        success: false,
        error: 'Proof-of-work verification failed. Please refresh and try again.',
        reason: powCheck.reason,
      });
      return;
    }

    if (!body.turnstileToken) {
      res.status(400).json({
        success: false,
        error: 'Anti-bot verification required.',
      });
      return;
    }

    const clientIp = getClientIp(req);
    const verified = await verifyTurnstile(body.turnstileToken, clientIp);
    if (!verified) {
      res.status(403).json({
        success: false,
        error: 'Security check failed. Please complete the checkbox and try again.',
        reason: 'failed-turnstile',
      });
      return;
    }

    const session = await issueGateToken();
    res.json({
      success: true,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Gate verification failed.',
    });
  }
});

export default router;
