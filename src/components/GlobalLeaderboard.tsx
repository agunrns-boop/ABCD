import React, { useState, useEffect } from 'react';
import {
  leaderboardService,
  LeaderboardEntry,
} from '../services/leaderboardService';
import { Trophy, Flame, Zap, Award, RotateCcw } from 'lucide-react';

type RankingCategory = 'WINS' | 'TRADES' | 'SPEED';

interface GlobalLeaderboardProps {
  onClose?: () => void;
  compact?: boolean;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  compact = false,
}) => {
  const [category, setCategory] = useState<RankingCategory>('WINS');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const loadData = () => {
    if (category === 'WINS') {
      setEntries(leaderboardService.getTopByWins(10));
    } else if (category === 'TRADES') {
      setEntries(leaderboardService.getTopByTrades(10));
    } else {
      setEntries(leaderboardService.getTopByFewestTurns(10));
    }
  };

  useEffect(() => {
    loadData();
  }, [category]);

  const handleReset = () => {
    if (window.confirm('Reset leaderboard to default all-time scores?')) {
      leaderboardService.resetLeaderboard();
      loadData();
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold font-serif text-sm sm:text-base text-slate-100">
              Global Leaderboard
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>All-Time Records</span>
              <span aria-hidden="true">·</span>
              <span>Local High Scores</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
          title="Reset to default mock benchmarks"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      {/* Filter Tabs / Segmented Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl mb-4 border border-slate-700/60">
        <button
          onClick={() => setCategory('WINS')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            category === 'WINS'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Most Wins</span>
        </button>

        <button
          onClick={() => setCategory('TRADES')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            category === 'TRADES'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Total Trades</span>
        </button>

        <button
          onClick={() => setCategory('SPEED')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            category === 'SPEED'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Fewest Turns</span>
        </button>
      </div>

      {/* Table of High Scores */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2 px-2 text-center w-10">#</th>
              <th className="py-2 px-3">Player</th>
              <th className="py-2 px-3 text-right">
                {category === 'WINS'
                  ? 'Wins'
                  : category === 'TRADES'
                  ? 'Total Trades'
                  : 'Fewest Turns'}
              </th>
              <th className="py-2 px-3 text-right hidden sm:table-cell">
                {category === 'WINS' ? 'Trades' : 'Wins'}
              </th>
              <th className="py-2 px-3 text-right hidden sm:table-cell">
                Best Speed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-slate-500 italic"
                >
                  No records yet. Win an ABCD match to enter the hall of fame!
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => {
                const rank = idx + 1;
                const isGold = rank === 1;
                const isSilver = rank === 2;
                const isBronze = rank === 3;

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isGold
                        ? 'bg-amber-500/5 hover:bg-amber-500/10'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-2 text-center">
                      {isGold ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm">
                          1
                        </span>
                      ) : isSilver ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-slate-950 font-black text-[11px]">
                          2
                        </span>
                      ) : isBronze ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-700 text-amber-100 font-bold text-[11px]">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs tabular-nums">
                          {rank}
                        </span>
                      )}
                    </td>

                    {/* Player Name & Favorite Letter */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {entry.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Letter {entry.favoriteLetter}
                        </span>
                      </div>
                    </td>

                    {/* Primary Highlighted Metric */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sm tabular-nums">
                      {category === 'WINS' ? (
                        <span className="text-amber-400">{entry.wins}</span>
                      ) : category === 'TRADES' ? (
                        <span className="text-blue-400">
                          {entry.totalTrades}
                        </span>
                      ) : (
                        <span className="text-emerald-400">
                          {entry.fewestTurns} turns
                        </span>
                      )}
                    </td>

                    {/* Secondary Metric */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums hidden sm:table-cell">
                      {category === 'WINS' ? entry.totalTrades : entry.wins}
                    </td>

                    {/* Best Speed (Fewest Turns) */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums hidden sm:table-cell">
                      {entry.fewestTurns < 99
                        ? `${entry.fewestTurns} turns`
                        : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Benchmark Note */}
      <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Updates automatically after every victory</span>
        <span className="font-mono text-[10px]">v1.0 Mock Service</span>
      </div>
    </div>
  );
};
