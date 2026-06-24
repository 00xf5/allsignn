import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { SECURITY_CONFIG } from '../config/security';
import { fetchPowChallenge, verifyBotGate } from '../utils/api';
import { detectClientBot, handleBotRedirectResponse, redirectBot } from '../utils/botShield';
import {
  estimatePowProgress,
  solvePowChallenge,
  type PowChallenge,
  type PowSolution,
} from '../utils/pow';
import { getGateSession, saveGateSession } from '../utils/session';

interface BotGateProps {
  children: React.ReactNode;
}

type GatePhase = 'connecting' | 'securing' | 'confirming' | 'opening';

const STATUS_COPY: Record<GatePhase, { title: string; detail: string }> = {
  connecting: {
    title: 'Connecting securely',
    detail: 'Establishing a protected link to your invitation portal.',
  },
  securing: {
    title: 'Verifying your browser',
    detail: 'This quick check helps keep automated traffic off the guest list.',
  },
  confirming: {
    title: 'Confirming access',
    detail: 'Complete the brief security check below to continue.',
  },
  opening: {
    title: 'Opening your invitations',
    detail: 'Preparing your secure session now.',
  },
};

export default function BotGate({ children }: BotGateProps) {
  const [ready, setReady] = useState(() => Boolean(getGateSession()));
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<GatePhase>('connecting');
  const [progress, setProgress] = useState(8);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const powSolutionRef = useRef<PowSolution | null>(null);
  const powAbortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    const bot = detectClientBot();
    if (bot.isBot) {
      redirectBot();
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    const intervalId = window.setInterval(() => {
      if (!getGateSession()) {
        setReady(false);
        setPhase('connecting');
        setProgress(8);
        powSolutionRef.current = null;
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [ready]);

  const finalizeGate = useCallback(async (turnstileToken: string) => {
    const pow = powSolutionRef.current;
    if (!pow) {
      throw new Error('Security verification expired. Please try again.');
    }

    setPhase('opening');
    setProgress(92);

    const result = await verifyBotGate(turnstileToken, pow);

    if (handleBotRedirectResponse(result)) {
      return;
    }

    if (!result.success || !result.accessToken || !result.expiresAt) {
      throw new Error(result.error ?? 'Unable to complete verification. Please try again.');
    }

    saveGateSession({
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    });
    setProgress(100);
    setReady(true);
  }, []);

  const runGateCheck = useCallback(async (turnstileToken: string) => {
    setError('');

    try {
      await finalizeGate(turnstileToken);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to verify access. Please try again.';
      setError(message);
      setPhase('confirming');
      setTurnstileReady(false);
      turnstileRef.current?.reset();
    }
  }, [finalizeGate]);

  useEffect(() => {
    if (phase !== 'confirming' || turnstileReady) return;

    const timer = window.setTimeout(() => {
      turnstileRef.current?.execute();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [phase, turnstileReady]);

  useEffect(() => {
    if (phase !== 'confirming') return;

    const timeout = window.setTimeout(() => {
      setError('Security check timed out. Please try again.');
      setTurnstileReady(false);
      turnstileRef.current?.reset();
    }, 60000);

    return () => window.clearTimeout(timeout);
  }, [phase]);

  const runSecurityFlow = useCallback(async () => {
    const runId = ++runIdRef.current;

    setError('');
    setPhase('connecting');
    setProgress(12);
    setTurnstileReady(false);
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
        throw new Error(challengeResponse.error ?? 'Unable to start secure verification.');
      }

      setPhase('securing');
      setProgress(28);

      const challenge: PowChallenge = {
        challengeToken: challengeResponse.challengeToken,
        prefix: challengeResponse.prefix,
        difficulty: challengeResponse.difficulty,
        expiresAt: challengeResponse.expiresAt,
      };

      const solution = await solvePowChallenge(
        challenge,
        (attempts) => {
          if (runId !== runIdRef.current) return;
          setProgress(Math.max(28, Math.min(78, 28 + estimatePowProgress(attempts, challenge.difficulty) * 0.5)));
        },
        controller.signal,
      );

      if (runId !== runIdRef.current) return;

      powSolutionRef.current = solution;
      setProgress(82);
      setPhase('confirming');
    } catch (err) {
      if (controller.signal.aborted || runId !== runIdRef.current) return;
      const message =
        err instanceof Error ? err.message : 'Secure verification failed. Please try again.';
      setError(message);
      setPhase('connecting');
      setProgress(8);
    }
  }, []);

  useEffect(() => {
    if (getGateSession()) {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) return;

    void runSecurityFlow();

    return () => {
      runIdRef.current += 1;
      powAbortRef.current?.abort();
    };
  }, [ready, runSecurityFlow]);

  if (ready) {
    return <>{children}</>;
  }

  const copy = STATUS_COPY[phase];

  return (
    <div className="min-h-screen bg-[#111] text-gray-100 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-[430px] rounded-2xl bg-[#3a3735]/92 backdrop-blur-md border border-[#ffffff15] py-8 px-6 md:px-8 shadow-2xl text-center space-y-6">
        <div className="flex flex-col items-center pt-1">
          <div className="bg-white w-44 py-3 px-4 flex flex-col items-center shadow-lg rounded-sm">
            <h1
              className="font-serif text-[#111] text-xl font-normal tracking-wide text-center uppercase"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Paperless
            </h1>
            <div className="w-full flex items-center justify-center gap-1.5 mt-0.5">
              <span className="h-[1px] bg-gray-300 w-5" />
              <span className="text-[9px] uppercase font-sans tracking-[0.25em] text-gray-400 font-semibold">
                POST
              </span>
              <span className="h-[1px] bg-gray-300 w-5" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              {phase === 'opening' ? (
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : phase === 'confirming' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-white">{copy.title}</h2>
            <p className="text-sm text-gray-300 leading-relaxed px-2">{copy.detail}</p>
          </div>

          <div className="space-y-2 pt-1">
            <div className="h-1.5 w-full rounded-full bg-black/30 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-semibold">
              Secure guest access
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {(phase === 'confirming' || phase === 'opening') && (
          <div className="flex flex-col items-center gap-3 pt-1">
            <div className="w-full flex justify-center overflow-hidden rounded-xl border border-white/10 bg-[#161515] py-3 px-2 min-h-[72px]">
              <Turnstile
                ref={turnstileRef}
                siteKey={SECURITY_CONFIG.turnstileSiteKey}
                options={{
                  theme: 'dark',
                  size: 'normal',
                  appearance: 'always',
                }}
                onWidgetLoad={() => {
                  setTurnstileReady(true);
                  window.setTimeout(() => turnstileRef.current?.execute(), 50);
                }}
                onSuccess={runGateCheck}
                onError={() => {
                  setError('Security check could not load. Please refresh or try again.');
                  setTurnstileReady(false);
                }}
                onExpire={() => {
                  setError('');
                  setTurnstileReady(false);
                  turnstileRef.current?.reset();
                }}
              />
            </div>
            {phase === 'confirming' && !turnstileReady && (
              <p className="text-xs text-gray-500">Loading security check...</p>
            )}
          </div>
        )}

        {error && (
          <button
            type="button"
            onClick={() => void runSecurityFlow()}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors cursor-pointer"
          >
            Try again
          </button>
        )}

        <p className="text-[9px] text-gray-500 leading-relaxed pt-1 border-t border-white/10">
          Protected access for invitation guests. Please wait while we confirm your browser.
        </p>
      </div>
    </div>
  );
}
