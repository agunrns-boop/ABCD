import React from 'react';
import { ArrowLeftRight, HelpCircle, Shuffle } from 'lucide-react';

export interface LogItem {
  id: string;
  type: 'DEAL' | 'TRADE' | 'CENTER_SWAP' | 'VICTORY' | 'INFO';
  message: string;
  timestamp: string;
}

interface GameLogsProps {
  logs: LogItem[];
}

export const GameLogs: React.FC<GameLogsProps> = ({ logs }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col h-48 overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
        <span>Game Activity Feed</span>
        <span className="font-mono text-[10px] text-slate-500">{logs.length} events</span>
      </div>

      <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 text-xs">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-6 text-xs italic">
            Shuffling cards...
          </div>
        ) : (
          logs.map((log) => {
            const icon =
              log.type === 'TRADE' ? (
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              ) : log.type === 'CENTER_SWAP' ? (
                <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              ) : log.type === 'DEAL' ? (
                <Shuffle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <span className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5">★</span>
              );

            return (
              <div
                key={log.id}
                className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-800/40 border border-slate-800/60 text-slate-300 leading-tight"
              >
                {icon}
                <div className="flex-1">
                  <span className="text-slate-200">{log.message}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {log.timestamp}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
