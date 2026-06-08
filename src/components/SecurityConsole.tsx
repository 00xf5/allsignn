import React, { useState } from 'react';
import { Network, Search, ShieldCheck, MailWarning, FileKey, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface DomainRecord {
  spf: string;
  dkim: string;
  dmarc: string;
  secure: boolean;
  notes: string;
}

export default function SecurityConsole() {
  const [domainInput, setDomainInput] = useState('greenenvelope.com');
  const [selectedRecord, setSelectedRecord] = useState<DomainRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Database of simulated records
  const domainDB: Record<string, DomainRecord> = {
    'greenenvelope.com': {
      spf: 'v=spf1 include:mcsv.net include:sendgrid.net include:mailgun.org include:aspmx.googlemail.com ~all',
      dkim: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv67S9lS1gOAdN87p+376v6Y6XfH...',
      dmarc: 'v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@greenenvelope.com',
      secure: true,
      notes: "Fully Optimized: domain implements 'p=reject' enforcing complete interception of fraudulent emails."
    },
    'paperlesspost.com': {
      spf: 'v=spf1 include:spf.mandrillapp.com include:sendgrid.net include:servers.mcsv.net ~all',
      dkim: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyYtX/dFGr7+x8Hk/2R3jS7...',
      dmarc: 'v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@paperlesspost.com',
      secure: true,
      notes: "Fully Secure: domain implements 'p=quarantine' redirecting non-verified envelopes safely to the spam folder."
    },
    'gmail.com': {
      spf: 'v=spf1 redirect=_spf.google.com',
      dkim: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1vStyRPlm98fD970+Xm...',
      dmarc: 'v=DMARC1; p=none; sp=quarantine; rua=mailto:mailauth-reports@google.com',
      secure: true,
      notes: "Consumer Safe: Google handles and signs consumer mail envelopes automatically."
    },
    'unsecured-inc.org': {
      spf: 'v=spf1 +all',
      dkim: '',
      dmarc: '',
      secure: false,
      notes: "CRITICAL SECURITY RISK: '+all' authorises ANY server on the internet to send mail on their behalf. No DKIM keys publicised. Vulnerable to easy spoofing."
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setIsSearching(true);
    setSelectedRecord(null);

    const targetDomain = domainInput.toLowerCase().trim();

    setTimeout(() => {
      setIsSearching(false);
      if (domainDB[targetDomain]) {
        setSelectedRecord(domainDB[targetDomain]);
      } else {
        // Generate generic fallback
        setSelectedRecord({
          spf: 'v=spf1 include:_spf.hostedmx.net ~all',
          dkim: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAfallback...',
          dmarc: 'v=DMARC1; p=none; rua=mailto:dmarc-reports@' + targetDomain,
          secure: false,
          notes: "Basic Security: Active SPF policy found. However, DMARC 'p=none' offers zero action shielding against spoofed mail sender fields."
        });
      }
    }, 1000);
  };

  return (
    <div id="security-module-container" className="w-full max-w-5xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Search Console Selector */}
      <div className="md:col-span-5 bg-[#1b1918] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-sans font-medium text-white font-sans">DNS & Email Protection Studio</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Understand the cryptographic shields protecting email ecosystems from spoofing. Search domains to check security records.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-3 font-sans">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Query Target Domain</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="e.g. greenenvelope.com"
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Inspect
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Quick test samples:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.keys(domainDB).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDomainInput(d);
                      setSelectedRecord(domainDB[d]);
                    }}
                    className="text-[10px] font-mono py-1 px-2.5 rounded-md bg-white/5 border border-white/5 hover:border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Educational Overview Card */}
          <div className="bg-black/25 rounded-xl border border-white/5 p-4 space-y-3 shrink-0">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest font-sans flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              The Security Trinity
            </h4>
            <div className="space-y-3 text-[11px] leading-relaxed font-sans text-gray-300">
              <div>
                <strong className="text-white block font-medium">1. SPF (Sender Policy Framework)</strong>
                <span className="text-gray-400 text-[10px]">A DNS record detailing exactly which IP addresses/servers are authorized to send emails for your domain.</span>
              </div>
              <div>
                <strong className="text-white block font-medium">2. DKIM (DomainKeys Identified Mail)</strong>
                <span className="text-gray-400 text-[10px]">Adds a cryptographic digital signature to headers, proving the envelope contents were not altered in transit.</span>
              </div>
              <div>
                <strong className="text-white block font-medium">3. DMARC (Domain Message Authentication)</strong>
                <span className="text-gray-400 text-[10px]">Command rules instructing receiving mailboxes what to do with messages that fail SPF or DKIM (reject, quarantine, or none).</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Security Logs Console */}
      <div className="md:col-span-7 bg-[#0b0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden relative">
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">DNS Record Log Analyzer</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">DIG QUERY PORT: 53</span>
          </div>

          {isSearching ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin"></div>
              <p className="text-xs font-mono text-gray-400">DNS TXT lookup in progress...</p>
            </div>
          ) : selectedRecord ? (
            <div className="space-y-4">
              {/* Security Shield Banner */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${selectedRecord.secure ? 'bg-[#064e3b]/10 border-emerald-500/20 text-emerald-300' : 'bg-[#7f1d1d]/10 border-red-500/20 text-red-300'}`}>
                {selectedRecord.secure ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <p className="text-xs font-sans font-medium">{selectedRecord.notes}</p>
              </div>

              {/* Records Highlight Console */}
              <div className="space-y-3 font-mono text-[11px]">
                {/* SPF console record */}
                <div className="space-y-1 bg-[#121111] p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center text-gray-500 text-[10px]">
                    <span>RECORD TYPE: TXT (SPF)</span>
                    <span className="text-blue-400">HOST: @</span>
                  </div>
                  <p className="text-blue-300 select-all leading-normal">{selectedRecord.spf}</p>
                </div>

                {/* DKIM console record */}
                <div className="space-y-1 bg-[#121111] p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center text-gray-500 text-[10px]">
                    <span>RECORD TYPE: TXT (DKIM Selector)</span>
                    <span className="text-amber-400">HOST: dkim._domainkey</span>
                  </div>
                  <p className="text-amber-200 truncate select-all leading-normal">
                    {selectedRecord.dkim || '❌ NO DKIM PUBLIC KEYS LOCATED'}
                  </p>
                </div>

                {/* DMARC console record */}
                <div className="space-y-1 bg-[#121111] p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center text-gray-500 text-[10px]">
                    <span>RECORD TYPE: TXT (DMARC Policy)</span>
                    <span className="text-indigo-400">HOST: _dmarc</span>
                  </div>
                  <p className="text-indigo-300 select-all leading-normal">
                    {selectedRecord.dmarc || '❌ NO DMARC RULES ESTABLISHED'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-gray-700" />
              <div className="space-y-1">
                <p className="text-xs font-mono text-gray-400">No queried domain selected</p>
                <p className="text-[10px] text-gray-500 font-sans max-w-xs leading-normal">
                  Type a domain on the left, or click one of the quick test samples to inspect its security matrix.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-gray-500 flex justify-between">
          <span>COMPLIANCE STATUS: SECURE STACK</span>
          <span>QUERY COMPLETE (12ms)</span>
        </div>
      </div>
    </div>
  );
}
