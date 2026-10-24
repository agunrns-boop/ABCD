import { Card, RoomState, OnlineGameOverData } from '../types/game';

type MessageHandler = (data: any) => void;

class OnlineSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnected: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pendingQueue: any[] = [];

  constructor() {
    this.connect();
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Flush pending queue
        while (this.pendingQueue.length > 0) {
          const item = this.pendingQueue.shift();
          this.send(item);
        }
        this.emit({ type: '_CONNECTION_STATUS', connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data);
        } catch (e) {
          console.error('Failed to parse socket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit({ type: '_CONNECTION_STATUS', connected: false });
        // Attempt reconnect after 2 seconds
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
          }, 2000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
      };
    } catch (err) {
      console.warn('Failed to establish WebSocket:', err);
    }
  }

  public subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  private emit(data: any) {
    this.messageHandlers.forEach((handler) => handler(data));
  }

  public send(payload: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.pendingQueue.push(payload);
      this.connect();
    }
  }

  public createRoom(hostName: string, maxPlayers: number) {
    this.send({
      type: 'CREATE_ROOM',
      hostName,
      maxPlayers,
    });
  }

  public quickMatch(playerName: string, preferredPlayerCount = 3) {
    this.send({
      type: 'QUICK_MATCH',
      playerName,
      preferredPlayerCount,
    });
  }

  public cancelMatchmaking() {
    this.send({
      type: 'CANCEL_MATCHMAKING',
    });
  }

  public joinRoom(roomCode: string, playerName: string, playerId?: string) {
    this.send({
      type: 'JOIN_ROOM',
      roomCode,
      playerName,
      playerId,
    });
  }

  public addBot() {
    this.send({ type: 'ADD_BOT' });
  }

  public removePlayer(playerId: string) {
    this.send({ type: 'REMOVE_PLAYER', playerId });
  }

  public startGame() {
    this.send({ type: 'START_GAME' });
  }

  public tradeWithPlayer(offeredCardId: string, targetPlayerId: string) {
    this.send({
      type: 'TRADE_WITH_PLAYER',
      offeredCardId,
      targetPlayerId,
    });
  }

  public swapCenter(offeredCardId: string) {
    this.send({
      type: 'SWAP_CENTER',
      offeredCardId,
    });
  }

  public declareWin() {
    this.send({ type: 'DECLARE_WIN' });
  }

  public playAgain() {
    this.send({ type: 'PLAY_AGAIN' });
  }

  public sendReaction(emoji: string) {
    this.send({ type: 'SEND_REACTION', emoji });
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const onlineSocket = new OnlineSocketManager();
