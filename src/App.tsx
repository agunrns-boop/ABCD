import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Player,
  Letter,
  GameStatus,
  GameMode,
  RoomState,
  RoomPlayer,
  OnlineGameOverData,
} from './types/game';
import { SetupScreen } from './components/SetupScreen';
import { OnlineLobby } from './components/OnlineLobby';
import { GameTable } from './components/GameTable';
import { PlayerHand } from './components/PlayerHand';
import { RulesModal } from './components/RulesModal';
import { VictoryModal } from './components/VictoryModal';
import { PassPlayVeil } from './components/PassPlayVeil';
import { GameLogs, LogItem } from './components/GameLogs';
import { sound } from './utils/sound';
import { triggerConfetti } from './utils/confetti';
import { decideBotTurn, botPickCardToReturn } from './utils/botAi';
import {
  analyzeHand,
  isCardTradeLocked,
  getNextCircularRecipientIndex,
} from './utils/gameRules';
import { onlineSocket } from './utils/onlineSocket';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Layers,
  Globe,
  Copy,
  Check,
  Smile,
  Trophy,
  X,
} from 'lucide-react';
import { leaderboardService } from './services/leaderboardService';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';

const LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E', 'F'];

type OverallScreen =
  | 'SETUP'
  | 'ONLINE_LOBBY'
  | 'OFFLINE_PLAYING'
  | 'ONLINE_PLAYING'
  | 'PASS_PLAY_PRIVACY';

export default function App() {
  const [screen, setScreen] = useState<OverallScreen>('SETUP');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Online Multiplayer State
  const [onlineRoom, setOnlineRoom] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [myOnlineHand, setMyOnlineHand] = useState<Card[]>([]);
  const [initialUrlRoomCode, setInitialUrlRoomCode] = useState<string>('');
  const [copiedCodeBanner, setCopiedCodeBanner] = useState<boolean>(false);
  const [floatingReaction, setFloatingReaction] = useState<{
    player: string;
    emoji: string;
  } | null>(null);

  // Offline Game State
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [isLocalMultiplayer, setIsLocalMultiplayer] = useState<boolean>(false);
  const [offlinePlayers, setOfflinePlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [offlineCenterCard, setOfflineCenterCard] = useState<Card | null>(null);
  const [offlineTradeCycle, setOfflineTradeCycle] = useState<number>(1);

  // Selection & UI state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [finalRevealPlayers, setFinalRevealPlayers] = useState<Player[]>([]);
  const [finalRevealCenterCard, setFinalRevealCenterCard] =
    useState<Card | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] =
    useState<boolean>(false);

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isProcessingMove, setIsProcessingMove] = useState<boolean>(false);
  const [activeStatusMessage, setActiveStatusMessage] = useState<string>('');
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] =
    useState<boolean>(false);
  const [offlineTurnCount, setOfflineTurnCount] = useState<number>(1);
  const [soundMuted, setSoundMuted] = useState<boolean>(sound.getMuted());
  const [stats, setStats] = useState({
    roundsPlayed: 0,
    totalTrades: 0,
    centerSwaps: 0,
  });

  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback(
    (type: LogItem['type'], message: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLogs((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          type,
          message,
          timestamp: timeStr,
        },
        ...prev.slice(0, 40),
      ]);
    },
    []
  );

  const toggleSound = () => {
    const nextState = !soundMuted;
    setSoundMuted(nextState);
    sound.setMuted(nextState);
  };

  // Inspect URL for ?room=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('room');
      if (code) {
        setInitialUrlRoomCode(code.toUpperCase());
      }
    }
  }, []);

  // Subscribe to Online WebSocket events
  useEffect(() => {
    const unsubscribe = onlineSocket.subscribe((msg: any) => {
      if (msg.type === 'ERROR') {
        setErrorMessage(msg.message);
        setTimeout(() => setErrorMessage(null), 4000);
      } else if (msg.type === 'ROOM_CREATED') {
        setMyPlayerId(msg.playerId);
        setOnlineRoom(msg.room);
        setScreen('ONLINE_LOBBY');
        sound.playSelect();
        addLog('INFO', `Created online room #${msg.roomCode}. Share the code!`);
      } else if (msg.type === 'ROOM_JOINED') {
        setMyPlayerId(msg.playerId);
        setOnlineRoom(msg.room);
        if (msg.myHand) {
          setMyOnlineHand(msg.myHand);
        }
        setScreen(msg.room.status === 'PLAYING' ? 'ONLINE_PLAYING' : 'ONLINE_LOBBY');
        sound.playSelect();
        addLog('INFO', `Joined room #${msg.roomCode}!`);
      } else if (msg.type === 'ROOM_UPDATE') {
        const room: RoomState = msg.room;
        setOnlineRoom(room);
        if (msg.myHand) {
          setMyOnlineHand(msg.myHand);
        }
        if (room.status === 'PLAYING') {
          setScreen('ONLINE_PLAYING');
          setActiveStatusMessage(room.statusMessage);
        } else if (room.status === 'LOBBY') {
          setScreen('ONLINE_LOBBY');
        }
      } else if (msg.type === 'LOG_EVENT') {
        addLog(
          msg.eventType === 'TRADE'
            ? 'TRADE'
            : msg.eventType === 'CENTER_SWAP'
            ? 'CENTER_SWAP'
            : msg.eventType === 'DEAL'
            ? 'DEAL'
            : 'INFO',
          msg.message
        );
        if (msg.eventType === 'TRADE') sound.playTrade();
        if (msg.eventType === 'CENTER_SWAP') sound.playCenterSwap();
        if (msg.eventType === 'DEAL') sound.playDeal();
      } else if (msg.type === 'VICTORY') {
        const winData = msg as {
          winner: RoomPlayer;
          allHands: Record<string, Card[]>;
          centerCard: Card;
          room: RoomState;
        };
        sound.playWin();
        triggerConfetti();

        // Convert room players to Player format with all hands revealed
        const revealPlayers: Player[] = winData.room.players.map((rp) => ({
          id: rp.id,
          name: rp.name,
          assignedLetter: rp.assignedLetter || 'A',
          isBot: rp.isBot,
          avatarSeed: rp.name,
          hand: winData.allHands[rp.id] || [],
          selectedCardId: null,
          targetCount: (winData.allHands[rp.id] || []).filter(
            (c) => c.letter === rp.assignedLetter
          ).length,
          wins: rp.wins,
        }));

        const winPlayer: Player = {
          id: winData.winner.id,
          name: winData.winner.name,
          assignedLetter: winData.winner.assignedLetter || 'A',
          isBot: winData.winner.isBot,
          avatarSeed: winData.winner.name,
          hand: winData.allHands[winData.winner.id] || [],
          selectedCardId: null,
          targetCount: 4,
          wins: winData.winner.wins,
        };

        setWinner(winPlayer);
        setFinalRevealPlayers(revealPlayers);
        setFinalRevealCenterCard(winData.centerCard);
        setIsGameOverModalOpen(true);

        // Record online victory into global leaderboard
        leaderboardService.recordMatch(
          winPlayer.name,
          true,
          winData.room.totalTrades || 4,
          winData.room.totalTrades || 4,
          winPlayer.assignedLetter || 'A'
        );

        addLog(
          'VICTORY',
          `🏆 ${winPlayer.name} yells ABCD! Collected all 4 '${winPlayer.assignedLetter}' cards and won!`
        );
      } else if (msg.type === 'REACTION') {
        setFloatingReaction({ player: msg.playerName, emoji: msg.emoji });
        setTimeout(() => setFloatingReaction(null), 2500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addLog]);

  // Online Action Handlers
  const handleCreateOnlineRoom = (hostName: string, maxP: number) => {
    onlineSocket.createRoom(hostName, maxP);
  };

  const handleJoinOnlineRoom = (code: string, pName: string) => {
    onlineSocket.joinRoom(code, pName);
  };

  const handleStartOnlineGame = () => {
    onlineSocket.startGame();
  };

  const handleOnlineTrade = (targetPlayerId: string) => {
    if (!selectedCardId) return;
    onlineSocket.tradeWithPlayer(selectedCardId, targetPlayerId);
    setSelectedCardId(null);
  };

  const handleOnlineCenterSwap = () => {
    if (!selectedCardId) return;
    onlineSocket.swapCenter(selectedCardId);
    setSelectedCardId(null);
  };

  const handleOnlineClaimVictory = () => {
    onlineSocket.declareWin();
  };

  const handleSendReaction = (emoji: string) => {
    onlineSocket.sendReaction(emoji);
  };

  const handleQuickMatch = (pName: string, preferredCount: number) => {
    onlineSocket.quickMatch(pName, preferredCount);
  };

  const handleLeaveOnlineRoom = () => {
    onlineSocket.cancelMatchmaking();
    setOnlineRoom(null);
    setMyOnlineHand([]);
    setScreen('SETUP');
  };

  // --- OFFLINE GAME ENGINE ---
  const startOfflineGame = useCallback(
    (
      count: number,
      localMultiplayer: boolean,
      mode: GameMode,
      humanName: string
    ) => {
      setPlayerCount(count);
      setIsLocalMultiplayer(localMultiplayer);
      setWinner(null);
      setSelectedCardId(null);
      setIsProcessingMove(false);
      setIsGameOverModalOpen(false);
      setOfflineTradeCycle(1);

      const deck: Card[] = [];
      const gameLetters = LETTERS.slice(0, count);

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

      deck.push({
        id: 'card-star-ultimate',
        type: 'STAR',
        label: '★',
      });

      // 3-pass Fisher-Yates shuffle
      for (let pass = 0; pass < 3; pass++) {
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
      }

      sound.playShuffle();

      const newPlayers: Player[] = gameLetters.map((letter, idx) => {
        const isBot = localMultiplayer ? false : idx !== 0;
        const name =
          idx === 0
            ? humanName || 'Player 1'
            : isBot
            ? `Bot ${letter}`
            : `Player ${idx + 1}`;

        const hand = deck.splice(0, 4);
        const analysis = analyzeHand(hand);

        return {
          id: `player-${idx + 1}`,
          name,
          assignedLetter: letter,
          targetLetter: analysis.bestLetter || undefined,
          isBot,
          avatarSeed: name,
          hand,
          selectedCardId: null,
          targetCount: analysis.bestCount,
          wins: 0,
        };
      });

      const remainingHoldDown = deck[0];
      setOfflineCenterCard(remainingHoldDown);
      setOfflinePlayers(newPlayers);
      setActivePlayerIndex(0);
      setOfflineTurnCount(1);
      setScreen('OFFLINE_PLAYING');

      sound.playDeal();

      const p1Next = newPlayers[1]?.name || 'Player 2';
      addLog(
        'DEAL',
        `Dealt 4 cards randomly to each of the ${count} players. Mystery card held down. Round #1!`
      );
      setActiveStatusMessage(
        `${newPlayers[0].name}'s turn! Pass an eligible card to ${p1Next} or swap with Center.`
      );

      // Check if anyone was dealt 4 of a kind instantly
      const initialWinner = newPlayers.find(
        (p) => analyzeHand(p.hand).hasFourOfAKind
      );
      if (initialWinner) {
        setTimeout(() => {
          handleOfflineVictory(initialWinner, newPlayers, remainingHoldDown);
        }, 600);
      }
    },
    [addLog]
  );

  const handleOfflineVictory = useCallback(
    (
      winningPlayer: Player,
      currentPlayers?: Player[],
      finalCenter?: Card | null
    ) => {
      const winAnalysis = analyzeHand(winningPlayer.hand);
      const winLetter =
        winAnalysis.winningLetter ||
        winningPlayer.targetLetter ||
        winningPlayer.assignedLetter ||
        'A';

      const enrichedWinner: Player = {
        ...winningPlayer,
        assignedLetter: winLetter,
        targetLetter: winLetter,
        targetCount: 4,
      };

      setWinner(enrichedWinner);
      setFinalRevealPlayers(currentPlayers || offlinePlayers);
      setFinalRevealCenterCard(finalCenter || offlineCenterCard);
      setIsGameOverModalOpen(true);
      sound.playWin();
      triggerConfetti();

      // Record offline victory into global leaderboard
      leaderboardService.recordMatch(
        winningPlayer.name,
        true,
        offlineTurnCount,
        stats.totalTrades + 1,
        winLetter
      );

      setOfflinePlayers((prev) =>
        prev.map((p) =>
          p.id === winningPlayer.id ? { ...p, wins: p.wins + 1 } : p
        )
      );

      setStats((prev) => ({
        ...prev,
        roundsPlayed: prev.roundsPlayed + 1,
      }));

      addLog(
        'VICTORY',
        `🏆 ${winningPlayer.name} yells ABCD! Collected all 4 '${winLetter}' cards!`
      );
    },
    [addLog, offlinePlayers, offlineCenterCard, offlineTurnCount, stats.totalTrades]
  );

  const checkOfflineWinCondition = useCallback(
    (player: Player, allP: Player[], curC: Card | null): boolean => {
      const analysis = analyzeHand(player.hand);
      if (analysis.hasFourOfAKind && analysis.winningLetter) {
        handleOfflineVictory(player, allP, curC);
        return true;
      }
      return false;
    },
    [handleOfflineVictory]
  );

  const advanceOfflineTurn = useCallback(
    (nextIdx: number, currentPlayers: Player[], curCenter: Card | null) => {
      // Check if trade round in circle has wrapped around
      if (nextIdx === 0) {
        setOfflineTradeCycle((prev) => {
          const nextCycle = prev + 1;
          addLog(
            'INFO',
            `Trade Round #${nextCycle} begins! Previously locked cards are now unlocked.`
          );
          return nextCycle;
        });
      }

      setActivePlayerIndex(nextIdx);
      setSelectedCardId(null);
      setIsProcessingMove(false);
      setOfflineTurnCount((prev) => prev + 1);

      const nextPlayer = currentPlayers[nextIdx];
      const nextTarget =
        currentPlayers[(nextIdx + 1) % currentPlayers.length];

      if (isLocalMultiplayer && !nextPlayer.isBot) {
        setScreen('PASS_PLAY_PRIVACY');
        return;
      }

      setActiveStatusMessage(
        nextPlayer.isBot
          ? `🤖 ${nextPlayer.name} is planning a pass to ${nextTarget.name}...`
          : `${nextPlayer.name}'s turn! Pass a card to ${nextTarget.name} or swap with Center.`
      );
    },
    [isLocalMultiplayer, addLog]
  );

  const executeOfflineTrade = useCallback(
    (offeredCardId: string, targetPlayerId: string) => {
      if (isProcessingMove) return;
      setIsProcessingMove(true);

      const activePlayer = offlinePlayers[activePlayerIndex];
      const targetPlayer = offlinePlayers.find((p) => p.id === targetPlayerId);

      if (!activePlayer || !targetPlayer) {
        setIsProcessingMove(false);
        return;
      }

      const activeCard = activePlayer.hand.find((c) => c.id === offeredCardId);
      if (!activeCard) {
        setIsProcessingMove(false);
        return;
      }

      // Check if activeCard is trade locked
      const lockCheck = isCardTradeLocked(
        activeCard,
        activePlayer.hand,
        offlineTradeCycle
      );
      if (lockCheck.isLocked) {
        alert(
          `🔒 Cannot pass this card!\n\n${lockCheck.reason || 'Card received this round. You can pass it after this trade round ends (or if you hold 3 of a kind).'}`
        );
        setIsProcessingMove(false);
        return;
      }

      let returnCard: Card;
      if (targetPlayer.isBot) {
        returnCard = botPickCardToReturn(
          targetPlayer,
          activePlayer,
          offlineTradeCycle
        );
      } else {
        const targetAnalysis = analyzeHand(targetPlayer.hand);
        const unwanted = targetPlayer.hand.filter(
          (c) => c.letter !== targetAnalysis.bestLetter
        );
        const unlockedUnwanted = unwanted.filter(
          (c) =>
            !isCardTradeLocked(c, targetPlayer.hand, offlineTradeCycle).isLocked
        );

        if (unlockedUnwanted.length > 0) {
          returnCard =
            unlockedUnwanted.find((c) => c.type === 'STAR') ||
            unlockedUnwanted[0];
        } else {
          const unlockedAll = targetPlayer.hand.filter(
            (c) =>
              !isCardTradeLocked(c, targetPlayer.hand, offlineTradeCycle).isLocked
          );
          returnCard =
            unlockedAll.length > 0 ? unlockedAll[0] : targetPlayer.hand[0];
        }
      }

      sound.playTrade();

      // Stamp trade cycle
      activeCard.receivedInTradeCycle = offlineTradeCycle;
      activeCard.receivedFromPlayerId = activePlayer.id;

      returnCard.receivedInTradeCycle = offlineTradeCycle;
      returnCard.receivedFromPlayerId = targetPlayer.id;

      const updatedPlayers = offlinePlayers.map((p) => {
        if (p.id === activePlayer.id) {
          const newHand = p.hand.map((c) =>
            c.id === offeredCardId ? returnCard : c
          );
          const analysis = analyzeHand(newHand);
          return {
            ...p,
            hand: newHand,
            targetLetter: analysis.bestLetter || undefined,
            targetCount: analysis.bestCount,
          };
        }
        if (p.id === targetPlayer.id) {
          const newHand = p.hand.map((c) =>
            c.id === returnCard.id ? activeCard : c
          );
          const analysis = analyzeHand(newHand);
          return {
            ...p,
            hand: newHand,
            targetLetter: analysis.bestLetter || undefined,
            targetCount: analysis.bestCount,
          };
        }
        return p;
      });

      setOfflinePlayers(updatedPlayers);
      setStats((prev) => ({ ...prev, totalTrades: prev.totalTrades + 1 }));

      addLog(
        'TRADE',
        `${activePlayer.name} passed 1 card in circle to ${targetPlayer.name} (Round #${offlineTradeCycle}).`
      );

      const updatedActive = updatedPlayers.find((p) => p.id === activePlayer.id)!;
      const updatedTarget = updatedPlayers.find((p) => p.id === targetPlayerId)!;

      if (
        checkOfflineWinCondition(updatedActive, updatedPlayers, offlineCenterCard) ||
        checkOfflineWinCondition(updatedTarget, updatedPlayers, offlineCenterCard)
      ) {
        return;
      }

      setTimeout(() => {
        const nextIdx = (activePlayerIndex + 1) % offlinePlayers.length;
        advanceOfflineTurn(nextIdx, updatedPlayers, offlineCenterCard);
      }, 500);
    },
    [
      isProcessingMove,
      offlinePlayers,
      activePlayerIndex,
      offlineTradeCycle,
      offlineCenterCard,
      addLog,
      checkOfflineWinCondition,
      advanceOfflineTurn,
    ]
  );

  const executeOfflineCenterSwap = useCallback(
    (offeredCardId: string) => {
      if (isProcessingMove || !offlineCenterCard) return;
      setIsProcessingMove(true);

      const activePlayer = offlinePlayers[activePlayerIndex];
      const cardFromHand = activePlayer.hand.find((c) => c.id === offeredCardId);
      if (!cardFromHand) {
        setIsProcessingMove(false);
        return;
      }

      // Check lock
      const lockCheck = isCardTradeLocked(
        cardFromHand,
        activePlayer.hand,
        offlineTradeCycle
      );
      if (lockCheck.isLocked) {
        alert(
          `🔒 Cannot swap this card!\n\n${lockCheck.reason || 'Card received this round. You can swap it after this round completes (or if you hold 3 of a kind).'}`
        );
        setIsProcessingMove(false);
        return;
      }

      sound.playCenterSwap();

      const oldCenter = offlineCenterCard;
      oldCenter.receivedInTradeCycle = offlineTradeCycle;
      cardFromHand.receivedInTradeCycle = offlineTradeCycle;

      const newHand = activePlayer.hand.map((c) =>
        c.id === offeredCardId ? oldCenter : c
      );
      const newCenter = cardFromHand;

      const updatedPlayers = offlinePlayers.map((p) => {
        if (p.id === activePlayer.id) {
          const analysis = analyzeHand(newHand);
          return {
            ...p,
            hand: newHand,
            targetLetter: analysis.bestLetter || undefined,
            targetCount: analysis.bestCount,
          };
        }
        return p;
      });

      setOfflinePlayers(updatedPlayers);
      setOfflineCenterCard(newCenter);
      setStats((prev) => ({ ...prev, centerSwaps: prev.centerSwaps + 1 }));

      addLog(
        'CENTER_SWAP',
        `${activePlayer.name} secretly swapped a card with the Center Hold-Down!`
      );

      const updatedActive = updatedPlayers.find((p) => p.id === activePlayer.id)!;
      if (checkOfflineWinCondition(updatedActive, updatedPlayers, newCenter)) {
        return;
      }

      setTimeout(() => {
        const nextIdx = (activePlayerIndex + 1) % offlinePlayers.length;
        advanceOfflineTurn(nextIdx, updatedPlayers, newCenter);
      }, 500);
    },
    [
      isProcessingMove,
      offlineCenterCard,
      offlinePlayers,
      activePlayerIndex,
      offlineTradeCycle,
      addLog,
      checkOfflineWinCondition,
      advanceOfflineTurn,
    ]
  );

  // Offline Bot Automation
  useEffect(() => {
    if (screen !== 'OFFLINE_PLAYING' || isProcessingMove) return;

    const currentActive = offlinePlayers[activePlayerIndex];
    if (!currentActive || !currentActive.isBot) return;

    botTimerRef.current = setTimeout(() => {
      const bot = offlinePlayers[activePlayerIndex];
      if (!bot) return;

      const decision = decideBotTurn(
        bot,
        offlinePlayers,
        false,
        offlineTradeCycle
      );

      if (decision.action === 'DECLARE_WIN') {
        handleOfflineVictory(bot, offlinePlayers, offlineCenterCard);
        return;
      }

      if (decision.action === 'SWAP_CENTER' && offlineCenterCard) {
        executeOfflineCenterSwap(decision.offeredCardId);
      } else if (decision.action === 'TRADE_PLAYER' && decision.targetPlayerId) {
        executeOfflineTrade(decision.offeredCardId, decision.targetPlayerId);
      } else {
        const nextIdx = (activePlayerIndex + 1) % offlinePlayers.length;
        advanceOfflineTurn(nextIdx, offlinePlayers, offlineCenterCard);
      }
    }, 900);

    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
      }
    };
  }, [
    screen,
    activePlayerIndex,
    offlinePlayers,
    offlineCenterCard,
    offlineTradeCycle,
    isProcessingMove,
    executeOfflineCenterSwap,
    executeOfflineTrade,
    handleOfflineVictory,
    advanceOfflineTurn,
  ]);

  const handleSelectCard = (cardId: string) => {
    sound.playSelect();
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  };

  // Convert online players to GameTable / PlayerHand compatible format
  const getOnlineDisplayPlayers = (): Player[] => {
    if (!onlineRoom) return [];
    return onlineRoom.players.map((rp) => {
      const isMe = rp.id === myPlayerId;
      const myHandAnalysis = isMe ? analyzeHand(myOnlineHand) : null;
      return {
        id: rp.id,
        name: rp.name + (isMe ? ' (You)' : ''),
        assignedLetter: rp.assignedLetter || 'A',
        targetLetter: isMe
          ? myHandAnalysis?.bestLetter || undefined
          : rp.targetLetter,
        isBot: rp.isBot,
        avatarSeed: rp.name,
        // For opponents, create 4 dummy cards representing face-down cards
        hand: isMe
          ? myOnlineHand
          : Array.from({ length: rp.cardCount }, (_, i) => ({
              id: `dummy-${rp.id}-${i}`,
              type: 'LETTER',
              label: '?',
            })),
        selectedCardId: isMe ? selectedCardId : null,
        targetCount: isMe
          ? myHandAnalysis?.bestCount || 0
          : rp.targetCount || 0,
        wins: rp.wins,
      };
    });
  };

  const isOnline = screen === 'ONLINE_PLAYING';
  const displayPlayers = isOnline ? getOnlineDisplayPlayers() : offlinePlayers;
  const currentActivePlayerId = isOnline
    ? onlineRoom?.activePlayerId || ''
    : offlinePlayers[activePlayerIndex]?.id || '';
  const myPlayerObj = isOnline
    ? displayPlayers.find((p) => p.id === myPlayerId) || null
    : isLocalMultiplayer
    ? offlinePlayers[activePlayerIndex]
    : offlinePlayers[0] || null;

  const isMyTurnOnline = isOnline && currentActivePlayerId === myPlayerId;
  const isMyTurnOffline =
    !isOnline &&
    (isLocalMultiplayer
      ? true
      : offlinePlayers[activePlayerIndex]?.id === offlinePlayers[0]?.id);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative">
      {/* Floating Reaction Notification */}
      {floatingReaction && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 border border-amber-400 text-white shadow-2xl animate-bounce flex items-center gap-2 backdrop-blur">
          <span className="text-2xl">{floatingReaction.emoji}</span>
          <span className="text-xs font-bold text-amber-300">
            {floatingReaction.player}
          </span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 text-xs shadow-xl animate-fadeIn">
          {errorMessage}
        </div>
      )}

      {/* Universal Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-30 shrink-0">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-black font-serif tracking-tight text-white whitespace-nowrap shrink-0">
            ABCD Card Play <span className="text-amber-400">★</span>
          </span>
          {isOnline && onlineRoom && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-xs font-mono text-indigo-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Room: </span>
              <strong className="text-amber-300 font-bold">{onlineRoom.code}</strong>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(onlineRoom.code);
                  setCopiedCodeBanner(true);
                  setTimeout(() => setCopiedCodeBanner(false), 2000);
                }}
                className="hover:text-white transition-colors ml-0.5 cursor-pointer"
                title="Copy Room Code"
              >
                {copiedCodeBanner ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setRulesOpen(true)}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Rules & Star Card
          </button>
          <button
            onClick={() => setLeaderboardModalOpen(true)}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Leaderboard
          </button>
          <div className="flex items-center gap-1 text-slate-500 whitespace-nowrap shrink-0">
            <Layers className="w-3.5 h-3.5" />
            <span>Deck: </span>
            <strong className="text-slate-300 font-mono">
              {isOnline
                ? (onlineRoom?.players.length || 2) * 4 + 1
                : playerCount * 4 + 1}{' '}
              Cards
            </strong>
          </div>
          <div className="text-slate-500 whitespace-nowrap shrink-0">
            <span>Mode: </span>
            <strong className="text-slate-300">
              {isOnline ? 'Online Room' : 'Offline Match'}
            </strong>
          </div>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {(screen === 'OFFLINE_PLAYING' || screen === 'ONLINE_PLAYING') && (
            <button
              onClick={() => {
                if (isOnline) {
                  handleLeaveOnlineRoom();
                } else {
                  setScreen('SETUP');
                }
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isOnline ? 'Leave Room' : 'New Match'}
            </button>
          )}

          {screen === 'SETUP' && (
            <button
              onClick={() => setRulesOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Game Rules
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-between">
        {screen === 'SETUP' && (
          <div className="flex-1 flex items-center justify-center py-6">
            <SetupScreen
              onStartOfflineGame={startOfflineGame}
              onCreateOnlineRoom={handleCreateOnlineRoom}
              onJoinOnlineRoom={handleJoinOnlineRoom}
              onQuickMatch={handleQuickMatch}
              onOpenRules={() => setRulesOpen(true)}
              initialRoomCode={initialUrlRoomCode}
            />
          </div>
        )}

        {screen === 'ONLINE_LOBBY' && onlineRoom && (
          <div className="flex-1 flex items-center justify-center py-6">
            <OnlineLobby
              room={onlineRoom}
              myPlayerId={myPlayerId}
              onStartGame={handleStartOnlineGame}
              onAddBot={() => onlineSocket.addBot()}
              onRemovePlayer={(pId) => onlineSocket.removePlayer(pId)}
              onLeaveRoom={handleLeaveOnlineRoom}
            />
          </div>
        )}

        {(screen === 'OFFLINE_PLAYING' || screen === 'ONLINE_PLAYING') && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Arena Felt Table */}
            <GameTable
              players={displayPlayers}
              activePlayerId={currentActivePlayerId}
              humanPlayerId={
                isOnline
                  ? myPlayerId
                  : isLocalMultiplayer
                  ? currentActivePlayerId
                  : offlinePlayers[0]?.id || ''
              }
              currentTradeCycle={
                isOnline ? onlineRoom?.currentTradeCycle || 1 : offlineTradeCycle
              }
              nextRecipientId={
                isOnline
                  ? onlineRoom?.nextRecipientId
                  : offlinePlayers[(activePlayerIndex + 1) % offlinePlayers.length]?.id
              }
              centerCard={isOnline ? null : offlineCenterCard}
              selectedCardId={selectedCardId}
              onTradeWithPlayer={(targetId) => {
                if (isOnline) {
                  handleOnlineTrade(targetId);
                } else if (selectedCardId) {
                  executeOfflineTrade(selectedCardId, targetId);
                }
              }}
              onSwapWithCenter={() => {
                if (isOnline) {
                  handleOnlineCenterSwap();
                } else if (selectedCardId) {
                  executeOfflineCenterSwap(selectedCardId);
                }
              }}
              isProcessingMove={isProcessingMove}
              activeStatusMessage={
                isOnline
                  ? onlineRoom?.statusMessage || activeStatusMessage
                  : activeStatusMessage
              }
            />

            {/* Bottom Row: Player Hand & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
              <div className="lg:col-span-3">
                {myPlayerObj && (
                  <div className="flex flex-col gap-2">
                    <PlayerHand
                      player={myPlayerObj}
                      selectedCardId={selectedCardId}
                      currentTradeCycle={
                        isOnline
                          ? onlineRoom?.currentTradeCycle || 1
                          : offlineTradeCycle
                      }
                      nextRecipientName={
                        isOnline
                          ? displayPlayers.find(
                              (p) => p.id === onlineRoom?.nextRecipientId
                            )?.name
                          : offlinePlayers[
                              (activePlayerIndex + 1) % offlinePlayers.length
                            ]?.name
                      }
                      onSelectCard={handleSelectCard}
                      onClaimVictory={() => {
                        if (isOnline) {
                          handleOnlineClaimVictory();
                        } else {
                          handleOfflineVictory(
                            myPlayerObj,
                            offlinePlayers,
                            offlineCenterCard
                          );
                        }
                      }}
                      isMyTurn={isOnline ? isMyTurnOnline : isMyTurnOffline}
                      disabled={isProcessingMove}
                    />

                    {/* Quick Reactions Bar in Online Mode */}
                    {isOnline && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Smile className="w-3.5 h-3.5 text-amber-400" />
                          Send quick reaction:
                        </span>
                        <div className="flex items-center gap-2 text-base">
                          {['⭐', '🔥', '👀', '😎', '🏆', '😱'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleSendReaction(emoji)}
                              className="hover:scale-125 transition-transform cursor-pointer"
                              title={`Send ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Game Log Drawer */}
              <div className="lg:col-span-1">
                <GameLogs logs={logs} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Privacy Screen for Pass & Play Mode */}
      {screen === 'PASS_PLAY_PRIVACY' && offlinePlayers[activePlayerIndex] && (
        <PassPlayVeil
          nextPlayer={offlinePlayers[activePlayerIndex]}
          onReveal={() => {
            sound.playDeal();
            setScreen('OFFLINE_PLAYING');
            setActiveStatusMessage(
              `${offlinePlayers[activePlayerIndex].name}'s turn. Select a card to trade!`
            );
          }}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* Global Leaderboard Modal */}
      {leaderboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl relative">
            <button
              onClick={() => setLeaderboardModalOpen(false)}
              className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
              aria-label="Close leaderboard"
            >
              <X className="w-4 h-4" />
            </button>
            <GlobalLeaderboard onClose={() => setLeaderboardModalOpen(false)} />
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={isGameOverModalOpen}
        winner={winner}
        players={finalRevealPlayers}
        centerCard={finalRevealCenterCard}
        isOnline={isOnline}
        isHost={isOnline ? onlineRoom?.hostId === myPlayerId : true}
        onPlayAgain={() => {
          if (isOnline) {
            onlineSocket.playAgain();
            setIsGameOverModalOpen(false);
          } else {
            startOfflineGame(
              playerCount,
              isLocalMultiplayer,
              'TURN_BASED',
              offlinePlayers[0]?.name || 'Player 1'
            );
          }
        }}
        onNewGameSetup={() => {
          setIsGameOverModalOpen(false);
          if (isOnline) {
            setScreen('ONLINE_LOBBY');
          } else {
            setScreen('SETUP');
          }
        }}
        stats={{
          totalTrades: isOnline
            ? onlineRoom?.totalTrades || stats.totalTrades
            : stats.totalTrades,
          centerSwaps: isOnline
            ? onlineRoom?.centerSwaps || stats.centerSwaps
            : stats.centerSwaps,
          roundsPlayed: isOnline
            ? onlineRoom?.roundsPlayed || stats.roundsPlayed
            : stats.roundsPlayed,
        }}
      />
    </div>
  );
}
