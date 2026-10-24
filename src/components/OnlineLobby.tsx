import React, { useState } from 'react';
import { RoomState, RoomPlayer } from '../types/game';
import {
  Copy,
  Check,
  Users,
  Play,
  Bot,
  UserPlus,
  Trash2,
  Sparkles,
  Share2,
  ArrowLeft,
  Globe,
} from 'lucide-react';

interface OnlineLobbyProps {
  room: RoomState;
  myPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onLeaveRoom: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  room,
  myPlayerId,
  onStartGame,
  onAddBot,
  onRemovePlayer,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isHost = room.hostId === myPlayerId;
  const canStart = isHost && room.players.length >= 2;
  const canAddBot = isHost && room.players.length < room.maxPlayers;
  const totalCards = room.players.length * 4 + 1;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden animate-fadeIn">
      {/* Background Glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Leave */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {room.isPublic ? 'Cancel Search' : 'Leave Lobby'}
        </button>
        <span className="text-xs text-slate-500 font-mono">
          {room.players.length} / {room.maxPlayers} Players {room.isPublic ? 'Matched' : 'Joined'}
        </span>
      </div>

      {room.isPublic ? (
        /* Public Random Matchmaking Radar Banner */
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-800/80 to-indigo-950/40 border border-indigo-500/40 rounded-2xl p-5 mb-6 text-center">
          <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 mb-2 border border-indigo-500/30">
            <span className="absolute inset-0 rounded-full border-2 border-indigo-400/50 animate-ping pointer-events-none" />
            <Globe className="w-6 h-6 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white font-serif">
            Searching for Players Worldwide
          </h2>
          <p className="text-xs text-indigo-300/80 mt-1">
            Matching with players searching for a game right now...
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-500/40 text-xs font-mono text-indigo-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Found: <strong className="text-amber-300">{room.players.length}</strong> / {room.maxPlayers} Players</span>
          </div>

          {room.players.length >= room.maxPlayers ? (
            <p className="text-xs font-bold text-emerald-400 mt-2.5 animate-pulse">
              Table complete! Shuffling cards and launching match...
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-2">
              Match starts automatically when {room.maxPlayers} players join, or you can start now below!
            </p>
          )}
        </div>
      ) : (
        /* Private Room Code Card */
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-800/80 to-amber-950/40 border border-amber-500/40 rounded-2xl p-5 mb-6 text-center">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest block mb-1">
            Private Room Code
          </span>
          <div className="flex items-center justify-center gap-3 my-2">
            <span className="font-mono text-3xl sm:text-4xl font-black text-amber-300 tracking-wider">
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Copy Room Code"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Share this 5-letter code with your friends so they can join from their own devices!
          </p>

          <div className="mt-3 flex justify-center">
            <button
              onClick={handleCopyLink}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors underline decoration-amber-500/40 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedLink ? 'Invite Link Copied to Clipboard!' : 'Copy Direct Invite Link'}
            </button>
          </div>
        </div>
      )}

      {/* Players in Lobby */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            Connected Players
          </h3>
          {canAddBot && (
            <button
              onClick={onAddBot}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
              Add AI Bot
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {room.players.map((p, idx) => {
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200">
                    {p.isBot ? (
                      <Bot className="w-4 h-4 text-indigo-400" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          You
                        </span>
                      )}
                      {p.isHost && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                          Host
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Will play for Letter <strong className="text-amber-400 font-serif">'{['A', 'B', 'C', 'D', 'E', 'F'][idx]}'</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Ready" />
                  {isHost && !p.isHost && (
                    <button
                      onClick={() => onRemovePlayer(p.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
                      title="Kick player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Shuffling & Distribution Info */}
      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 mb-6 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-amber-300">
          <Sparkles className="w-4 h-4" />
          Random Card Distribution Ready
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          When started, the server will execute a multi-pass cryptographically secure shuffle across all{' '}
          <strong className="text-slate-200 font-mono">{totalCards} cards</strong> ({room.players.length} players × 4 cards + 1 Star Card). Each player gets 4 random cards, and 1 card remains held face-down!
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        {isHost ? (
          <>
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                canStart
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {canStart
                ? room.isPublic
                  ? `Start Public Game Now (${room.players.length} Players)`
                  : 'Distribute Cards & Start Game'
                : 'Waiting for players to join (Min 2)...'}
            </button>
            {room.isPublic && room.players.length < room.maxPlayers && (
              <button
                type="button"
                onClick={() => {
                  onAddBot();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Bot className="w-4 h-4 text-indigo-400" />
                Fill Remaining Slots with AI Bots
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-3 px-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            {room.isPublic
              ? `Waiting for matchmaking to fill (${room.players.length}/${room.maxPlayers} players matched)...`
              : `Waiting for Host (${room.players.find((p) => p.isHost)?.name || 'Host'}) to start the match...`}
          </div>
        )}
      </div>
    </div>
  );
};
