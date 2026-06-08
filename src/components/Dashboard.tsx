import React from 'react';
import { RSVPRecord } from '../types';
import { Users, UserCheck, UserX, UserMinus, FileClock, Trash2, Heart, PlusCircle } from 'lucide-react';

interface DashboardProps {
  rsvps: RSVPRecord[];
  onRemoveRSVP: (id: string) => void;
  onClearAll: () => void;
  onAddSampleRSVP: () => void;
}

export default function Dashboard({ rsvps, onRemoveRSVP, onClearAll, onAddSampleRSVP }: DashboardProps) {
  // Compute totals
  const totalRSVPs = rsvps.length;
  const acceptedRSVPs = rsvps.filter(r => r.status === 'ACCEPTED').length;
  const tentativeRSVPs = rsvps.filter(r => r.status === 'TENTATIVE').length;
  const declinedRSVPs = rsvps.filter(r => r.status === 'DECLINED').length;
  
  const totalAttendingGuests = rsvps
    .filter(r => r.status === 'ACCEPTED')
    .reduce((acc, curr) => acc + curr.guests, 0);

  return (
    <div id="rsvp-dashboard-container" className="w-full max-w-5xl mx-auto px-4 md:px-6 space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#1b1918] border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider block">Total RSVPs</span>
            <p className="text-2xl font-serif font-bold text-white leading-none">{totalRSVPs}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1b1918] border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider block">Total Attending</span>
            <p className="text-2xl font-serif font-bold text-emerald-400 leading-none">{totalAttendingGuests}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1b1918] border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider block">Tentative</span>
            <p className="text-2xl font-serif font-bold text-amber-400 leading-none">{tentativeRSVPs}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1b1918] border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-sans uppercase font-bold tracking-wider block">Declined</span>
            <p className="text-2xl font-serif font-bold text-rose-400 leading-none">{declinedRSVPs}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <UserX className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Grid: RSVP Log & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* RSVP Log */}
        <div className="md:col-span-8 bg-[#1b1918] border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col justify-between min-h-[350px]">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="font-sans font-medium text-white text-sm flex items-center gap-1.5">
                <FileClock className="w-4 h-4 text-emerald-400" />
                Active Guest Response Sheet
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={onAddSampleRSVP}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Inject Sample
                </button>
                {rsvps.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset List
                  </button>
                )}
              </div>
            </div>

            {rsvps.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <p className="text-xs text-gray-500 font-mono">NO GUEST RSPVS ON FILE</p>
                <p className="text-[11px] text-gray-400 max-w-sm mx-auto font-sans">
                  The sheet is currently quiet. Access the Invitation Simulator using webmail authentication to submit guest responses, or click "Inject Sample" to generate fake rows.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="bg-[#23201f] border border-white/5 hover:border-white/10 p-3.5 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="space-y-1 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white block truncate max-w-[150px] md:max-w-xs">{rsvp.name}</span>
                        <code className="text-[9px] text-[#8c7864] bg-brown-500/10 px-1 py-0.5 rounded leading-none">{rsvp.email}</code>
                        <span className="text-[9px] text-gray-500 font-mono">{rsvp.timestamp}</span>
                      </div>
                      
                      {rsvp.note && (
                        <p className="text-[11px] text-gray-400 italic">"{rsvp.note}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {rsvp.status === 'ACCEPTED' && (
                          <span className="inline-block py-0.5 px-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                            Attending (+{rsvp.guests})
                          </span>
                        )}
                        {rsvp.status === 'TENTATIVE' && (
                          <span className="inline-block py-0.5 px-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                            Maybe
                          </span>
                        )}
                        {rsvp.status === 'DECLINED' && (
                          <span className="inline-block py-0.5 px-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold">
                            Declined
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveRSVP(rsvp.id)}
                        className="text-gray-500 hover:text-rose-400 p-1 rounded-md hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 text-[10px] text-gray-500 font-sans">
            Total verified attending parties counting hosts and companions.
          </div>
        </div>

        {/* Guest Book / Notes */}
        <div className="md:col-span-4 bg-[#1b1918] border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans font-medium text-white text-sm flex items-center gap-1.5 pb-3 border-b border-white/5">
              <Heart className="w-4 h-4 text-rose-400" />
              Greeting Notes
            </h3>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {rsvps.filter(r => r.note.trim() !== '').length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-[11px] font-sans">
                  No notes left by guests yet. Make an RSVP with a custom short note to populate this grid.
                </div>
              ) : (
                rsvps
                  .filter(r => r.note.trim() !== '')
                  .map((rsvp) => (
                    <div key={`note-${rsvp.id}`} className="bg-[#23201f] rounded-xl p-3 border border-white/5 font-sans space-y-1">
                      <span className="text-[10px] text-amber-400 font-semibold">{rsvp.name} wrote:</span>
                      <p className="text-xs text-gray-200 leading-normal">"{rsvp.note}"</p>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[10px] text-gray-500 font-sans">
            Wishes and remarks received for direct host viewing.
          </div>
        </div>

      </div>

    </div>
  );
}
