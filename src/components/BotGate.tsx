import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { SECURITY_CONFIG } from '../config/security';
import { fetchPowChallenge, verifyBotGate } from '../utils/api';
import { detectClientBot, handleBotRedirectResponse, redirectBot } from '../utils/botShield';
import { estimatePowProgress, solvePowChallenge, type PowSolution } from '../utils/pow';
import { getGateSession, saveGateSession } from '../utils/session';

interface BotGateProps {
  children: React.ReactNode;
}

type PowPhase = 'idle' | 'solving' | 'ready' | 'error';

export default function BotGate({ children }: BotGateProps) {
  const [ready, setReady] = useState(() => Boolean(getGateSession()));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [powPhase, setPowPhase] = useState<PowPhase>('idle');
  const [powProgress, setPowProgress] = useState(0);
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
        setError('');
        setPowPhase('idle');
        setPowProgress(0);
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
    setError('');

    try {
      const result = await verifyBotGate(token, pow);

      if (handleBotRedirectResponse(result)) {
        setSubmitting(false);
        return;
      }

      if (!result.success || !result.accessToken || !result.expiresAt) {
        throw new Error(result.error ?? 'Verification failed. Please try again.');
      }

      saveGateSession({
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
      });
      setSubmitting(false);
      setReady(true);
    } catch (err) {
      finalizingRef.current = false;
      turnstileTokenRef.current = null;
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      turnstileRef.current?.reset();
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
    setPowPhase('idle');
    setPowProgress(0);

    const controller = new AbortController();
    powAbortRef.current = controller;

    try {
      setPowPhase('solving');
      const challengeResponse = await fetchPowChallenge();
      if (runId !== runIdRef.current) return;

      if (
        !challengeResponse.success ||
        !challengeResponse.challengeToken ||
        !challengeResponse.prefix ||
        !challengeResponse.difficulty ||
        !challengeResponse.expiresAt
      ) {
        throw new Error(challengeResponse.error ?? 'Unable to start verification.');
      }

      const solution = await solvePowChallenge(
        {
          challengeToken: challengeResponse.challengeToken,
          prefix: challengeResponse.prefix,
          difficulty: challengeResponse.difficulty,
          expiresAt: challengeResponse.expiresAt,
        },
        (attempts) => {
          setPowProgress(estimatePowProgress(attempts, challengeResponse.difficulty!));
        },
        controller.signal,
      );

      if (runId !== runIdRef.current) return;

      powSolutionRef.current = solution;
      setPowProgress(100);
      setPowPhase('ready');
      void tryFinalize();
    } catch (err) {
      if (controller.signal.aborted || runId !== runIdRef.current) return;
      setPowPhase('error');
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    }
  }, [tryFinalize]);

  const restartFlow = useCallback(() => {
    runIdRef.current += 1;
    powAbortRef.current?.abort();
    powSolutionRef.current = null;
    turnstileTokenRef.current = null;
    finalizingRef.current = false;
    setSubmitting(false);
    setPowPhase('idle');
    setPowProgress(0);
    setError('');
    setFlowKey((key) => key + 1);
  }, []);

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
  const showTurnstile = powPhase === 'ready' && !submitting;

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

        {powPhase === 'solving' && (
          <div className="mb-8 space-y-3">
            <div className="h-1 w-full max-w-xs mx-auto rounded-full bg-[#262626] overflow-hidden">
              <div
                className="h-full bg-[#525252] transition-all duration-300 ease-out"
                style={{ width: `${Math.max(powProgress, 8)}%` }}
              />
            </div>
            <p className="text-[#737373] text-[13px]">Preparing security check…</p>
          </div>
        )}

        <div className="flex justify-center items-center min-h-[72px] mb-10">
          {showTurnstile && (
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
                setError('Security check could not load. Please refresh the page.');
              }}
              onExpire={() => {
                turnstileTokenRef.current = null;
                finalizingRef.current = false;
                setSubmitting(false);
                turnstileRef.current?.reset();
              }}
            />
          )}
        </div>

        <p className="text-[#737373] text-[13px]">
          {submitting
            ? 'Verifying…'
            : powPhase === 'ready'
              ? 'Verify you are human to continue'
              : powPhase === 'solving'
                ? 'This usually takes a few seconds'
                : 'Starting security check…'}
        </p>

        {error && (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-[#fca5a5]">{error}</p>
            <button
              type="button"
              onClick={restartFlow}
              className="text-[13px] text-[#a3a3a3] hover:text-white transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
