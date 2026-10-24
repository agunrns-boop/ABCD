import { Card, Letter } from '../types/game';

export const ALL_GAME_LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export interface HandAnalysis {
  letterCounts: Record<Letter, number>;
  bestLetter: Letter | null;
  bestCount: number;
  hasThreeOfAKind: boolean;
  hasFourOfAKind: boolean;
  winningLetter: Letter | null;
}

/**
 * Evaluates the player's 4-card hand:
 * Counts occurrences of each letter, detects 3-of-a-kind, and checks for 4-of-a-kind victory.
 */
export function analyzeHand(hand: Card[]): HandAnalysis {
  const counts: Record<Letter, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  };

  for (const card of hand) {
    if (card.type === 'LETTER' && card.letter) {
      counts[card.letter] = (counts[card.letter] || 0) + 1;
    }
  }

  let bestLetter: Letter | null = null;
  let bestCount = 0;
  let winningLetter: Letter | null = null;

  for (const l of ALL_GAME_LETTERS) {
    const c = counts[l];
    if (c > bestCount) {
      bestCount = c;
      bestLetter = l;
    }
    if (c === 4) {
      winningLetter = l;
    }
  }

  return {
    letterCounts: counts,
    bestLetter,
    bestCount,
    hasThreeOfAKind: bestCount >= 3,
    hasFourOfAKind: winningLetter !== null,
    winningLetter,
  };
}

/**
 * Checks if a specific card is locked from being traded in the current trade cycle.
 * Rule:
 * - A player cannot trade a card they received during the same trade cycle.
 * - EXCEPTION: A player CAN trade that card if they currently hold 3 of the same letter in their hand!
 */
export function isCardTradeLocked(
  card: Card,
  hand: Card[],
  currentTradeCycle: number
): { isLocked: boolean; reason?: string } {
  // If not received in the current cycle, it's completely unlocked
  if (!card.receivedInTradeCycle || card.receivedInTradeCycle !== currentTradeCycle) {
    return { isLocked: false };
  }

  // Check the exception: Does the player have 3 cards of the same letter in their belonging (hand)?
  const analysis = analyzeHand(hand);
  if (analysis.hasThreeOfAKind) {
    return {
      isLocked: false,
      reason: `Exception unlocked: You hold 3 '${analysis.bestLetter}' cards!`,
    };
  }

  return {
    isLocked: true,
    reason: `Locked this round: Received in current trade cycle. Unlocks if you hold 3 matching letters, or in the next trade cycle!`,
  };
}

/**
 * Returns the index of the next player in the circular passing order:
 * P0 -> P1 -> P2 -> ... -> P(N-1) -> P0
 */
export function getNextCircularRecipientIndex(
  activePlayerIndex: number,
  playerCount: number
): number {
  if (playerCount <= 1) return 0;
  return (activePlayerIndex + 1) % playerCount;
}
