import http from 'http';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Card, Letter, RoomState, RoomPlayer } from './src/types/game';
import {
  analyzeHand,
  isCardTradeLocked,
  getNextCircularRecipientIndex,
} from './src/utils/gameRules';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface InternalPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  assignedLetter?: Letter;
  hand: Card[];
  ws?: WebSocket;
  isConnected: boolean;
  wins: number;
}

interface InternalRoom {
  code: string;
  status: 'LOBBY' | 'DEALING' | 'PLAYING' | 'GAME_OVER';
  hostId: string;
  maxPlayers: number;
  players: InternalPlayer[];
  activePlayerIndex: number;
  currentTradeCycle: number;
  centerCard: Card | null;
  winnerId: string | null;
  winningLetter: Letter | null;
  roundsPlayed: number;
  totalTrades: number;
  centerSwaps: number;
  statusMessage: string;
  botTimer?: NodeJS.Timeout;
  isPublic?: boolean;
  matchTimer?: NodeJS.Timeout;
}

const rooms = new Map<string, InternalRoom>();

function generateRoomCode(): string {
  let code = '';
  do {
    code = Array.from({ length: 5 }, () =>
      ROOM_CODE_CHARS[crypto.randomInt(0, ROOM_CODE_CHARS.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

// Multi-pass cryptographically secure shuffle for true randomness
function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let pass = 0; pass < 3; pass++) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
  }
  return result;
}

function sanitizeRoom(room: InternalRoom): RoomState {
  const activeIdx = room.activePlayerIndex;
  const nextIdx =
    room.players.length > 0 ? (activeIdx + 1) % room.players.length : 0;
  const nextRecipientId = room.players[nextIdx]?.id;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    players: room.players.map((p) => {
      const analysis = analyzeHand(p.hand);
      return {
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isBot: p.isBot,
        assignedLetter: p.assignedLetter,
        targetLetter: analysis.bestLetter || undefined,
        cardCount: p.hand.length,
        targetCount: analysis.bestCount,
        isConnected: p.isConnected,
        wins: p.wins,
      };
    }),
    activePlayerIndex: room.activePlayerIndex,
    activePlayerId: room.players[room.activePlayerIndex]?.id,
    currentTradeCycle: room.currentTradeCycle || 1,
    nextRecipientId,
    winnerId: room.winnerId,
    winningLetter: room.winningLetter,
    roundsPlayed: room.roundsPlayed,
    totalTrades: room.totalTrades,
    centerSwaps: room.centerSwaps,
    hasCenterCard: room.centerCard !== null,
    statusMessage: room.statusMessage,
    isPublic: room.isPublic || false,
  };
}

function broadcastToRoom(
  room: InternalRoom,
  message: Record<string, unknown>,
  excludeWs?: WebSocket
) {
  const payload = JSON.stringify(message);
  for (const player of room.players) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN && player.ws !== excludeWs) {
      player.ws.send(payload);
    }
  }
}

function sendPersonalizedState(room: InternalRoom) {
  const baseState = sanitizeRoom(room);
  for (const player of room.players) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(
        JSON.stringify({
          type: 'ROOM_UPDATE',
          room: baseState,
          myHand: player.hand,
        })
      );
    }
  }
}

// Bot decision logic on server
function runBotTurn(room: InternalRoom) {
  if (room.status !== 'PLAYING') return;
  const bot = room.players[room.activePlayerIndex];
  if (!bot || !bot.isBot) return;

  room.botTimer = setTimeout(() => {
    if (room.status !== 'PLAYING') return;
    const currentBot = room.players[room.activePlayerIndex];
    if (!currentBot || !currentBot.isBot) return;

    const analysis = analyzeHand(currentBot.hand);

    // 1. Victory check: any 4 matching cards
    if (analysis.hasFourOfAKind && analysis.winningLetter) {
      handleOnlineVictory(room, currentBot, analysis.winningLetter);
      return;
    }

    const focusLetter = analysis.bestLetter;
    const unwantedCards = currentBot.hand.filter((c) => c.letter !== focusLetter);

    // Filter by trade lock
    const unlockedUnwanted = unwantedCards.filter(
      (c) => !isCardTradeLocked(c, currentBot.hand, room.currentTradeCycle).isLocked
    );

    let pool = unlockedUnwanted;
    if (pool.length === 0) {
      pool = currentBot.hand.filter(
        (c) => !isCardTradeLocked(c, currentBot.hand, room.currentTradeCycle).isLocked
      );
    }

    const cardToGive =
      pool.length > 0
        ? (pool.find((c) => c.type === 'STAR') || pool[crypto.randomInt(0, pool.length)])
        : currentBot.hand[0];

    // Center swap or circular player trade
    const hasStar = currentBot.hand.some((c) => c.type === 'STAR');
    const starCard = currentBot.hand.find((c) => c.type === 'STAR');
    const starIsUnlocked =
      starCard && !isCardTradeLocked(starCard, currentBot.hand, room.currentTradeCycle).isLocked;

    const shouldTryCenter =
      (hasStar && starIsUnlocked && Math.random() < 0.65) ||
      (!hasStar && Math.random() < 0.25 && room.centerCard !== null);

    if (shouldTryCenter && room.centerCard) {
      const swapCard = starIsUnlocked ? starCard! : cardToGive;
      const oldCenter = room.centerCard;
      oldCenter.receivedInTradeCycle = room.currentTradeCycle;
      room.centerCard = swapCard;
      currentBot.hand = currentBot.hand.map((c) =>
        c.id === swapCard.id ? oldCenter : c
      );
      room.centerSwaps += 1;
      room.statusMessage = `${currentBot.name} secretly swapped a card with the Center Hold-Down!`;

      broadcastToRoom(room, {
        type: 'LOG_EVENT',
        eventType: 'CENTER_SWAP',
        message: `${currentBot.name} swapped a card with the Center Hold-Down!`,
      });

      // Check win after center swap
      const postAnalysis = analyzeHand(currentBot.hand);
      if (postAnalysis.hasFourOfAKind && postAnalysis.winningLetter) {
        handleOnlineVictory(room, currentBot, postAnalysis.winningLetter);
        return;
      }

      advanceOnlineTurn(room);
    } else {
      // Circular trade with the NEXT player in clockwise circle
      const nextIdx = (room.activePlayerIndex + 1) % room.players.length;
      const chosenTarget = room.players[nextIdx];

      executeOnlineTrade(room, currentBot, chosenTarget, cardToGive.id);
    }
  }, 900);
}

function executeOnlineTrade(
  room: InternalRoom,
  fromPlayer: InternalPlayer,
  toPlayer: InternalPlayer,
  offeredCardId: string
) {
  const fromCard = fromPlayer.hand.find((c) => c.id === offeredCardId);
  if (!fromCard) return;

  // Validate trade lock
  const lockCheck = isCardTradeLocked(fromCard, fromPlayer.hand, room.currentTradeCycle);
  if (lockCheck.isLocked) {
    if (fromPlayer.ws && fromPlayer.ws.readyState === WebSocket.OPEN) {
      fromPlayer.ws.send(
        JSON.stringify({
          type: 'ERROR',
          message: lockCheck.reason || 'Cannot trade this card yet!',
        })
      );
    }
    return;
  }

  // Pick return card from recipient (auto-returns their most unwanted eligible card)
  const toAnalysis = analyzeHand(toPlayer.hand);
  const toUnwanted = toPlayer.hand.filter((c) => c.letter !== toAnalysis.bestLetter);
  const unlockedToUnwanted = toUnwanted.filter(
    (c) => !isCardTradeLocked(c, toPlayer.hand, room.currentTradeCycle).isLocked
  );

  let returnCard: Card;
  if (unlockedToUnwanted.length > 0) {
    // Dump Star if possible
    returnCard =
      unlockedToUnwanted.find((c) => c.type === 'STAR') ||
      unlockedToUnwanted[crypto.randomInt(0, unlockedToUnwanted.length)];
  } else {
    const anyUnlocked = toPlayer.hand.filter(
      (c) => !isCardTradeLocked(c, toPlayer.hand, room.currentTradeCycle).isLocked
    );
    returnCard =
      anyUnlocked.length > 0
        ? anyUnlocked[crypto.randomInt(0, anyUnlocked.length)]
        : toPlayer.hand[0];
  }

  // Stamp cycle tracking
  fromCard.receivedInTradeCycle = room.currentTradeCycle;
  fromCard.receivedFromPlayerId = fromPlayer.id;

  returnCard.receivedInTradeCycle = room.currentTradeCycle;
  returnCard.receivedFromPlayerId = toPlayer.id;

  fromPlayer.hand = fromPlayer.hand.map((c) => (c.id === offeredCardId ? returnCard : c));
  toPlayer.hand = toPlayer.hand.map((c) => (c.id === returnCard.id ? fromCard : c));

  room.totalTrades += 1;
  room.statusMessage = `${fromPlayer.name} passed 1 card to ${toPlayer.name} (Round #${room.currentTradeCycle}).`;

  broadcastToRoom(room, {
    type: 'LOG_EVENT',
    eventType: 'TRADE',
    message: `${fromPlayer.name} passed 1 card in circle to ${toPlayer.name}.`,
  });

  // Check victory for either player (any 4 matching cards)
  const fromWin = analyzeHand(fromPlayer.hand);
  if (fromWin.hasFourOfAKind && fromWin.winningLetter) {
    handleOnlineVictory(room, fromPlayer, fromWin.winningLetter);
    return;
  }

  const toWin = analyzeHand(toPlayer.hand);
  if (toWin.hasFourOfAKind && toWin.winningLetter) {
    handleOnlineVictory(room, toPlayer, toWin.winningLetter);
    return;
  }

  advanceOnlineTurn(room);
}

function advanceOnlineTurn(room: InternalRoom) {
  // If activePlayer was the last in circle, completing the cycle wraps and increments trade cycle
  if (room.activePlayerIndex + 1 >= room.players.length) {
    room.currentTradeCycle = (room.currentTradeCycle || 1) + 1;
    room.statusMessage = `Trade Round #${room.currentTradeCycle} begins! Previously locked cards are now unlocked.`;
  }

  room.activePlayerIndex = (room.activePlayerIndex + 1) % room.players.length;
  const nextPlayer = room.players[room.activePlayerIndex];
  const nextRecipient =
    room.players[(room.activePlayerIndex + 1) % room.players.length];

  room.statusMessage = nextPlayer.isBot
    ? `🤖 ${nextPlayer.name} is planning a pass to ${nextRecipient?.name}...`
    : `${nextPlayer.name}'s turn! Pass a card to ${nextRecipient?.name} or swap with Center.`;

  sendPersonalizedState(room);

  if (nextPlayer.isBot) {
    runBotTurn(room);
  }
}

function handleOnlineVictory(
  room: InternalRoom,
  winner: InternalPlayer,
  winningLetter: Letter
) {
  room.status = 'GAME_OVER';
  room.winnerId = winner.id;
  room.winningLetter = winningLetter;
  winner.wins += 1;
  room.roundsPlayed += 1;
  room.statusMessage = `🏆 ${winner.name} yells ABCD! Collected all 4 '${winningLetter}' cards and won the game!`;

  const allHands: Record<string, Card[]> = {};
  for (const p of room.players) {
    allHands[p.id] = p.hand;
  }

  broadcastToRoom(room, {
    type: 'VICTORY',
    winner: {
      id: winner.id,
      name: winner.name,
      assignedLetter: winningLetter,
      wins: winner.wins,
      isHost: winner.isHost,
      isBot: winner.isBot,
      cardCount: 4,
      targetCount: 4,
      isConnected: winner.isConnected,
    },
    allHands,
    centerCard: room.centerCard,
    room: sanitizeRoom(room),
  });

  sendPersonalizedState(room);
}

function startOnlineGame(room: InternalRoom) {
  if (room.players.length < 2) return;
  if (room.botTimer) clearTimeout(room.botTimer);

  room.status = 'PLAYING';
  room.winnerId = null;
  room.winningLetter = null;
  room.activePlayerIndex = 0;
  room.currentTradeCycle = 1;

  const count = room.players.length;
  const gameLetters = LETTERS.slice(0, count);

  // Construct deck: (Players × 4) + 1 Star Card
  const deck: Card[] = [];
  gameLetters.forEach((letter) => {
    for (let i = 1; i <= 4; i++) {
      deck.push({
        id: `card-${letter}-${i}`,
        type: 'LETTER',
        letter,
        label: letter,
      });
    }
  });

  // Ultimate Star Card
  deck.push({
    id: 'card-star-ultimate',
    type: 'STAR',
    label: '★',
  });

  // Cryptographically secure 3-pass shuffle
  const shuffled = secureShuffle(deck);

  // Deal 4 cards each
  room.players.forEach((p, idx) => {
    p.hand = shuffled.slice(idx * 4, idx * 4 + 4);
    p.assignedLetter = gameLetters[idx];
  });

  // Remaining 1 card becomes Center Hold-Down
  room.centerCard = shuffled[count * 4];

  room.statusMessage = `Game started! 4 cards dealt randomly. Round #1. ${room.players[0].name} passes to ${room.players[1].name}.`;

  broadcastToRoom(room, {
    type: 'LOG_EVENT',
    eventType: 'DEAL',
    message: `Cards shuffled & distributed randomly! 1 mystery card held down.`,
  });

  sendPersonalizedState(room);

  // Check if anyone was dealt 4 of a kind instantly
  for (const p of room.players) {
    const analysis = analyzeHand(p.hand);
    if (analysis.hasFourOfAKind && analysis.winningLetter) {
      setTimeout(() => handleOnlineVictory(room, p, analysis.winningLetter!), 800);
      return;
    }
  }

  if (room.players[0].isBot) {
    runBotTurn(room);
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  let playerRoomCode: string | null = null;
  let currentSessionPlayerId: string | null = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'QUICK_MATCH') {
        const playerName = (msg.playerName || 'Player').trim() || 'Player';
        const preferredCapacity = Math.min(Math.max(Number(msg.preferredPlayerCount) || 3, 2), 4);

        // Find existing public room in LOBBY with room for more players
        let targetRoom: InternalRoom | undefined = undefined;
        for (const r of rooms.values()) {
          if (r.isPublic && r.status === 'LOBBY' && r.players.length < r.maxPlayers) {
            targetRoom = r;
            break;
          }
        }

        if (targetRoom) {
          const newPlayerId = `p-${crypto.randomUUID().slice(0, 8)}`;
          const newPlayer: InternalPlayer = {
            id: newPlayerId,
            name: playerName,
            isHost: false,
            isBot: false,
            hand: [],
            ws,
            isConnected: true,
            wins: 0,
          };
          targetRoom.players.push(newPlayer);
          playerRoomCode = targetRoom.code;
          currentSessionPlayerId = newPlayerId;

          targetRoom.statusMessage = `${playerName} matched in! (${targetRoom.players.length}/${targetRoom.maxPlayers} players found)`;

          ws.send(
            JSON.stringify({
              type: 'ROOM_JOINED',
              roomCode: targetRoom.code,
              playerId: newPlayerId,
              room: sanitizeRoom(targetRoom),
            })
          );

          broadcastToRoom(targetRoom, {
            type: 'LOG_EVENT',
            eventType: 'INFO',
            message: `${playerName} matched into the public game! (${targetRoom.players.length}/${targetRoom.maxPlayers})`,
          });

          sendPersonalizedState(targetRoom);

          // If room reached max capacity, start game after a short countdown!
          if (targetRoom.players.length >= targetRoom.maxPlayers) {
            broadcastToRoom(targetRoom, {
              type: 'MATCHMAKING_READY',
              message: 'Table complete! Shuffling and dealing cards...',
            });
            setTimeout(() => {
              if (targetRoom && targetRoom.status === 'LOBBY') {
                startOnlineGame(targetRoom);
              }
            }, 1200);
          }
        } else {
          // Create new public room and await other random searchers
          const code = generateRoomCode();
          const playerId = `p-${crypto.randomUUID().slice(0, 8)}`;
          const newRoom: InternalRoom = {
            code,
            status: 'LOBBY',
            hostId: playerId,
            maxPlayers: preferredCapacity,
            isPublic: true,
            players: [
              {
                id: playerId,
                name: playerName,
                isHost: true,
                isBot: false,
                hand: [],
                ws,
                isConnected: true,
                wins: 0,
              },
            ],
            activePlayerIndex: 0,
            currentTradeCycle: 1,
            centerCard: null,
            winnerId: null,
            winningLetter: null,
            roundsPlayed: 0,
            totalTrades: 0,
            centerSwaps: 0,
            statusMessage: `Searching for random players worldwide... (1/${preferredCapacity})`,
          };

          rooms.set(code, newRoom);
          playerRoomCode = code;
          currentSessionPlayerId = playerId;

          ws.send(
            JSON.stringify({
              type: 'ROOM_CREATED',
              roomCode: code,
              playerId,
              room: sanitizeRoom(newRoom),
            })
          );
        }
      } else if (msg.type === 'CANCEL_MATCHMAKING') {
        if (playerRoomCode && currentSessionPlayerId) {
          const room = rooms.get(playerRoomCode);
          if (room && room.status === 'LOBBY') {
            room.players = room.players.filter((p) => p.id !== currentSessionPlayerId);
            if (room.players.length === 0) {
              rooms.delete(playerRoomCode);
            } else {
              if (room.hostId === currentSessionPlayerId) {
                room.hostId = room.players[0].id;
                room.players[0].isHost = true;
              }
              sendPersonalizedState(room);
            }
          }
          playerRoomCode = null;
          currentSessionPlayerId = null;
        }
      } else if (msg.type === 'CREATE_ROOM') {
        const code = generateRoomCode();
        const playerId = `p-${crypto.randomUUID().slice(0, 8)}`;
        const hostName = (msg.hostName || 'Host').trim() || 'Host';
        const maxPlayers = Math.min(Math.max(Number(msg.maxPlayers) || 2, 2), 6);

        const newRoom: InternalRoom = {
          code,
          status: 'LOBBY',
          hostId: playerId,
          maxPlayers,
          players: [
            {
              id: playerId,
              name: hostName,
              isHost: true,
              isBot: false,
              hand: [],
              ws,
              isConnected: true,
              wins: 0,
            },
          ],
          activePlayerIndex: 0,
          currentTradeCycle: 1,
          centerCard: null,
          winnerId: null,
          winningLetter: null,
          roundsPlayed: 0,
          totalTrades: 0,
          centerSwaps: 0,
          statusMessage: `Room created. Share code: ${code}`,
        };

        rooms.set(code, newRoom);
        playerRoomCode = code;
        currentSessionPlayerId = playerId;

        ws.send(
          JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode: code,
            playerId,
            room: sanitizeRoom(newRoom),
          })
        );
      } else if (msg.type === 'JOIN_ROOM') {
        const code = (msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(code);

        if (!room) {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              message: `Room with code "${code}" not found. Please verify the code.`,
            })
          );
          return;
        }

        // Check if reconnecting existing player
        const existingPlayer = msg.playerId
          ? room.players.find((p) => p.id === msg.playerId)
          : null;

        if (existingPlayer) {
          existingPlayer.ws = ws;
          existingPlayer.isConnected = true;
          playerRoomCode = code;
          currentSessionPlayerId = existingPlayer.id;

          ws.send(
            JSON.stringify({
              type: 'ROOM_JOINED',
              roomCode: code,
              playerId: existingPlayer.id,
              room: sanitizeRoom(room),
              myHand: existingPlayer.hand,
            })
          );
          sendPersonalizedState(room);
          return;
        }

        if (room.status !== 'LOBBY') {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              message: 'Game is already in progress in this room.',
            })
          );
          return;
        }

        if (room.players.length >= room.maxPlayers) {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              message: 'Room is already full.',
            })
          );
          return;
        }

        const playerName =
          (msg.playerName || `Player ${room.players.length + 1}`).trim() ||
          `Player ${room.players.length + 1}`;
        const newPlayerId = `p-${crypto.randomUUID().slice(0, 8)}`;

        const newPlayer: InternalPlayer = {
          id: newPlayerId,
          name: playerName,
          isHost: false,
          isBot: false,
          hand: [],
          ws,
          isConnected: true,
          wins: 0,
        };

        room.players.push(newPlayer);
        playerRoomCode = code;
        currentSessionPlayerId = newPlayerId;

        room.statusMessage = `${playerName} joined the room!`;

        ws.send(
          JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode: code,
            playerId: newPlayerId,
            room: sanitizeRoom(room),
          })
        );

        broadcastToRoom(room, {
          type: 'LOG_EVENT',
          eventType: 'INFO',
          message: `${playerName} joined the room!`,
        });

        sendPersonalizedState(room);
      } else if (msg.type === 'ADD_BOT') {
        const room = rooms.get(playerRoomCode || '');
        if (!room || room.status !== 'LOBBY' || room.players.length >= room.maxPlayers)
          return;

        const botIdx = room.players.length + 1;
        const botName = `Bot ${LETTERS[room.players.length] || botIdx}`;
        room.players.push({
          id: `bot-${crypto.randomUUID().slice(0, 6)}`,
          name: botName,
          isHost: false,
          isBot: true,
          hand: [],
          isConnected: true,
          wins: 0,
        });

        room.statusMessage = `${botName} was added to the room!`;
        sendPersonalizedState(room);
      } else if (msg.type === 'REMOVE_PLAYER') {
        const room = rooms.get(playerRoomCode || '');
        if (!room || room.status !== 'LOBBY') return;
        if (room.hostId !== currentSessionPlayerId) return;

        const targetId = msg.playerId;
        if (targetId === room.hostId) return;

        room.players = room.players.filter((p) => p.id !== targetId);
        room.statusMessage = 'Player removed from lobby.';
        sendPersonalizedState(room);
      } else if (msg.type === 'START_GAME') {
        const room = rooms.get(playerRoomCode || '');
        if (!room || room.players.length < 2) return;
        if (room.hostId !== currentSessionPlayerId) return;

        startOnlineGame(room);
      } else if (msg.type === 'TRADE_WITH_PLAYER') {
        const room = rooms.get(playerRoomCode || '');
        if (!room || room.status !== 'PLAYING') return;

        const activePlayer = room.players[room.activePlayerIndex];
        if (!activePlayer || activePlayer.id !== currentSessionPlayerId) return;

        const targetPlayer = room.players.find((p) => p.id === msg.targetPlayerId);
        if (!targetPlayer) return;

        executeOnlineTrade(room, activePlayer, targetPlayer, msg.offeredCardId);
      } else if (msg.type === 'SWAP_CENTER') {
        const room = rooms.get(playerRoomCode || '');
        if (!room || room.status !== 'PLAYING' || !room.centerCard) return;

        const activePlayer = room.players[room.activePlayerIndex];
        if (!activePlayer || activePlayer.id !== currentSessionPlayerId) return;

        const cardFromHand = activePlayer.hand.find((c) => c.id === msg.offeredCardId);
        if (!cardFromHand) return;

        // Check trade lock
        const lockCheck = isCardTradeLocked(
          cardFromHand,
          activePlayer.hand,
          room.currentTradeCycle
        );
        if (lockCheck.isLocked) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: lockCheck.reason || 'This card is locked this round!',
              })
            );
          }
          return;
        }

        const oldCenter = room.centerCard;
        oldCenter.receivedInTradeCycle = room.currentTradeCycle;
        cardFromHand.receivedInTradeCycle = room.currentTradeCycle;
        room.centerCard = cardFromHand;

        activePlayer.hand = activePlayer.hand.map((c) =>
          c.id === msg.offeredCardId ? oldCenter : c
        );
        room.centerSwaps += 1;
        room.statusMessage = `${activePlayer.name} secretly swapped a card with the Center Hold-Down!`;

        broadcastToRoom(room, {
          type: 'LOG_EVENT',
          eventType: 'CENTER_SWAP',
          message: `${activePlayer.name} secretly swapped a card with the Center Hold-Down!`,
        });

        const centerWin = analyzeHand(activePlayer.hand);
        if (centerWin.hasFourOfAKind && centerWin.winningLetter) {
          handleOnlineVictory(room, activePlayer, centerWin.winningLetter);
          return;
        }

        advanceOnlineTurn(room);
      } else if (msg.type === 'DECLARE_WIN') {
        const room = rooms.get(playerRoomCode || '');
        if (!room || room.status !== 'PLAYING') return;

        const player = room.players.find((p) => p.id === currentSessionPlayerId);
        if (!player) return;

        const winAnalysis = analyzeHand(player.hand);
        if (winAnalysis.hasFourOfAKind && winAnalysis.winningLetter) {
          handleOnlineVictory(room, player, winAnalysis.winningLetter);
        }
      } else if (msg.type === 'PLAY_AGAIN') {
        const room = rooms.get(playerRoomCode || '');
        if (!room) return;
        if (room.hostId !== currentSessionPlayerId) return;

        startOnlineGame(room);
      } else if (msg.type === 'SEND_REACTION') {
        const room = rooms.get(playerRoomCode || '');
        if (!room) return;
        const player = room.players.find((p) => p.id === currentSessionPlayerId);
        if (!player) return;

        broadcastToRoom(room, {
          type: 'REACTION',
          playerName: player.name,
          emoji: msg.emoji,
        });
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (playerRoomCode && currentSessionPlayerId) {
      const room = rooms.get(playerRoomCode);
      if (room) {
        const player = room.players.find((p) => p.id === currentSessionPlayerId);
        if (player) {
          player.isConnected = false;
          player.ws = undefined;
          broadcastToRoom(room, {
            type: 'LOG_EVENT',
            eventType: 'INFO',
            message: `${player.name} disconnected.`,
          });
          sendPersonalizedState(room);
        }
      }
    }
  });
});

// Setup Vite or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
