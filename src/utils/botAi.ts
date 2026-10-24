import { Card, Player } from '../types/game';
import { analyzeHand, isCardTradeLocked, getNextCircularRecipientIndex } from './gameRules';

export interface BotDecision {
  action: 'TRADE_PLAYER' | 'SWAP_CENTER' | 'DECLARE_WIN';
  targetPlayerId?: string;
  offeredCardId: string;
  reasoning: string;
}

/**
 * Evaluates bot's hand and chooses the best move:
 * 1. Win if any 4 matched letters (ABCD Victory!)
 * 2. Collect whichever letter the bot holds the highest count of
 * 3. Pass cards sequentially in clockwise circular order: P_i -> P_(i+1)
 * 4. Respects the trade lock: cannot trade a card received in the same trade cycle unless holding 3 of a kind!
 */
export function decideBotTurn(
  bot: Player,
  allPlayers: Player[],
  centerCardKnown: boolean = false,
  currentTradeCycle: number = 1
): BotDecision {
  const analysis = analyzeHand(bot.hand);

  // 1. Victory check: 4 of any identical letter
  if (analysis.hasFourOfAKind && analysis.winningLetter) {
    return {
      action: 'DECLARE_WIN',
      offeredCardId: bot.hand[0]?.id || '',
      reasoning: `I have all 4 '${analysis.winningLetter}' cards! ABCD Victory!`,
    };
  }

  const focusLetter = analysis.bestLetter;

  // Unwanted cards: cards that do NOT match the focus letter (including Star)
  const unwantedCards = bot.hand.filter((c) => c.letter !== focusLetter);

  // Filter cards by trade lock: cannot offer a card received this cycle unless holding 3-of-a-kind
  const unlockedUnwanted = unwantedCards.filter(
    (c) => !isCardTradeLocked(c, bot.hand, currentTradeCycle).isLocked
  );

  let eligibleCardsToGive = unlockedUnwanted;

  // Fallback: If all unwanted cards are locked, check all unlocked cards in hand
  if (eligibleCardsToGive.length === 0) {
    eligibleCardsToGive = bot.hand.filter(
      (c) => !isCardTradeLocked(c, bot.hand, currentTradeCycle).isLocked
    );
  }

  // Absolute fallback: if somehow everything is locked, use any card
  const cardToGive =
    eligibleCardsToGive.length > 0
      ? pickBestCardToDiscard(eligibleCardsToGive)
      : bot.hand[0];

  // 2. Center swap decision:
  // If holding Star card and eligible, high incentive to dump into center hold-down
  const hasStar = bot.hand.some((c) => c.type === 'STAR');
  const starCard = bot.hand.find((c) => c.type === 'STAR');
  const starIsEligible =
    starCard && !isCardTradeLocked(starCard, bot.hand, currentTradeCycle).isLocked;

  const shouldTryCenter =
    (hasStar && starIsEligible && Math.random() < 0.65) ||
    (!hasStar && Math.random() < 0.25 && !centerCardKnown);

  if (shouldTryCenter) {
    const swapCard = starIsEligible ? starCard! : cardToGive;
    return {
      action: 'SWAP_CENTER',
      offeredCardId: swapCard.id,
      reasoning: hasStar
        ? `Discarding the dead Star card into the center hold-down!`
        : `Fishing for a missing '${focusLetter}' card from the mystery hold-down!`,
    };
  }

  // 3. Trade with next player in the circle (Sequential circular passing order)
  const botIdx = allPlayers.findIndex((p) => p.id === bot.id);
  const nextIdx = getNextCircularRecipientIndex(botIdx, allPlayers.length);
  const nextPlayer = allPlayers[nextIdx] || allPlayers.find((p) => p.id !== bot.id) || bot;

  return {
    action: 'TRADE_PLAYER',
    targetPlayerId: nextPlayer.id,
    offeredCardId: cardToGive.id,
    reasoning: `Passing an unwanted card to ${nextPlayer.name} (Next in circle) to collect '${focusLetter}'.`,
  };
}

/**
 * When someone asks to trade with this bot, which card does the bot give in return?
 */
export function botPickCardToReturn(
  bot: Player,
  requestedBy: Player,
  currentTradeCycle: number = 1
): Card {
  const analysis = analyzeHand(bot.hand);
  const focusLetter = analysis.bestLetter;
  const unwantedCards = bot.hand.filter((c) => c.letter !== focusLetter);

  if (unwantedCards.length === 0) {
    // Has all matching cards!
    return bot.hand[0];
  }

  // Filter unwanted cards by trade lock
  const eligibleUnwanted = unwantedCards.filter(
    (c) => !isCardTradeLocked(c, bot.hand, currentTradeCycle).isLocked
  );

  const pool = eligibleUnwanted.length > 0 ? eligibleUnwanted : unwantedCards;

  // Check if bot holds the Star card: prioritize dumping it
  const starCard = pool.find((c) => c.type === 'STAR');
  if (starCard && Math.random() < 0.8) {
    return starCard;
  }

  // Check if bot holds a card that doesn't match the requester's likely target
  const nonRequesterTarget = pool.filter(
    (c) => c.letter !== requestedBy.targetLetter && c.letter !== requestedBy.assignedLetter
  );

  if (nonRequesterTarget.length > 0 && Math.random() < 0.6) {
    return nonRequesterTarget[Math.floor(Math.random() * nonRequesterTarget.length)];
  }

  // Otherwise pick any eligible unwanted card
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickBestCardToDiscard(unwanted: Card[]): Card {
  // If we have a Star card, high priority to discard it
  const star = unwanted.find((c) => c.type === 'STAR');
  if (star && Math.random() < 0.75) {
    return star;
  }

  // Otherwise pick random unwanted
  return unwanted[Math.floor(Math.random() * unwanted.length)];
}
