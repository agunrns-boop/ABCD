import React from 'react';
import { Player } from '../types/game';
import { ShieldCheck, Eye } from 'lucide-react';

interface PassPlayVeilProps {
  nextPlayer: Player;
  onReveal: () => void;
}

export const PassPlayVeil: React.FC<PassPlayVeilProps> = ({
  nextPlayer,
  onReveal,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest block mb-1">
            Pass & Play Privacy Screen
          </span>
          <h2 className="text-2xl font-bold text-white">
            Pass to {nextPlayer.name}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Keep your hand hidden from other players! When only {nextPlayer.name} is looking, reveal the cards.
          </p>
        </div>

        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
          Your goal: <strong className="text-amber-400 font-bold">Collect ANY 4 matching letter cards</strong>. Trade cards clockwise around the circle!
        </div>

        <button
          onClick={onReveal}
          className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Eye className="w-4 h-4" />
          I am {nextPlayer.name} — Show My Cards
        </button>
      </div>
    </div>
  );
};
