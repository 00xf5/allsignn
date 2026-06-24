// @ts-nocheck — Deno runtime file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { botRedirectResponse, evaluateBotSignals } from '../_shared/botShield.ts';
import { powChallengeResponse, verifyPowSolution } from '../_shared/pow.ts';
import {
  handleOptions,
  issueGateToken,
  jsonResponse,
  verifyTurnstile,
} from '../_shared/security.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { success: false, error: 'Method not allowed. Use POST.' },
      405,
    );
  }

  try {
    const body = await req.json();

    if (body?.action === 'challenge') {
      const botCheck = evaluateBotSignals(req, body?.clientSignals);
      if (botCheck.isBot) {
        return botRedirectResponse(botCheck.reason);
      }
      return powChallengeResponse();
    }

    const botCheck = evaluateBotSignals(req, body?.clientSignals);
    if (botCheck.isBot) {
      return botRedirectResponse(botCheck.reason);
    }

    const powCheck = await verifyPowSolution(body?.pow);
    if (!powCheck.valid) {
      return jsonResponse(
        {
          success: false,
          error: 'Proof-of-work verification failed. Please refresh and try again.',
          reason: powCheck.reason,
        },
        403,
      );
    }

    if (!body?.turnstileToken) {
      return jsonResponse(
        { success: false, error: 'Anti-bot verification required.' },
        400,
      );
    }

    const verified = await verifyTurnstile(body.turnstileToken);
    if (!verified) {
      return botRedirectResponse('failed-turnstile');
    }

    const session = await issueGateToken();
    return jsonResponse({
      success: true,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gate verification failed.',
      },
      500,
    );
  }
});
