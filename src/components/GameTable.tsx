import React from 'react';
import { Player, Card } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { HelpCircle, Bot, User, Sparkles, ArrowRight, RotateCw } from 'lucide-react';
import { analyzeHand } from '../utils/gameRules';

interface GameTableProps {
  players: Player[];
  activePlayerId: string;
  humanPlayerId: string;
  currentTradeCycle?: number;
  nextRecipientId?: string;
  centerCard: Card | null;
  selectedCardId: string | null;
  onTradeWithPlayer: (targetPlayerId: string) => void;
  onSwapWithCenter: () => void;
  isProcessingMove: boolean;
  activeStatusMessage: string;
}

export const GameTable: React.FC<GameTableProps> = ({
  players,
  activePlayerId,
  humanPlayerId,
  currentTradeCycle = 1,
  nextRecipientId,
  centerCard,
  selectedCardId,
  onTradeWithPlayer,
  onSwapWithCenter,
  isProcessingMove,
  activeStatusMessage,
}) => {
  const opponents = players.filter((p) => p.id !== humanPlayerId);
  const isHumanTurn = activePlayerId === humanPlayerId;

  // Determine active player's next recipient if not explicitly passed
  const activeIdx = players.findIndex((p) => p.id === activePlayerId);
  const calculatedNextRecipientId =
    nextRecipientId ||
    (players.length > 1
      ? players[(activeIdx + 1) % players.length]?.id
      : undefined);

  return (
    <div className="w-full flex-1 flex flex-col justify-between relative rounded-3xl border-4 border-amber-950/80 p-3 sm:p-5 shadow-2xl overflow-hidden min-h-[460px] bg-[#07160e]">
      {/* Dark Felt Table Texture Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/src/assets/images/game_table_felt_dark_1792853537092.jpg"
          alt="Dark Casino Felt Table"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-25 mix-blend-luminosity filter contrast-125"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#06180f]/80 to-[#030906]" />
      </div>

      {/* Top Banner: Circular Passing Order & Trade Round */}
      <div className="relative z-10 w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-black/60 border border-emerald-900/60 backdrop-blur mb-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span>Circular Pass:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
            {players.map((p, idx) => {
              const isActive = p.id === activePlayerId;
              const isTarget = p.id === calculatedNextRecipientId;

              return (
                <React.Fragment key={p.id}>
                  <span
                    className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : isTarget && isHumanTurn
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80'
                        : 'text-slate-400 bg-slate-900/60'
                    }`}
                  >
                    {p.name.replace(' (You)', '')}
                  </span>
                  {idx < players.length - 1 ? (
                    <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                  ) : (
                    <ArrowRight className="w-3 h-3 text-amber-400/70 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono ml-auto">
          <span className="text-slate-400 text-[11px]">Round:</span>
          <strong className="text-amber-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30">
            #{currentTradeCycle}
          </strong>
        </div>
      </div>

      {/* Opponents Row */}
      <div className="relative z-10 w-full mb-3">
        <div className="flex items-start justify-center gap-3 sm:gap-6 flex-wrap">
          {opponents.map((opponent) => {
            const isTurn = activePlayerId === opponent.id;
            const isTargetOfActive = opponent.id === calculatedNextRecipientId;
            const isHumanTarget = isHumanTurn && isTargetOfActive;

            // Hand evaluation for opponent
            const oppAnalysis = analyzeHand(opponent.hand);
            const bestLetter = oppAnalysis.bestLetter || opponent.targetLetter || opponent.assignedLetter || 'A';
            const bestCount = oppAnalysis.bestCount || opponent.targetCount || 0;

            return (
              <div
                key={opponent.id}
                className={`relative transition-all duration-300 rounded-2xl p-3 sm:p-4 flex flex-col items-center bg-black/50 backdrop-blur-sm border ${
                  isTurn
                    ? 'border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50 scale-105'
                    : isHumanTarget
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/20'
                    : 'border-emerald-800/60'
                }`}
              >
                {/* Active Turn or Next Recipient Indicator */}
                {isTurn && (
                  <span className="absolute -top-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow">
                    Active Turn
                  </span>
                )}
                {!isTurn && isHumanTarget && (
                  <span className="absolute -top-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow animate-pulse">
                    Next in Circle
                  </span>
                )}

                {/* Avatar & Dynamic Letter Focus */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-300 text-xs font-bold">
                    {opponent.isBot ? (
                      <Bot className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <User className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      {opponent.name}
                    </span>
                    <span className="text-[10px] text-emerald-300/80">
                      Pursuing: <strong className="text-amber-300">'{bestLetter}'</strong> ({bestCount}/4)
                    </span>
                  </div>
                </div>

                {/* Opponent's 4 Face-Down Cards */}
                <div className="flex items-center -space-x-8 sm:-space-x-10 py-1">
                  {opponent.hand.map((card, idx) => (
                    <div
                      key={`${opponent.id}-card-${card.id}-${idx}`}
                      className="transition-transform duration-200 hover:-translate-y-1 hover:z-20"
                      style={{ zIndex: idx }}
                    >
                      <PlayingCard
                        isFaceDown={true}
                        size="sm"
                        disabled={true}
                      />
                    </div>
                  ))}
                </div>

                {/* Circular Pass Button: Only shown on the Next Recipient in circle */}
                {isHumanTarget && !isProcessingMove && (
                  <button
                    onClick={() => onTradeWithPlayer(opponent.id)}
                    disabled={!selectedCardId}
                    className={`mt-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      selectedCardId
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md ring-2 ring-amber-400/50 cursor-pointer animate-pulse'
                        : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }`}
                  >
                    <span>Pass Card to {opponent.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Zone: Hold-Down Reserve & Status Message */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        {/* Status Bubble */}
        <div className="mb-3 px-4 py-1.5 rounded-full bg-black/70 border border-emerald-500/40 backdrop-blur text-xs sm:text-sm text-emerald-100 flex items-center gap-2 shadow-lg max-w-xl text-center">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" style={{ animationDuration: '4s' }} />
          <span>{activeStatusMessage}</span>
        </div>

        {/* Center Hold-Down Card Display */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            {/* Pedestal / Mat */}
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-amber-600/30 to-emerald-600/20 blur-md pointer-events-none" />

            <div className="relative p-2 rounded-2xl bg-black/50 border-2 border-dashed border-amber-400/50 flex flex-col items-center">
              <PlayingCard
                isFaceDown={true}
                size="md"
                labelOverride="HOLD DOWN"
                isSelected={false}
                onClick={
                  isHumanTurn && selectedCardId && !isProcessingMove
                    ? onSwapWithCenter
                    : undefined
                }
              />
            </div>
          </div>

          {/* Action button below center card */}
          <div className="mt-2 flex flex-col items-center">
            <span className="text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Center Hold-Down Card
            </span>
            <span className="text-[10px] text-emerald-200/70 mb-1.5 text-center">
              Mystery card held down until secretly swapped or game victory
            </span>

            {isHumanTurn && !isProcessingMove && (
              <button
                onClick={onSwapWithCenter}
                disabled={!selectedCardId}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedCardId
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md ring-2 ring-amber-300/40 cursor-pointer'
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-950" />
                Swap Selected Card With Center
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
