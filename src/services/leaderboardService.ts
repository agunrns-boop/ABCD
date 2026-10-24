import { Letter } from '../types/game';

export interface LeaderboardEntry {
  id: string;
  name: string;
  wins: number;
  totalTrades: number;
  fewestTurns: number; // Lowest turns to achieve ABCD
  favoriteLetter: Letter;
  lastPlayed: number;
}

const STORAGE_KEY = 'abcd_global_leaderboard_v1';

const DEFAULT_SEEDS: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    name: 'StarHunter',
    wins: 28,
    totalTrades: 142,
    fewestTurns: 3,
    favoriteLetter: 'A',
    lastPlayed: Date.now() - 3600000 * 2,
  },
  {
    id: 'seed-2',
    name: 'AlphaTrader',
    wins: 22,
    totalTrades: 184,
    fewestTurns: 4,
    favoriteLetter: 'B',
    lastPlayed: Date.now() - 3600000 * 5,
  },
  {
    id: 'seed-3',
    name: 'CardNinja',
    wins: 19,
    totalTrades: 98,
    fewestTurns: 2, // Amazing record
    favoriteLetter: 'C',
    lastPlayed: Date.now() - 3600000 * 12,
  },
  {
    id: 'seed-4',
    name: 'BluffMaster',
    wins: 15,
    totalTrades: 210,
    fewestTurns: 5,
    favoriteLetter: 'D',
    lastPlayed: Date.now() - 3600000 * 24,
  },
  {
    id: 'seed-5',
    name: 'SwiftCollector',
    wins: 12,
    totalTrades: 76,
    fewestTurns: 3,
    favoriteLetter: 'A',
    lastPlayed: Date.now() - 3600000 * 48,
  },
  {
    id: 'seed-6',
    name: 'EchoPlayer',
    wins: 9,
    totalTrades: 62,
    fewestTurns: 4,
    favoriteLetter: 'B',
    lastPlayed: Date.now() - 3600000 * 72,
  },
];

class LeaderboardService {
  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') {
      this.entries = DEFAULT_SEEDS;
      return;
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.entries = JSON.parse(data);
      } else {
        this.entries = DEFAULT_SEEDS;
        this.save();
      }
    } catch (e) {
      this.entries = DEFAULT_SEEDS;
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (e) {
      console.warn('Failed to save leaderboard to localStorage', e);
    }
  }

  public getEntries(): LeaderboardEntry[] {
    return [...this.entries];
  }

  public recordMatch(
    playerName: string,
    isWinner: boolean,
    turnsTaken: number,
    tradesMade: number,
    letter: Letter
  ) {
    const trimmed = playerName.trim() || 'Player';
    const existingIndex = this.entries.findIndex(
      (e) => e.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existingIndex >= 0) {
      const existing = this.entries[existingIndex];
      const newWins = isWinner ? existing.wins + 1 : existing.wins;
      const newTrades = existing.totalTrades + Math.max(tradesMade, 1);
      const newFewestTurns =
        isWinner && turnsTaken > 0
          ? existing.fewestTurns > 0
            ? Math.min(existing.fewestTurns, turnsTaken)
            : turnsTaken
          : existing.fewestTurns;

      this.entries[existingIndex] = {
        ...existing,
        wins: newWins,
        totalTrades: newTrades,
        fewestTurns: newFewestTurns,
        favoriteLetter: letter,
        lastPlayed: Date.now(),
      };
    } else {
      this.entries.push({
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: trimmed,
        wins: isWinner ? 1 : 0,
        totalTrades: Math.max(tradesMade, 1),
        fewestTurns: isWinner && turnsTaken > 0 ? turnsTaken : 99,
        favoriteLetter: letter,
        lastPlayed: Date.now(),
      });
    }

    this.save();
  }

  public getTopByWins(limit = 10): LeaderboardEntry[] {
    return [...this.entries]
      .sort((a, b) => b.wins - a.wins || a.fewestTurns - b.fewestTurns)
      .slice(0, limit);
  }

  public getTopByTrades(limit = 10): LeaderboardEntry[] {
    return [...this.entries]
      .sort((a, b) => b.totalTrades - a.totalTrades || b.wins - a.wins)
      .slice(0, limit);
  }

  public getTopByFewestTurns(limit = 10): LeaderboardEntry[] {
    return [...this.entries]
      .filter((e) => e.wins > 0 && e.fewestTurns < 99)
      .sort((a, b) => a.fewestTurns - b.fewestTurns || b.wins - a.wins)
      .slice(0, limit);
  }

  public resetLeaderboard() {
    this.entries = DEFAULT_SEEDS;
    this.save();
  }
}

export const leaderboardService = new LeaderboardService();
