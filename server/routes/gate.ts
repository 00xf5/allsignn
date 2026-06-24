import { Router } from 'express';
import { evaluateBotSignals, sendBotRedirect } from '../lib/botShield.ts';
import { issuePowChallenge, verifyPowSolution } from '../lib/pow.ts';
import { getClientIp, issueGateToken, verifyTurnstile } from '../lib/security.ts';
import { requireClientSignals } from '../lib/validation.ts';
import { gateRateLimit } from '../middleware/rateLimit.ts';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ ok: true, endpoint: 'gate', method: 'POST' });
});

router.post('/', gateRateLimit, async (req, res) => {
  try {
    const body = req.body ?? {};

    if (!requireClientSignals(body)) {
      res.status(400).json({
        success: false,
        error: 'Client verification signals are required.',
      });
      return;
    }

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

    if (!body.turnstileToken || typeof body.turnstileToken !== 'string') {
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
