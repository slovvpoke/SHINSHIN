import { create } from 'zustand';
import socket from '@/lib/socket';

// Types matching server
export type ForceMode = 'NONE' | 'NEXT_ROUND' | 'THIS_ROUND';
export type GameStatus = 'IDLE' | 'READY' | 'PLAYING' | 'ENDED';
export type OutcomeType = 'ADD' | 'MULT' | 'STOP';

export interface Outcome {
  t: OutcomeType;
  amount?: number;
  value?: number;
}

export interface Skin {
  id: string;
  name: string;
  weapon: string;
  image: string;
  rarity?: string;
}

export interface OpenedTile {
  tileIndex: number;
  pickIndex: number;
  outcome: Outcome;
  bankAfter: number;
}

export interface GameState {
  roundId: string | null;
  winner: string | null;
  winnerSelectedAt?: number; // Timestamp when winner was selected
  bank: number;
  maxWin: number;
  targetAvg: number;
  maxPicks: number;
  pickIndex: number;
  openedTiles: Record<number, OpenedTile>;
  status: GameStatus;
  forceMode: ForceMode;
  profile: 'low' | 'normal' | 'jackpot' | null;
  skins: Skin[];
  participants: string[];
}

export interface TwitchStatus {
  connected: boolean;
  channel: string;
}

export interface ChatMessage {
  username: string;
  message: string;
  ts: number;
}

interface GameStore {
  // State
  connected: boolean;
  gameState: GameState | null;
  twitchStatus: TwitchStatus | null;
  sessionId: string | null;
  isHost: boolean;
  forceEnabled: boolean;
  
  // Revealed tile animation state
  lastRevealedTile: number | null;
  lastOutcome: Outcome | null;
  
  // Chat messages
  chatMessages: ChatMessage[];
  
  // Actions
  setConnected: (connected: boolean) => void;
  setGameState: (state: GameState) => void;
  setTwitchStatus: (status: TwitchStatus) => void;
  setSessionId: (id: string | null) => void;
  setForceEnabled: (enabled: boolean) => void;
  setLastRevealedTile: (tileIndex: number | null) => void;
  setLastOutcome: (outcome: Outcome | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  
  // Socket actions
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateConfig: (config: { targetAvg?: number; maxWin?: number }) => Promise<void>;
  pickWinner: (manual?: string) => Promise<{ ok: boolean; winner?: string; error?: string }>;
  startRound: () => Promise<{ ok: boolean; error?: string }>;
  resetGame: () => Promise<void>;
  playerResetGame: () => Promise<{ ok: boolean; error?: string }>;
  clearParticipants: () => Promise<void>;
  clickTile: (tileIndex: number) => Promise<{ ok: boolean; outcome?: Outcome; error?: string }>;
  forceMaxWin: (mode: 'NEXT_ROUND' | 'THIS_ROUND', password: string) => Promise<{ ok: boolean; error?: string }>;
  cancelForce: () => Promise<void>;
  addBank: (amount: number) => Promise<{ ok: boolean; bank?: number; error?: string }>;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  connected: false,
  gameState: null,
  twitchStatus: null,
  sessionId: null,
  isHost: false,
  forceEnabled: false,
  lastRevealedTile: null,
  lastOutcome: null,
  chatMessages: [],
  
  // Setters
  setConnected: (connected) => set({ connected }),
  setGameState: (gameState) => set({ gameState }),
  setTwitchStatus: (twitchStatus) => set({ twitchStatus }),
  setSessionId: (sessionId) => set({ sessionId, isHost: !!sessionId }),
  setForceEnabled: (forceEnabled) => set({ forceEnabled }),
  setLastRevealedTile: (lastRevealedTile) => set({ lastRevealedTile }),
  setLastOutcome: (lastOutcome) => set({ lastOutcome }),
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-200), msg] // Keep last 200 messages
  })),
  
  // Socket actions
  login: async (password) => {
    return new Promise((resolve) => {
      socket.emit('host:login', { password }, (res: any) => {
        if (res.ok) {
          set({ sessionId: res.sessionId, isHost: true });
        }
        resolve(res);
      });
    });
  },
  
  logout: () => {
    socket.emit('host:logout');
    set({ sessionId: null, isHost: false });
  },
  
  updateConfig: async (config) => {
    return new Promise((resolve) => {
      socket.emit('host:updateConfig', config, () => resolve());
    });
  },
  
  pickWinner: async (manual) => {
    return new Promise((resolve) => {
      if (manual) {
        socket.emit('host:pickWinner', { manual }, (res: any) => {
          resolve(res);
        });
      } else {
        socket.emit('player:pickWinner', (res: any) => {
          resolve(res);
        });
      }
    });
  },
  
  startRound: async () => {
    return new Promise((resolve) => {
      socket.emit('player:startRound', (res: any) => {
        resolve(res);
      });
    });
  },
  
  resetGame: async () => {
    return new Promise((resolve) => {
      socket.emit('host:reset', () => resolve());
    });
  },
  
  playerResetGame: async () => {
    return new Promise((resolve) => {
      socket.emit('player:resetGame', (res: any) => {
        resolve(res);
      });
    });
  },
  
  clearParticipants: async () => {
    return new Promise((resolve) => {
      socket.emit('host:clearParticipants', () => resolve());
    });
  },
  
  clickTile: async (tileIndex) => {
    return new Promise((resolve) => {
      socket.emit('player:clickTile', { tileIndex }, (res: any) => {
        if (res.ok && res.outcome) {
          set({ lastRevealedTile: tileIndex, lastOutcome: res.outcome });
          // Clear revealed tile after animation, but keep outcome visible longer
          setTimeout(() => set({ lastRevealedTile: null }), 1000);
          setTimeout(() => set({ lastOutcome: null }), 3000);
        }
        resolve(res);
      });
    });
  },
  
  forceMaxWin: async (mode, password) => {
    return new Promise((resolve) => {
      socket.emit('host:forceMaxWin', { mode, password }, (res: any) => {
        resolve(res);
      });
    });
  },
  
  cancelForce: async () => {
    return new Promise((resolve) => {
      socket.emit('host:cancelForce', () => resolve());
    });
  },
  
  addBank: async (amount) => {
    return new Promise((resolve) => {
      socket.emit('host:addBank', { amount }, (res: any) => {
        resolve(res);
      });
    });
  },
}));

// Setup socket listeners
let listenersInitialized = false;

export function initSocketListeners() {
  // Prevent duplicate listeners
  if (listenersInitialized) return;
  listenersInitialized = true;
  
  const { setConnected, setGameState, setTwitchStatus, setForceEnabled, addChatMessage } = useGameStore.getState();
  
  socket.on('connect', () => {
    setConnected(true);
    socket.emit('game:getState', (state: GameState) => {
      if (state) setGameState(state);
    });
    fetch('/api/force-enabled')
      .then(res => res.json())
      .then(data => setForceEnabled(data.enabled))
      .catch(() => setForceEnabled(false));
  });
  
  socket.on('disconnect', () => {
    setConnected(false);
  });
  
  socket.on('game:state', (state: GameState) => {
    setGameState(state);
  });
  
  socket.on('twitch:status', (status: TwitchStatus) => {
    setTwitchStatus(status);
  });
  
  socket.on('tile:revealed', (data: { tileIndex: number }) => {
    useGameStore.getState().setLastRevealedTile(data.tileIndex);
    setTimeout(() => useGameStore.getState().setLastRevealedTile(null), 1000);
  });
  
  socket.on('chat:message', (data: { username: string; message: string; ts: number }) => {
    addChatMessage(data);
  });
  
  // Handle participant joined - update participants list immediately
  socket.on('participant:joined', (data: { username: string }) => {
    const state = useGameStore.getState().gameState;
    if (state && !state.participants.includes(data.username)) {
      setGameState({
        ...state,
        participants: [...state.participants, data.username],
      });
    }
  });
}
