import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Calendar, MapPin, Sparkles, Send, FlameKindling, Info, Edit, Heart, Eye } from 'lucide-react';
import { InvitationTemplate, RSVPRecord } from '../types';

interface CardDesignerProps {
  onAddRSVP: (rsvp: RSVPRecord) => void;
  email: string;
}

export default function CardDesigner({ onAddRSVP, email }: CardDesignerProps) {
  // Preset templates
  const presets: InvitationTemplate[] = [
    {
      id: 'balloons',
      title: "Chloe's 5th Birthday Jubilee",
      host: "The Henderson Family",
      date: "Saturday, July 18, 2026",
      time: "4:00 PM - 7:00 PM PST",
      location: "Brightwood Adventure Park, Pavillion B",
      balloonColor1: "#f43f5e", // Rose
      balloonColor2: "#06b6d4", // Cyan
      primaryColor: "#3b82f6", // Blue
      emoji: "🎈"
    },
    {
      id: 'gala',
      title: "Summer Solstice Gala & Banquet",
      host: "Sincere Corporation & Partners",
      date: "Friday, June 21, 2026",
      time: "7:00 PM till Midnight",
      location: "The Golden Pavilion, Grand Ballroom",
      balloonColor1: "#eab308", // Yellow
      balloonColor2: "#e11d48", // Rose Red
      primaryColor: "#854d0e", // Gold/Amber
      emoji: "✨"
    },
    {
      id: 'baby',
      title: "Baby Shower celebration for Lily",
      host: "Sarah & David Jenkins",
      date: "Sunday, August 9, 2026",
      time: "2:00 PM - 5:00 PM EST",
      location: "The Rosewood Teahouse & Conservatory",
      balloonColor1: "#ec4899", // Pink
      balloonColor2: "#6366f1", // Indigo
      primaryColor: "#ec4899", // Pink
      emoji: "👶"
    }
  ];

  const [activeTemplate, setActiveTemplate] = useState<InvitationTemplate>(presets[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [isRSVPSubmitted, setIsRSVPSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'VIEW' | 'EDIT'>('VIEW');

  // RSVP Form fields
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'ACCEPTED' | 'DECLINED' | 'TENTATIVE'>('ACCEPTED');
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [rsvpNote, setRsvpNote] = useState('');

  // Editable fields for customizer
  const handleFieldChange = (field: keyof InvitationTemplate, value: string) => {
    setActiveTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRSVPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;

    const newRSVP: RSVPRecord = {
      id: Math.random().toString(36).substring(4),
      name: rsvpName,
      email: email || 'guest@invitedweb.com',
      status: rsvpStatus,
      guests: rsvpStatus === 'ACCEPTED' ? rsvpGuests : 0,
      note: rsvpNote,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onAddRSVP(newRSVP);
    setIsRSVPSubmitted(true);

    setTimeout(() => {
      // Auto-focus next section
    }, 1000);
  };

  return (
    <div id="card-designer-viewport" className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl mx-auto px-4 md:px-6">
      
      {/* Left Control Panel / Studio Customizer */}
      <div id="design-control-panel" className="lg:col-span-5 bg-[#1b1918] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-sans font-medium text-white">Digital Invitation Studio</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Test and design how digital invitation envelopes open dynamically! Toggle themes or enter real details to customize the guest card.
            </p>
          </div>

          {/* Toggle between View and Customizer Mode */}
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('VIEW')}
              className={`flex-1 py-1.5 rounded-md text-xs font-sans font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'VIEW' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Interactive View
            </button>
            <button
              onClick={() => setActiveTab('EDIT')}
              className={`flex-1 py-1.5 rounded-md text-xs font-sans font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'EDIT' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Edit className="w-3.5 h-3.5" />
              Customize Card details
            </button>
          </div>

          {activeTab === 'EDIT' ? (
            <div id="editor-inputs-panel" className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Preset category</label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveTemplate(p);
                        setIsOpen(false);
                        setIsRSVPSubmitted(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-sans font-medium border text-center transition-all truncate cursor-pointer ${activeTemplate.id === p.id ? 'border-amber-500 text-amber-300 bg-amber-500/10' : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}
                    >
                      {p.emoji} {p.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Event Title</label>
                <input
                  type="text"
                  value={activeTemplate.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full bg-black/25 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Host Name</label>
                <input
                  type="text"
                  value={activeTemplate.host}
                  onChange={(e) => handleFieldChange('host', e.target.value)}
                  className="w-full bg-black/25 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Date</label>
                  <input
                    type="text"
                    value={activeTemplate.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    className="w-full bg-black/25 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Time</label>
                  <input
                    type="text"
                    value={activeTemplate.time}
                    onChange={(e) => handleFieldChange('time', e.target.value)}
                    className="w-full bg-black/25 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Location</label>
                <input
                  type="text"
                  value={activeTemplate.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  className="w-full bg-black/25 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Theme Color 1</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={activeTemplate.balloonColor1}
                      onChange={(e) => handleFieldChange('balloonColor1', e.target.value)}
                      className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{activeTemplate.balloonColor1}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Theme Color 2</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={activeTemplate.balloonColor2}
                      onChange={(e) => handleFieldChange('balloonColor2', e.target.value)}
                      className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{activeTemplate.balloonColor2}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold font-sans">Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={activeTemplate.primaryColor}
                      onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                      className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{activeTemplate.primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div id="rsvp-interactive-controls" className="space-y-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex gap-2.5 items-start text-xs text-gray-300">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Click the <strong>Wax Seal</strong> or <strong>Envelope Flap</strong> in the canvas preview on the right to trigger the card opening animation.
                  </p>
                </div>
                {!isOpen && (
                  <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-sans text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Open Envelope Separator
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-sans text-amber-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    RSVP Response Form
                  </h4>

                  {!isRSVPSubmitted ? (
                    <form onSubmit={handleRSVPSubmit} className="space-y-3 font-sans">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Your Name</label>
                          <input
                            type="text"
                            required
                            value={rsvpName}
                            onChange={(e) => setRsvpName(e.target.value)}
                            placeholder="Alex Morgan"
                            className="w-full bg-black/25 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Status</label>
                          <select
                            value={rsvpStatus}
                            onChange={(e: any) => setRsvpStatus(e.target.value)}
                            className="w-full bg-black/25 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                          >
                            <option value="ACCEPTED" className="bg-[#1b1918]">Attending</option>
                            <option value="TENTATIVE" className="bg-[#1b1918]">Maybe</option>
                            <option value="DECLINED" className="bg-[#1b1918]">Regretfully Decline</option>
                          </select>
                        </div>
                      </div>

                      {rsvpStatus === 'ACCEPTED' && (
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Guests Attending ({rsvpGuests})</label>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={rsvpGuests}
                            onChange={(e) => setRsvpGuests(parseInt(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Short Note for Host</label>
                        <textarea
                          value={rsvpNote}
                          onChange={(e) => setRsvpNote(e.target.value)}
                          placeholder="Can't wait to celebrate with you!"
                          rows={2}
                          className="w-full bg-black/25 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-sans resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer block"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Secured RSVP Confirmation
                      </button>
                    </form>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2 text-center">
                      <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        ✓ RSVP Sent Successfully!
                      </p>
                      <p className="text-[11px] text-gray-400 leading-normal">
                        Your answer was published to the local dashboard. Total guest counts and lists updated.
                      </p>
                      <button
                        onClick={() => {
                          setIsRSVPSubmitted(false);
                          setRsvpName('');
                          setRsvpNote('');
                        }}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Submit another response
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-white/5 text-[11px] text-gray-400 font-sans space-y-1.5">
          <p className="flex items-center gap-1.5">
            <FlameKindling className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulated Guest Email: <code className="bg-white/10 px-1 py-0.5 rounded text-[10px] text-gray-200 font-mono">{email || 'guest@example.com'}</code></span>
          </p>
        </div>
      </div>

      {/* Right Canvas / Envelope Preview */}
      <div id="envelope-canvas-container" className="lg:col-span-7 bg-black/50 border border-white/10 rounded-2xl p-4 md:p-8 flex items-center justify-center min-h-[450px] relative overflow-hidden shadow-inner">
        {/* Background Balloons Simulation */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div
            className="absolute rounded-full w-40 h-40 filter blur-xl animate-float"
            style={{
              backgroundColor: activeTemplate.balloonColor1,
              top: '15%',
              left: '10%'
            }}
          ></div>
          <div
            className="absolute rounded-full w-48 h-48 filter blur-3xl animate-float-delay"
            style={{
              backgroundColor: activeTemplate.balloonColor2,
              bottom: '10%',
              right: '10%'
            }}
          ></div>
        </div>

        {/* Envelope Module */}
        <div className="relative w-full max-w-[340px] h-[380px] z-10 flex flex-col items-center justify-end">
          
          {/* Card Sliding Section */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ y: 150, scale: 0.85, opacity: 0 }}
                animate={{ y: -60, scale: 1, opacity: 1 }}
                exit={{ y: 150, scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 80 }}
                className="absolute top-0 w-[94%] bg-white rounded-lg shadow-2xl p-5 border border-amber-900/10 text-[#4a3f35] flex flex-col justify-between h-[300px] z-10"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(0,0,0,0.03)'
                }}
              >
                <div className="text-center space-y-3.5">
                  <div className="text-2xl">{activeTemplate.emoji}</div>
                  <h4 className="font-serif text-[15px] font-bold tracking-tight leading-snug text-[#3c2a1a]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {activeTemplate.title}
                  </h4>
                  <div className="w-16 h-[1px] bg-amber-800/20 mx-auto"></div>
                  
                  <div className="space-y-1.5 font-sans">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold font-sans">Hosted by</p>
                    <p className="text-xs font-semibold text-[#5c4a37]">{activeTemplate.host}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-amber-900/10 pt-3.5 font-sans text-[10px] text-[#5c4a37] leading-relaxed">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: activeTemplate.primaryColor }} />
                    <div>
                      <p className="font-medium">{activeTemplate.date}</p>
                      <p className="text-[9px] text-[#8c7864]">{activeTemplate.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: activeTemplate.primaryColor }} />
                    <p className="font-medium truncate">{activeTemplate.location}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Envelope Body (Behind Card) */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-[#3c342c] h-[180px] rounded-b-xl relative shadow-2xl border border-white/5 cursor-pointer z-20 group transition-transform hover:scale-[1.01]"
          >
            {/* Envelope flap folded down (when closed) */}
            {!isOpen && (
              <div
                className="absolute top-0 left-0 right-0 h-[100px] bg-[#4a3f35] rounded-b-[40%] shadow-md border-b border-[#ffffff10] z-30 flex items-center justify-center transition-all group-hover:bg-[#53473c]"
                style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }}
              >
                {/* Wax Seal Circle */}
                <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center border-2 border-amber-500 shadow-lg text-white font-serif text-sm font-semibold active:scale-95 transition-transform">
                  G
                </div>
              </div>
            )}

            {/* Envelope pocket inner overlay */}
            <div className="absolute inset-0 bg-[#2f2721] rounded-b-xl opacity-90 border-t-2 border-[#1e1713]"></div>

            {/* Simulated Envelope Open Flap (facing upwards behind card when opened) */}
            {isOpen && (
              <div
                className="absolute top-[-90px] left-0 right-0 h-[90px] bg-[#4a3f35]/80 backdrop-blur-xs shadow-inner"
                style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
              ></div>
            )}

            {/* Cute mini card indicator when envelope is closed */}
            {!isOpen && (
              <div className="absolute top-2 w-[85%] left-[7.5%] h-6 bg-white/10 rounded-t-sm animate-pulse z-10 text-center text-[8px] text-white/40 pt-1 font-mono tracking-wider">
                CARD INSIDE
              </div>
            )}

            {/* Open instructions helper label on envelope body */}
            <div className="absolute bottom-3 left-0 right-0 text-center z-30 pointer-events-none">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[#ceb99e] font-semibold">
                {isOpen ? 'Click envelope to close' : 'Click wax seal to open'}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
