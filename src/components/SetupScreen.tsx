import React, { useState, useEffect } from 'react';
import { GameMode } from '../types/game';
import {
  Users,
  Bot,
  Play,
  Globe,
  PlusCircle,
  LogIn,
  HelpCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

import { GlobalLeaderboard } from './GlobalLeaderboard';

interface SetupScreenProps {
  onStartOfflineGame: (
    playerCount: number,
    isLocalMultiplayer: boolean,
    mode: GameMode,
    humanPlayerName: string
  ) => void;
  onCreateOnlineRoom: (hostName: string, maxPlayers: number) => void;
  onJoinOnlineRoom: (roomCode: string, playerName: string) => void;
  onQuickMatch: (playerName: string, preferredPlayerCount: number) => void;
  onOpenRules: () => void;
  initialRoomCode?: string;
  isConnectingSocket?: boolean;
}

type TabType = 'ONLINE' | 'OFFLINE' | 'LEADERBOARD';
type OnlineSubMode = 'QUICK_MATCH' | 'CREATE' | 'JOIN';

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartOfflineGame,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onQuickMatch,
  onOpenRules,
  initialRoomCode = '',
  isConnectingSocket = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(
    initialRoomCode ? 'ONLINE' : 'ONLINE'
  );
  const [onlineMode, setOnlineMode] = useState<OnlineSubMode>(
    initialRoomCode ? 'JOIN' : 'QUICK_MATCH'
  );

  // Online inputs
  const [quickMatchName, setQuickMatchName] = useState<string>('Player');
  const [quickMatchCapacity, setQuickMatchCapacity] = useState<number>(3);
  const [hostName, setHostName] = useState<string>('Player 1');
  const [joinName, setJoinName] = useState<string>('Guest');
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode.toUpperCase());
  const [maxPlayers, setMaxPlayers] = useState<number>(2);

  // Offline inputs
  const [offlinePlayerCount, setOfflinePlayerCount] = useState<number>(2);
  const [isLocalMultiplayer, setIsLocalMultiplayer] = useState<boolean>(false);
  const [offlineName, setOfflineName] = useState<string>('Player 1');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
      setActiveTab('ONLINE');
      setOnlineMode('JOIN');
    }
  }, [initialRoomCode]);

  const handleQuickMatch = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickMatch(quickMatchName.trim() || 'Player', quickMatchCapacity);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOnlineRoom(hostName.trim() || 'Host', maxPlayers);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    onJoinOnlineRoom(roomCode.trim().toUpperCase(), joinName.trim() || 'Player');
  };

  const handleStartOffline = (e: React.FormEvent) => {
    e.preventDefault();
    onStartOfflineGame(
      offlinePlayerCount,
      isLocalMultiplayer,
      'TURN_BASED',
      offlineName.trim() || 'Player 1'
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden animate-fadeIn">
      {/* Decorative Accent */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dark Theme Hero Banner Graphic */}
      <div className="relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-5 h-36 sm:h-44 overflow-hidden rounded-t-3xl">
        <img
          src="/src/assets/images/abcd_hero_mascot_1792853555248.jpg"
          alt="ABCD Star Card Game Table"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-2 left-0 right-0 text-center px-4">
          <div className="inline-flex items-center gap-1.5 text-2xl sm:text-3xl font-black font-serif text-amber-300 tracking-wider filter drop-shadow">
            <span className="text-rose-400">A</span>
            <span className="text-blue-400">B</span>
            <span className="text-emerald-400">C</span>
            <span className="text-amber-400">D</span>
            <span className="text-purple-400">E</span>
            <span className="text-orange-400">F</span>
            <span className="text-amber-300 ml-1">★</span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-100 font-serif tracking-wider">
            ABCD Card Play
          </h1>
          <p className="text-[11px] text-slate-300">
            The Ultimate Star Card Trading Game (2 to 6 Players)
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl mb-6 border border-slate-700/60">
        <button
          type="button"
          onClick={() => setActiveTab('ONLINE')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ONLINE'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Play</span> Online
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('OFFLINE')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'OFFLINE'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          Solo / Local
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'LEADERBOARD'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Leaderboard
        </button>
      </div>

      {/* ONLINE TAB */}
      {activeTab === 'ONLINE' && (
        <div>
          {/* Subtabs: Quick Match vs Create vs Join */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <button
              type="button"
              onClick={() => setOnlineMode('QUICK_MATCH')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                onlineMode === 'QUICK_MATCH'
                  ? 'bg-amber-500/20 border-amber-400/80 ring-1 ring-amber-400 text-amber-300'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Match</span>
            </button>
            <button
              type="button"
              onClick={() => setOnlineMode('CREATE')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                onlineMode === 'CREATE'
                  ? 'bg-indigo-950/60 border-indigo-400/80 ring-1 ring-indigo-400 text-white'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Create Room</span>
            </button>
            <button
              type="button"
              onClick={() => setOnlineMode('JOIN')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                onlineMode === 'JOIN'
                  ? 'bg-indigo-950/60 border-indigo-400/80 ring-1 ring-indigo-400 text-white'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>Join Code</span>
            </button>
          </div>

          {onlineMode === 'QUICK_MATCH' ? (
            <form onSubmit={handleQuickMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Player Name
                </label>
                <input
                  type="text"
                  value={quickMatchName}
                  onChange={(e) => setQuickMatchName(e.target.value)}
                  maxLength={18}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Player"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Match Format (2 to 6 Players)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 3, 4, 5, 6].map((count) => (
                    <button
                      type="button"
                      key={count}
                      onClick={() => setQuickMatchCapacity(count)}
                      className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        quickMatchCapacity === count
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-serif block">
                        {count === 2 ? '1v1' : `${count}P`}
                      </span>
                      <span className="text-[9px] opacity-80 font-mono block">
                        {count * 4 + 1} Cards
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-amber-300">
                  <Globe className="w-3.5 h-3.5" />
                  Public Random Matchmaking
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Automatically pairs you with other players searching for a game online from any location! No room code needed.
                </p>
              </div>

              <button
                type="submit"
                disabled={isConnectingSocket}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Zap className="w-4 h-4 fill-current" />
                Find & Join Random Match
              </button>
            </form>
          ) : onlineMode === 'CREATE' ? (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Host Name
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  maxLength={18}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Host Player"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Player Capacity (2 to 6 Players)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 3, 4, 5, 6].map((count) => (
                    <button
                      type="button"
                      key={count}
                      onClick={() => setMaxPlayers(count)}
                      className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        maxPlayers === count
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-serif block">{count}P</span>
                      <span className="text-[9px] opacity-80 font-mono block">
                        {count * 4 + 1} Cards
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  What happens when you create:
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  A unique 5-letter Room Code will be generated. Send it to friends or share the invite link. You can also add AI bots to any empty slots!
                </p>
              </div>

              <button
                type="submit"
                disabled={isConnectingSocket}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <PlusCircle className="w-4 h-4" />
                Generate Room & Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Enter Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-mono text-lg tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-amber-400 font-black placeholder:text-slate-600"
                  placeholder="e.g. STAR8"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Player Name
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  maxLength={18}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Guest Player"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!roomCode.trim() || isConnectingSocket}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  roomCode.trim()
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Search & Join Room
              </button>
            </form>
          )}
        </div>
      )}

      {/* OFFLINE TAB */}
      {activeTab === 'OFFLINE' && (
        <form onSubmit={handleStartOffline} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Number of Players (2 to 6 Players)
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[2, 3, 4, 5, 6].map((count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setOfflinePlayerCount(count)}
                  className={`py-2 px-1 sm:px-2 rounded-xl text-center border transition-all cursor-pointer ${
                    offlinePlayerCount === count
                      ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-serif block">{count}P</span>
                  <span className="text-[9px] sm:text-[10px] opacity-80 font-mono block">
                    {count * 4 + 1} Cards
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsLocalMultiplayer(false)}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                !isLocalMultiplayer
                  ? 'bg-indigo-950/60 border-indigo-400/80 ring-1 ring-indigo-400 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Bot className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs block text-slate-200">
                  Solo vs AI Bots
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                  Play against adaptive bots immediately on this device.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsLocalMultiplayer(true)}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                isLocalMultiplayer
                  ? 'bg-indigo-950/60 border-indigo-400/80 ring-1 ring-indigo-400 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs block text-slate-200">
                  Local Pass & Play
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                  Share 1 screen with hotseat privacy shields.
                </span>
              </div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Your Player Name
            </label>
            <input
              type="text"
              value={offlineName}
              onChange={(e) => setOfflineName(e.target.value)}
              maxLength={18}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Player 1"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Deal Cards & Start Match
          </button>
        </form>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === 'LEADERBOARD' && (
        <div className="pt-1">
          <GlobalLeaderboard />
        </div>
      )}

      {/* Rules button */}
      <div className="mt-5 pt-4 border-t border-slate-800 text-center">
        <button
          type="button"
          onClick={onOpenRules}
          className="text-xs text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Read ABCD Rules & The Star Card Blocker Math
        </button>
      </div>
    </div>
  );
};
