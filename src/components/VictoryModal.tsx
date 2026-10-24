import React from 'react';
import { Player, Card } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { RotateCcw, Sparkles } from 'lucide-react';
import { analyzeHand } from '../utils/gameRules';

interface VictoryModalProps {
  isOpen: boolean;
  winner: Player | null;
  players: Player[];
  centerCard: Card | null;
  onPlayAgain: () => void;
  onNewGameSetup: () => void;
  stats: {
    totalTrades: number;
    centerSwaps: number;
    roundsPlayed: number;
  };
  isOnline?: boolean;
  isHost?: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winner,
  players,
  centerCard,
  onPlayAgain,
  onNewGameSetup,
  stats,
  isOnline = false,
  isHost = false,
}) => {
  if (!isOpen || !winner) return null;

  const losers = players.filter((p) => p.id !== winner.id);
  const winAnalysis = analyzeHand(winner.hand);
  const winLetter =
    winAnalysis.winningLetter ||
    winner.targetLetter ||
    winner.assignedLetter ||
    'A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto text-slate-100 shadow-2xl p-6 relative">
        {/* Decorative ambient aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Winner Announcement */}
        <div className="text-center relative z-10 mb-6">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden mb-2 border-2 border-amber-400 shadow-xl shadow-amber-500/30 bg-slate-950">
            <img
              src="/src/assets/images/star_card_emblem_1792853554436.jpg"
              alt="Star Emblem"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-amber-300 tracking-wide">
            ABCD VICTORY!
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            <span className="font-bold text-white text-base">{winner.name}</span> collected all four{' '}
            <strong className="text-amber-400 underline decoration-amber-500/50">
              &apos;{winLetter}&apos;
            </strong>{' '}
            cards and claimed victory!
          </p>
        </div>

        {/* Winner's Hand */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-amber-500/30 mb-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Winning 4-of-a-Kind Set
          </div>
          <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            {winner.hand.map((card, idx) => (
              <PlayingCard
                key={`${card.id}-${idx}`}
                card={card}
                isFaceDown={false}
                size="md"
                isTargetLetter={card.letter === winLetter}
              />
            ))}
          </div>
        </div>

        {/* Center Hold-Down Card & Match Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Final Center Hold-Down Card */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase font-medium text-slate-400 tracking-wider mb-2">
              Center Hold-Down Card
            </span>
            {centerCard ? (
              <div className="flex flex-col items-center gap-2">
                <PlayingCard
                  card={centerCard}
                  isFaceDown={false}
                  size="sm"
                />
                <span className="text-[11px] text-amber-300 font-mono">
                  {centerCard.type === 'STAR'
                    ? 'The Ultimate Star was left in the center!'
                    : `Card '${centerCard.letter}' was locked in hold-down!`}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">None</span>
            )}
          </div>

          {/* Match Statistics */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
            <span className="text-xs uppercase font-medium text-slate-400 tracking-wider mb-3">
              Match Overview
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Player Passes Executed:</span>
                <span className="font-mono font-bold text-slate-100">
                  {stats.totalTrades}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Center Hold-Down Swaps:</span>
                <span className="font-mono font-bold text-slate-100">
                  {stats.centerSwaps}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Winner Total Victories:</span>
                <span className="font-mono font-bold text-amber-400">
                  {winner.wins}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Incomplete Opponent Hands */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 mb-6">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center sm:text-left">
            Other Players&apos; Hands at End of Match
          </h4>
          <div className="space-y-4">
            {losers.map((player) => {
              const oppAnalysis = analyzeHand(player.hand);
              const bestLetter = oppAnalysis.bestLetter || player.targetLetter || player.assignedLetter || 'A';

              return (
                <div
                  key={player.id}
                  className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-700">
                      {player.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 text-xs">
                        {player.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Held: &apos;{bestLetter}&apos; ({oppAnalysis.bestCount}/4 matching)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {player.hand.map((card, cIdx) => (
                      <PlayingCard
                        key={`loser-${player.id}-${cIdx}`}
                        card={card}
                        isFaceDown={false}
                        size="sm"
                        isTargetLetter={card.letter === bestLetter}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
          <button
            onClick={onNewGameSetup}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            {isOnline ? 'Return to Lobby / Setup' : 'Change Settings / Players'}
          </button>
          
          {(!isOnline || isHost) ? (
            <button
              onClick={onPlayAgain}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Play Next Round
            </button>
          ) : (
            <div className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Waiting for Host to start next round...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
