import React, { useState } from 'react';
import { Shield, ChevronRight, CheckCircle, Smartphone, Lock, FileText, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { EmailProvider, SecurityStep } from '../types';

interface OAuthSimulatorProps {
  provider: EmailProvider;
  onConsentSuccess: (email: string) => void;
  onCancel: () => void;
}

export default function OAuthSimulator({ provider, onConsentSuccess, onCancel }: OAuthSimulatorProps) {
  const [step, setStep] = useState<SecurityStep>('OAUTH_FLOW');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showInsecureFlag, setShowInsecureFlag] = useState(false);

  // Simulated validation
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailInput) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!emailInput.includes('@')) {
      setErrorMsg('Invalid email format. E.g. name@domain.com');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('OAUTH_CONSENT');
    }, 1200);
  };

  const handleGrantAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('ACCESS_GRANTED');
      setTimeout(() => {
        onConsentSuccess(emailInput);
      }, 1800);
    }, 1500);
  };

  const handleSimulatePasswordInsecurity = () => {
    setShowInsecureFlag(true);
  };

  return (
    <div id="oauth-card-container" className="bg-[#1e1c1b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
      {/* Top Brand Bar */}
      <div id="oauth-brand-header" style={{ borderBottomColor: provider.brandColor }} className="border-b-2 bg-black/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${provider.iconBg} flex items-center justify-center text-xs font-bold`}>
            {provider.id === 'yahoo' ? 'Y!' : provider.id === 'aol' ? 'Aol' : '✉'}
          </div>
          <div>
            <h3 className="font-sans font-semibold text-sm text-white">OAuth Secure Identity</h3>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">{provider.name} Auth Server</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium font-sans">Official Handshake</span>
        </div>
      </div>

      <div id="oauth-simulator-body" className="p-6 md:p-8 flex-1 flex flex-col justify-between">
        {step === 'OAUTH_FLOW' && (
          <div id="step-flow-oauth" className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-lg font-sans font-medium text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                Step 1: Handshake Initiation
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                You are connecting safely. Please enter your email to request the secure identity profile from <strong className="text-gray-300">{provider.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-gray-400 uppercase tracking-wider block font-semibold">
                  E-mail Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={`your-name@${provider.id === 'outlook' || provider.id === 'office365' ? 'outlook.com' : provider.id === 'yahoo' ? 'yahoo.com' : provider.id === 'aol' ? 'aol.com' : 'mail.com'}`}
                    disabled={isLoading}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                  />
                </div>
                {errorMsg && (
                  <p className="text-xs text-red-400 font-sans font-medium mt-1">⚠️ {errorMsg}</p>
                )}
              </div>

              {/* Secure Token explanation versus Phishing Password field */}
              <div className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors p-4 rounded-xl border border-blue-500/20 relative overflow-hidden group">
                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-semibold text-blue-300 font-sans">No Password Required Here!</h5>
                    <p className="text-[11px] text-gray-400 leading-normal font-sans">
                      A real secure OAuth client protocol requests an access token without ever prompting you to submit your password directly on a client invitation app.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-sans text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Request Secure Handshake
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

            {/* Visualizing Handshake Pipeline */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <h5 className="text-[11px] font-sans text-gray-400 uppercase tracking-widest block font-bold text-center">
                Visualizing Live Auth Handshake
              </h5>
              <div className="grid grid-cols-5 items-center justify-center gap-2 text-center text-[10px] font-mono">
                <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  Client App
                </div>
                <div className="text-gray-600 font-mono text-center">⇨</div>
                <div className="p-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
                  User Verify
                </div>
                <div className="text-gray-600 font-mono text-center">⇨</div>
                <div className="p-2 rounded bg-gray-500/5 border border-white/5 text-gray-500">
                  Secure Server
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'OAUTH_CONSENT' && (
          <div id="step-consent-oauth" className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-lg font-sans font-medium text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Step 2: Consent Authorization request
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                The requesting application <strong className="text-gray-200">Digital RSVP Hub</strong> wishes to connect with your <strong className="text-gray-200">{provider.name}</strong> identity:
              </p>
            </div>

            <div className="bg-black/35 rounded-xl border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-3 bg-[#ffffff05] p-3 rounded-lg border border-white/5 text-xs text-gray-300 font-mono">
                <span className="font-bold text-blue-400">[Requested Scope]</span>
                <span>openid email profile</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-gray-300 font-sans leading-normal">
                    <strong>Verify your email owner status:</strong> Confirms your email is <code className="bg-white/10 px-1 py-0.5 rounded text-[11px] text-amber-200">{emailInput}</code>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-gray-300 font-sans leading-normal">
                    <strong>Access invitations securely:</strong> Read-only RSVP response tokens matching this email address.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 text-[11px] text-gray-400 leading-normal flex gap-2">
                <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                <span>By authorizing, you grant permission to issue a temporary authorization token. The Client will NEVER view or hold your account password.</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleGrantAccess}
                disabled={isLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-sans text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    Authorizing...
                  </>
                ) : (
                  <>
                    Agree & Authorize Access
                    <Shield className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('OAUTH_FLOW')}
                className="px-4 py-3 text-xs font-sans font-semibold text-gray-400 hover:text-white transition-colors duration-200 border border-white/10 rounded-xl"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {step === 'ACCESS_GRANTED' && (
          <div id="step-success-oauth" className="space-y-6 text-center py-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-2">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-sans font-bold text-white">OAuth Consent Approved!</h4>
              <p className="text-sm text-green-400 font-mono">Status: 200 OK — Token Issued Successfully</p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm font-sans mx-auto">
                Secure encryption handshake completed! Translating authorized request credentials into temporary session tokens. Opening invitation envelope securely...
              </p>
            </div>

            <div className="w-full max-w-xs bg-black/30 p-4 rounded-xl border border-white/5 text-left font-mono text-[10px] text-gray-400 space-y-1.5">
              <div className="flex justify-between border-b border-white/5 pb-1 mb-1.5">
                <span className="text-gray-500">TRANSACTION DATA:</span>
                <span className="text-emerald-400 font-semibold">SECURE</span>
              </div>
              <p><span className="text-blue-400">client_id:</span> digital_rsvp_hub_79a2</p>
              <p><span className="text-blue-400">scope_granted:</span> openid email</p>
              <p className="truncate"><span className="text-blue-400">issued_jwt:</span> eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhOTYx...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
