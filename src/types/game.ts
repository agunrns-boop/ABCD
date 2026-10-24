export type Letter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface Card {
  id: string;
  type: 'LETTER' | 'STAR';
  letter?: Letter;
  label: string;
  receivedInTradeCycle?: number;
  receivedFromPlayerId?: string;
}

export interface Player {
  id: string;
  name: string;
  assignedLetter?: Letter; // Optional reference / favorite letter
  targetLetter?: Letter; // Dynamic: the letter the player currently has the most of
  isBot: boolean;
  avatarSeed: string;
  hand: Card[];
  selectedCardId: string | null;
  targetCount: number; // how many of target letter currently held (out of 4)
  wins: number;
}

export type GameMode = 'TURN_BASED' | 'PASS_ROUND';

export type GameStatus = 'SETUP' | 'DEALING' | 'PLAYING' | 'PASS_PLAY_PRIVACY' | 'GAME_OVER';

export interface TradeAction {
  fromPlayerId: string;
  toPlayerId: string; // or 'CENTER'
  offeredCardId: string;
  receivedCardId?: string;
  timestamp: number;
  description: string;
}

export interface GameSettings {
  playerCount: number; // 2 to 6
  mode: GameMode;
  botDifficulty: 'CASUAL' | 'CLEVER';
  soundEnabled: boolean;
}

export interface GameStats {
  roundsPlayed: number;
  totalTrades: number;
  centerSwaps: number;
  winnerId: string | null;
  winningLetter: Letter | null;
}

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  assignedLetter?: Letter;
  targetLetter?: Letter;
  cardCount: number;
  targetCount?: number;
  isConnected: boolean;
  wins: number;
}

export interface RoomState {
  code: string;
  status: 'LOBBY' | 'DEALING' | 'PLAYING' | 'GAME_OVER';
  hostId: string;
  maxPlayers: number;
  players: RoomPlayer[];
  activePlayerIndex: number;
  activePlayerId?: string;
  currentTradeCycle: number;
  nextRecipientId?: string;
  winnerId?: string | null;
  winningLetter?: Letter | null;
  roundsPlayed: number;
  totalTrades: number;
  centerSwaps: number;
  hasCenterCard: boolean;
  statusMessage: string;
  isPublic?: boolean;
  turnDeadline?: number;
  turnDuration?: number;
}

export interface OnlineGameOverData {
  winner: RoomPlayer;
  allHands: Record<string, Card[]>;
  centerCard: Card;
}
