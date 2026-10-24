import React from 'react';
import { Card, Letter } from '../types/game';
import { Lock } from 'lucide-react';

interface PlayingCardProps {
  card?: Card | null;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isTargetLetter?: boolean;
  isLocked?: boolean;
  lockReason?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  labelOverride?: string;
  className?: string;
  disabled?: boolean;
  showPeekPrompt?: boolean;
}

const LETTER_STYLES: Record<
  Letter,
  {
    bg: string;
    border: string;
    text: string;
    accent: string;
    lightBg: string;
    glow: string;
    badgeBg: string;
    name: string;
  }
> = {
  A: {
    bg: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900',
    border: 'border-rose-500/60',
    text: 'text-rose-400',
    accent: 'border-rose-500/70',
    lightBg: 'bg-rose-950/40',
    glow: 'shadow-rose-950/50',
    badgeBg: 'bg-rose-600 text-white',
    name: 'Ruby Alpha',
  },
  B: {
    bg: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900',
    border: 'border-blue-500/60',
    text: 'text-blue-400',
    accent: 'border-blue-500/70',
    lightBg: 'bg-blue-950/40',
    glow: 'shadow-blue-950/50',
    badgeBg: 'bg-blue-600 text-white',
    name: 'Sapphire Beta',
  },
  C: {
    bg: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900',
    border: 'border-emerald-500/60',
    text: 'text-emerald-400',
    accent: 'border-emerald-500/70',
    lightBg: 'bg-emerald-950/40',
    glow: 'shadow-emerald-950/50',
    badgeBg: 'bg-emerald-600 text-white',
    name: 'Emerald Gamma',
  },
  D: {
    bg: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900',
    border: 'border-amber-500/60',
    text: 'text-amber-400',
    accent: 'border-amber-500/70',
    lightBg: 'bg-amber-950/40',
    glow: 'shadow-amber-950/50',
    badgeBg: 'bg-amber-600 text-slate-950',
    name: 'Amber Delta',
  },
  E: {
    bg: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900',
    border: 'border-purple-500/60',
    text: 'text-purple-400',
    accent: 'border-purple-500/70',
    lightBg: 'bg-purple-950/40',
    glow: 'shadow-purple-950/50',
    badgeBg: 'bg-purple-600 text-white',
    name: 'Amethyst Epsilon',
  },
  F: {
    bg: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900',
    border: 'border-orange-500/60',
    text: 'text-orange-400',
    accent: 'border-orange-500/70',
    lightBg: 'bg-orange-950/40',
    glow: 'shadow-orange-950/50',
    badgeBg: 'bg-orange-600 text-white',
    name: 'Coral Zeta',
  },
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFaceDown = false,
  isSelected = false,
  isTargetLetter = false,
  isLocked = false,
  lockReason,
  onClick,
  size = 'md',
  labelOverride,
  className = '',
  disabled = false,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-24 text-xs rounded-xl',
    md: 'w-24 h-36 sm:w-28 sm:h-40 text-sm rounded-2xl',
    lg: 'w-32 h-48 sm:w-36 sm:h-52 text-base rounded-2xl',
  }[size];

  // Face-down card design featuring ornate gold & obsidian pattern
  if (isFaceDown || !card) {
    return (
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`relative select-none transition-all duration-200 transform-gpu ${sizeClasses} ${
          isSelected
            ? '-translate-y-3 ring-4 ring-amber-400 shadow-2xl shadow-amber-500/30'
            : onClick && !disabled
            ? 'hover:-translate-y-1.5 cursor-pointer shadow-lg hover:shadow-amber-500/20'
            : 'shadow-md'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        style={{ perspective: '1000px' }}
      >
        <div className="w-full h-full rounded-[inherit] overflow-hidden relative shadow-2xl bg-slate-950 border-2 border-amber-500/40 flex items-center justify-center">
          <img
            src="/src/assets/images/card_back_pattern_1792853554721.jpg"
            alt="Card Back"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {labelOverride && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-1 text-center">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold bg-slate-950/95 px-2 py-0.5 rounded-lg border border-amber-500/50 shadow-md">
                {labelOverride}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STAR Card (The Ultimate Star)
  if (card.type === 'STAR') {
    return (
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`relative select-none transition-all duration-200 transform-gpu ${sizeClasses} ${
          isSelected
            ? '-translate-y-3 ring-4 ring-amber-400 shadow-2xl shadow-amber-500/40'
            : onClick && !disabled
            ? 'hover:-translate-y-2 cursor-pointer shadow-xl hover:shadow-amber-500/30'
            : 'shadow-lg'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      >
        <div className="w-full h-full rounded-[inherit] p-2 bg-gradient-to-b from-[#1c1404] via-[#120d02] to-[#241703] border-2 border-amber-400/90 shadow-lg shadow-amber-950/60 flex flex-col justify-between overflow-hidden relative">
          {/* Subtle star dust shimmer */}
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px] opacity-15 pointer-events-none" />

          {/* Top-left corner */}
          <div className="flex items-center gap-1 leading-none relative z-10">
            <span className="font-serif font-black text-amber-400 text-sm sm:text-base">
              ★
            </span>
          </div>

          {/* Center Graphic: Celestial Star Artwork */}
          <div className="self-center flex flex-col items-center justify-center text-center my-auto relative z-10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-amber-400/80 shadow-md shadow-amber-500/30 flex items-center justify-center bg-slate-950">
              <img
                src="/src/assets/images/star_card_emblem_1792853554436.jpg"
                alt="Ultimate Star Emblem"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <span className="mt-1 font-serif font-black text-[10px] sm:text-xs text-amber-300 tracking-widest uppercase">
              Star
            </span>
            <span className="text-[8px] text-amber-400/80 font-mono tracking-tight leading-none px-1">
              Blocker Card
            </span>
          </div>

          {/* Bottom-right corner */}
          <div className="flex items-center justify-end gap-1 leading-none rotate-180 relative z-10">
            <span className="font-serif font-black text-amber-400 text-sm sm:text-base">
              ★
            </span>
          </div>

          {/* Trade Lock Badge */}
          {isLocked && (
            <div
              className="absolute inset-x-1 top-1 z-20 flex items-center justify-center gap-1 bg-rose-950/95 border border-rose-500/80 rounded px-1.5 py-0.5 text-[8px] font-bold text-rose-200 shadow-md backdrop-blur-xs"
              title={lockReason || 'Card received this round. Locked until next round or 3-of-a-kind!'}
            >
              <Lock className="w-2.5 h-2.5 text-rose-400 shrink-0" />
              <span className="truncate">LOCKED</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dark Theme Letter Cards ('A', 'B', 'C', 'D', 'E', 'F')
  const letter = card.letter || 'A';
  const styles = LETTER_STYLES[letter] || LETTER_STYLES.A;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative select-none transition-all duration-200 transform-gpu ${sizeClasses} ${
        isSelected
          ? '-translate-y-3 ring-4 ring-amber-400 shadow-2xl shadow-amber-500/30'
          : onClick && !disabled
          ? 'hover:-translate-y-2 cursor-pointer shadow-lg hover:shadow-indigo-500/20'
          : 'shadow-md'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      <div
        className={`w-full h-full rounded-[inherit] p-2.5 ${styles.bg} border-2 ${styles.border} flex flex-col justify-between overflow-hidden shadow-lg ${styles.glow} relative`}
      >
        {/* Subtle inner corner filigree accents */}
        <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-slate-700 pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-slate-700 pointer-events-none" />

        {/* Top-left corner */}
        <div className="flex items-start justify-between leading-none relative z-10">
          <div className="flex flex-col items-center">
            <span
              className={`font-serif font-black text-base sm:text-xl ${styles.text}`}
            >
              {letter}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">#4</span>
          </div>
          {isTargetLetter && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 leading-tight tracking-wider shadow"
              title="Matches your primary collection letter!"
            >
              TARGET
            </span>
          )}
        </div>

        {/* Center Main Letter with Dark Glow Container */}
        <div className="self-center flex flex-col items-center justify-center text-center my-auto relative z-10">
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${styles.lightBg} border ${styles.accent} flex items-center justify-center shadow-inner backdrop-blur-sm`}
          >
            <span
              className={`font-serif font-black text-3xl sm:text-5xl ${styles.text} filter drop-shadow`}
            >
              {letter}
            </span>
          </div>
          <span className="mt-1 font-mono text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Card {letter}
          </span>
        </div>

        {/* Bottom-right corner (inverted) */}
        <div className="flex items-end justify-between leading-none rotate-180 relative z-10">
          <div className="flex flex-col items-center">
            <span
              className={`font-serif font-black text-base sm:text-xl ${styles.text}`}
            >
              {letter}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">#4</span>
          </div>
        </div>

        {/* Trade Lock Badge */}
        {isLocked && (
          <div
            className="absolute inset-x-1 top-1 z-20 flex items-center justify-center gap-1 bg-rose-950/95 border border-rose-500/80 rounded px-1.5 py-0.5 text-[8px] font-bold text-rose-200 shadow-md backdrop-blur-xs"
            title={lockReason || 'Card received this round. Locked until next round or 3-of-a-kind!'}
          >
            <Lock className="w-2.5 h-2.5 text-rose-400 shrink-0" />
            <span className="truncate">LOCKED</span>
          </div>
        )}
      </div>
    </div>
  );
};
