// @ts-nocheck — Deno runtime file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  botRedirectResponse,
  evaluateBotSignals,
  evaluateIpThreat,
  getClientIp,
  requireClientSignals,
} from '../_shared/botShield.ts';
import { powChallengeResponse, verifyPowSolution } from '../_shared/pow.ts';
import {
  handleOptions,
  issueGateToken,
  jsonResponse,
  verifyTurnstile,
} from '../_shared/security.ts';

async function runBotChecks(req: Request, clientSignals: unknown, checkIp = true) {
  const botCheck = evaluateBotSignals(req, clientSignals);
  if (botCheck.isBot) {
    return botRedirectResponse(botCheck.reason);
  }

  if (checkIp) {
    const ipCheck = await evaluateIpThreat(req);
    if (ipCheck.isBot) {
      return botRedirectResponse(ipCheck.reason);
    }
  }

  return null;
}

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

    if (!requireClientSignals(body?.clientSignals)) {
      return botRedirectResponse('missing-client-signals');
    }

    if (body?.action === 'challenge') {
      const blocked = await runBotChecks(req, body.clientSignals, false);
      if (blocked) return blocked;
      return powChallengeResponse();
    }

    const blocked = await runBotChecks(req, body.clientSignals);
    if (blocked) return blocked;

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

    if (!body?.turnstileToken || typeof body.turnstileToken !== 'string') {
      return jsonResponse(
        { success: false, error: 'Anti-bot verification required.' },
        400,
      );
    }

    const verified = await verifyTurnstile(body.turnstileToken);
    if (!verified) {
      return jsonResponse(
        {
          success: false,
          error: 'Security check failed. Please complete the checkbox and try again.',
          reason: 'failed-turnstile',
        },
        403,
      );
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
