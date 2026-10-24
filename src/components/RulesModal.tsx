import React from 'react';
import { X, Trophy, Sparkles, Shuffle, ShieldAlert, RotateCw, Lock, Unlock } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-serif font-black">
              ★
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-serif">
                Rules of ABCD Card Play
              </h2>
              <p className="text-xs text-slate-400">
                Official rules for 2 to 6 Players — Circular Trading & Matching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close rules"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm">
          {/* Rule 1: Independent 4-of-a-kind */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                <span>Objective: Collect 4 Matching Cards (Any Letter!)</span>
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                <strong>No one is locked to any specific letter!</strong> You are free to pursue whichever letter you wish, or whichever letter you currently hold the highest count of in your hand. The first player to assemble <strong>4 identical letter cards</strong> shouts <strong>ABCD!</strong> and wins the game!
              </p>
            </div>
          </div>

          {/* Rule 2: Sequential Circular Passing Order */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm mb-1">
                Sequential Circular Passing
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-2">
                Card trading moves in a continuous clockwise circle:
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-emerald-200 font-mono text-xs flex items-center justify-center gap-2">
                <span>Player 1 ➔ Player 2 ➔ Player 3 ➔ ... ➔ Player 1</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-2">
                When the last player completes their pass back to Player 1, the Trade Round completes and a new round begins!
              </p>
            </div>
          </div>

          {/* Rule 3: Trade Lock & 3-of-a-Kind Exception */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                <span>Trade Lock & The 3-of-a-Kind Exception</span>
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-2">
                To prevent immediate card dumping, <strong>you cannot pass the same card you just received during the current trade round</strong>. You must hold it until that trade cycle completes.
              </p>
              <div className="p-3 rounded-lg bg-slate-800/80 border border-amber-500/40 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>The 3-of-a-Kind Exception:</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  If you currently hold <strong>three identical cards</strong> in your hand (e.g. three &apos;C&apos;s or three &apos;A&apos;s), the restriction is lifted! You can trade that received card forward immediately!
                </p>
              </div>
            </div>
          </div>

          {/* Deck Formula */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm mb-1">
                Deck Formula: (Players × 4) + 1 Star Card
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-2">
                The deck contains 4 copies of each in-game letter plus <strong>1 Ultimate Star Card</strong> (held down in center):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-mono text-amber-400 block font-bold">2 Players</span>
                  <span className="text-slate-300 text-[11px]">4A + 4B + 1★ = <strong>9 Cards</strong></span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-mono text-amber-400 block font-bold">3 Players</span>
                  <span className="text-slate-300 text-[11px]">4A..4C + 1★ = <strong>13 Cards</strong></span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-mono text-amber-400 block font-bold">4 Players</span>
                  <span className="text-slate-300 text-[11px]">4A..4D + 1★ = <strong>17 Cards</strong></span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="font-mono text-purple-400 block font-bold">5 Players</span>
                  <span className="text-slate-300 text-[11px]">4A..4E + 1★ = <strong>21 Cards</strong></span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 col-span-2 sm:col-span-1">
                  <span className="font-mono text-orange-400 block font-bold">6 Players</span>
                  <span className="text-slate-300 text-[11px]">4A..4F + 1★ = <strong>25 Cards</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Hold-Down Card */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm mb-1">
                The Center Hold-Down & Star Card
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                On your turn, you can also secretly swap an eligible card with the <strong>face-down mystery center card</strong>! If you get stuck with the Star Card, ditch it to the center or pass it along to block someone else.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs tracking-wide transition-colors cursor-pointer"
          >
            Got It, Let&apos;s Play!
          </button>
        </div>
      </div>
    </div>
  );
};
