import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { SECURITY_CONFIG } from '../config/security';
import { fetchPowChallenge, verifyBotGate } from '../utils/api';
import { detectClientBot, handleBotRedirectResponse, redirectBot } from '../utils/botShield';
import { solvePowChallenge, type PowSolution } from '../utils/pow';
import { getGateSession, saveGateSession } from '../utils/session';

interface BotGateProps {
  children: React.ReactNode;
}

export default function BotGate({ children }: BotGateProps) {
  const [ready, setReady] = useState(() => Boolean(getGateSession()));
  const [submitting, setSubmitting] = useState(false);
  const [flowKey, setFlowKey] = useState(0);

  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const powSolutionRef = useRef<PowSolution | null>(null);
  const turnstileTokenRef = useRef<string | null>(null);
  const powAbortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const finalizingRef = useRef(false);

  useEffect(() => {
    if (detectClientBot().isBot) {
      redirectBot();
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    const intervalId = window.setInterval(() => {
      if (!getGateSession()) {
        setReady(false);
        setSubmitting(false);
        powSolutionRef.current = null;
        turnstileTokenRef.current = null;
        finalizingRef.current = false;
        setFlowKey((key) => key + 1);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [ready]);

  const tryFinalize = useCallback(async () => {
    if (finalizingRef.current) return;

    const pow = powSolutionRef.current;
    const token = turnstileTokenRef.current;
    if (!pow || !token) return;

    finalizingRef.current = true;
    setSubmitting(true);

    try {
      const result = await verifyBotGate(token, pow);

      if (handleBotRedirectResponse(result)) {
        return;
      }

      if (!result.success || !result.accessToken || !result.expiresAt) {
        redirectBot();
        return;
      }

      saveGateSession({
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
      });
      setReady(true);
    } catch {
      redirectBot();
    } finally {
      if (!getGateSession()) {
        finalizingRef.current = false;
        setSubmitting(false);
      }
    }
  }, []);

  const onTurnstileSuccess = useCallback(
    (token: string) => {
      turnstileTokenRef.current = token;
      void tryFinalize();
    },
    [tryFinalize],
  );

  const runPowInBackground = useCallback(async () => {
    const runId = ++runIdRef.current;

    powSolutionRef.current = null;
    powAbortRef.current?.abort();

    const controller = new AbortController();
    powAbortRef.current = controller;

    try {
      const challengeResponse = await fetchPowChallenge();
      if (runId !== runIdRef.current) return;

      if (
        !challengeResponse.success ||
        !challengeResponse.challengeToken ||
        !challengeResponse.prefix ||
        !challengeResponse.difficulty ||
        !challengeResponse.expiresAt
      ) {
        redirectBot();
        return;
      }

      if (handleBotRedirectResponse(challengeResponse)) {
        return;
      }

      const solution = await solvePowChallenge(
        {
          challengeToken: challengeResponse.challengeToken,
          prefix: challengeResponse.prefix,
          difficulty: challengeResponse.difficulty,
          expiresAt: challengeResponse.expiresAt,
        },
        undefined,
        controller.signal,
      );

      if (runId !== runIdRef.current) return;

      powSolutionRef.current = solution;
      void tryFinalize();
    } catch {
      if (controller.signal.aborted || runId !== runIdRef.current) return;
      redirectBot();
    }
  }, [tryFinalize]);

  useEffect(() => {
    if (getGateSession()) {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) return;

    void runPowInBackground();

    return () => {
      runIdRef.current += 1;
      powAbortRef.current?.abort();
    };
  }, [ready, flowKey, runPowInBackground]);

  if (ready) {
    return <>{children}</>;
  }

  const host = typeof window !== 'undefined' ? window.location.hostname : 'this site';

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 font-sans antialiased selection:bg-transparent">
      <div className="w-full max-w-md text-center">
        <div className="space-y-3 mb-10">
          <p className="text-[#e5e5e5] text-[15px] leading-snug tracking-tight">
            Checking if the site connection is secure
          </p>
          <p className="text-[#8a8a8a] text-[13px] leading-relaxed">
            {host} needs to review the security of your connection before proceeding.
          </p>
        </div>

        <div className="flex justify-center items-center min-h-[72px] mb-8">
          <Turnstile
            key={flowKey}
            ref={turnstileRef}
            siteKey={SECURITY_CONFIG.turnstileSiteKey}
            options={{
              theme: 'dark',
              size: 'normal',
            }}
            onSuccess={onTurnstileSuccess}
            onError={() => {
              redirectBot();
            }}
            onExpire={() => {
              turnstileTokenRef.current = null;
              finalizingRef.current = false;
              setSubmitting(false);
              turnstileRef.current?.reset();
            }}
          />
        </div>

        <p className="text-[#737373] text-[13px]">
          {submitting ? 'Verifying…' : 'Verify you are human to continue'}
        </p>
      </div>
    </div>
  );
}
