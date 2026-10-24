import React from 'react';
import { Player, Card } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { Trophy, CheckCircle2, AlertCircle, Sparkles, Lock, Unlock } from 'lucide-react';
import { analyzeHand, isCardTradeLocked } from '../utils/gameRules';

interface PlayerHandProps {
  player: Player;
  selectedCardId: string | null;
  currentTradeCycle?: number;
  onSelectCard: (cardId: string) => void;
  onClaimVictory: () => void;
  isMyTurn: boolean;
  disabled?: boolean;
  nextRecipientName?: string;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  selectedCardId,
  currentTradeCycle = 1,
  onSelectCard,
  onClaimVictory,
  isMyTurn,
  disabled = false,
  nextRecipientName,
}) => {
  const analysis = analyzeHand(player.hand);
  const targetLetter = analysis.bestLetter;
  const targetCount = analysis.bestCount;
  const canClaimVictory = analysis.hasFourOfAKind;
  const hasStarCard = player.hand.some((c) => c.type === 'STAR');

  const handleCardClick = (card: Card) => {
    if (disabled) return;
    const lockInfo = isCardTradeLocked(card, player.hand, currentTradeCycle);
    if (lockInfo.isLocked) {
      alert(
        `🔒 Card Locked This Round!\n\n${lockInfo.reason || 'You cannot trade a card you just received until this trade round completes (or unless you hold 3 of the same letter)!'}`
      );
      return;
    }
    onSelectCard(card.id);
  };

  return (
    <div className="w-full bg-[#0a0f1d]/95 border-t border-amber-500/30 p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-col items-center backdrop-blur-md">
      {/* Header Info */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4 mb-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 font-serif font-black text-xl flex items-center justify-center shadow-md">
            {targetLetter || '★'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm sm:text-base">
                {player.name} (You)
              </span>
              {isMyTurn ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                  Your Turn
                </span>
              ) : (
                <span className="text-xs text-slate-500">Waiting in circle...</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-slate-400">Goal:</span>
              <strong className="text-amber-400 font-bold">
                Collect 4 matching cards of ANY letter
              </strong>
              {targetLetter && (
                <span className="text-emerald-300/90 text-[11px] hidden sm:inline">
                  (Currently pursuing <strong>'{targetLetter}'</strong>)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Target Progress Counter & 3-of-a-kind indicator */}
        <div className="flex items-center gap-3">
          {analysis.hasThreeOfAKind && (
            <div
              className="px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-[10px] text-emerald-300 flex items-center gap-1"
              title="You have 3 identical cards! You are exempt from the received-card lock!"
            >
              <Unlock className="w-3 h-3 text-emerald-400" />
              <span>3-of-a-Kind Exception Active</span>
            </div>
          )}

          <div className="flex flex-col items-end">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Best Set Progress
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = idx < targetCount;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      isFilled
                        ? 'bg-amber-400 shadow-sm shadow-amber-400/60 scale-110'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                );
              })}
              <span className="ml-1.5 font-mono text-xs font-bold text-amber-300">
                {targetCount}/4
              </span>
            </div>
          </div>

          {/* ABCD Victory Button */}
          {canClaimVictory && (
            <button
              onClick={onClaimVictory}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all animate-bounce flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              ABCD! I WIN ({analysis.winningLetter})!
            </button>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 my-2 flex-wrap">
        {player.hand.map((card: Card) => {
          const isSelected = selectedCardId === card.id;
          const isTarget = targetLetter ? card.letter === targetLetter : false;
          const lockInfo = isCardTradeLocked(card, player.hand, currentTradeCycle);

          return (
            <div key={card.id} className="relative group">
              <PlayingCard
                card={card}
                isFaceDown={false}
                isSelected={isSelected}
                isTargetLetter={isTarget}
                isLocked={lockInfo.isLocked}
                lockReason={lockInfo.reason}
                onClick={disabled ? undefined : () => handleCardClick(card)}
                size="md"
              />
              {/* Selected indicator pin */}
              {isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                  Offered
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Helper Guidance Banner */}
      <div className="mt-2 text-center flex flex-col items-center justify-center gap-1 text-xs">
        {hasStarCard && (
          <span className="text-amber-300 flex items-center gap-1 bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-600/30 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5" />
            You hold the Star Card! Pass it forward or swap with the center to complete your 4 matching cards.
          </span>
        )}

        {!selectedCardId && isMyTurn && !canClaimVictory && (
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Click an eligible card in your hand to pass to {nextRecipientName || 'the next player in the circle'}.
          </span>
        )}

        {selectedCardId && isMyTurn && !canClaimVictory && (
          <span className="text-emerald-300 text-[11px] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Card selected! Click &quot;Pass Card to {nextRecipientName || 'Next Player'}&quot; or swap with Center Hold-Down.
          </span>
        )}
      </div>
    </div>
  );
};
