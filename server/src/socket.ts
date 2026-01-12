import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  validatePassword,
  createSession,
  isSocketAuthorized,
  removeSessionBySocketId,
  isForceMaxWinAllowed,
} from './auth.js';
import {
  generateSequence,
  generateForcedMaxWinSequence,
  forceSequenceToMaxWin,
  calculateBank,
  type Outcome,
  type RoundProfile,
} from './prize.js';
import { getSkins, type Skin } from './skins.js';
import { getTwitchStatus } from './twitch.js';

// Force mode types
export type ForceMode = 'NONE' | 'NEXT_ROUND' | 'THIS_ROUND';

// Game status
export type GameStatus = 'IDLE' | 'READY' | 'PLAYING' | 'ENDED';

// Opened tile info
export interface OpenedTile {
  tileIndex: number;
  pickIndex: number;
  outcome: Outcome;
  bankAfter: number;
}

// Full game state
export interface GameState {
  roundId: string | null;
  winner: string | null;
  bank: number;
  maxWin: number;
  targetAvg: number;
  maxPicks: number;
  pickIndex: number;
  openedTiles: Record<number, OpenedTile>;
  sequence: Outcome[];
  status: GameStatus;
  forceMode: ForceMode;
  profile: RoundProfile | null;
  skins: Skin[];
  participants: string[];
}

// Audit log entry
export interface AuditEntry {
  ts: number;
  action: string;
  roundId?: string;
  sessionId?: string;
  note?: string;
}

// Audit log (kept in memory, latest 500 entries)
export const auditLog: AuditEntry[] = [];

export function audit(action: string, roundId?: string, sessionId?: string, note?: string): void {
  const entry: AuditEntry = { ts: Date.now(), action, roundId, sessionId, note };
  auditLog.push(entry);
  if (auditLog.length > 500) auditLog.shift();
  console.log(`[AUDIT] ${action}`, roundId || '', note || '');
}

// Global game state
let gameState: GameState = {
  roundId: null,
  winner: null,
  bank: 0,
  maxWin: parseInt(process.env.DEFAULT_MAX_WIN || '20000'),
  targetAvg: parseInt(process.env.DEFAULT_TARGET_AVG || '9000'),
  maxPicks: parseInt(process.env.DEFAULT_MAX_PICKS || '10'),
  pickIndex: 0,
  openedTiles: {},
  sequence: [],
  status: 'IDLE',
  forceMode: 'NONE',
  profile: null,
  skins: [],
  participants: [],
};

// Add participant (from Twitch chat)
export function addParticipant(username: string): void {
  // Dedupe participants
  if (!gameState.participants.includes(username)) {
    gameState.participants.push(username);
  }
}

// Get current game state (for broadcasting)
function getPublicState(): Omit<GameState, 'sequence'> {
  const { sequence, ...publicState } = gameState;
  return publicState;
}

// Setup socket handlers
export function setupSocketHandlers(io: Server): void {
  // Initialize skins in state
  gameState.skins = getSkins();
  
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Send current state to new client
    socket.emit('game:state', getPublicState());
    socket.emit('twitch:status', getTwitchStatus());
    
    // Client requests current state
    socket.on('game:getState', (cb) => {
      cb?.(getPublicState());
    });
    
    // ============ HOST AUTHENTICATION ============
    
    socket.on('host:login', (payload: { password: string }, cb) => {
      try {
        if (!validatePassword(payload.password)) {
          cb?.({ ok: false, error: 'Неверный пароль' });
          return;
        }
        
        const sessionId = createSession(socket.id);
        audit('HOST_LOGIN', undefined, sessionId);
        cb?.({ ok: true, sessionId });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message || 'Ошибка авторизации' });
      }
    });
    
    socket.on('host:logout', (cb) => {
      removeSessionBySocketId(socket.id);
      audit('HOST_LOGOUT');
      cb?.({ ok: true });
    });
    
    // ============ HOST-ONLY EVENTS ============
    
    // Middleware to check authorization
    const requireHost = (cb: Function | undefined, handler: () => void) => {
      if (!isSocketAuthorized(socket.id)) {
        cb?.({ ok: false, error: 'Требуется авторизация' });
        return;
      }
      handler();
    };
    
    // Update config
    socket.on('host:updateConfig', (payload: { targetAvg?: number; maxWin?: number }, cb) => {
      requireHost(cb, () => {
        if (payload.targetAvg !== undefined) {
          gameState.targetAvg = Math.max(1000, Math.min(100000, payload.targetAvg));
        }
        if (payload.maxWin !== undefined) {
          gameState.maxWin = Math.max(5000, Math.min(500000, payload.maxWin));
        }
        audit('CONFIG_UPDATE', undefined, undefined, JSON.stringify(payload));
        io.emit('game:state', getPublicState());
        cb?.({ ok: true });
      });
    });
    
    // Pick winner
    socket.on('host:pickWinner', (payload: { manual?: string }, cb) => {
      requireHost(cb, () => {
        if (gameState.participants.length === 0) {
          cb?.({ ok: false, error: 'Нет участников' });
          return;
        }
        
        let winner: string;
        if (payload.manual && gameState.participants.includes(payload.manual)) {
          winner = payload.manual;
        } else {
          // Random selection
          const idx = Math.floor(Math.random() * gameState.participants.length);
          winner = gameState.participants[idx];
        }
        
        gameState.winner = winner;
        gameState.status = 'READY';
        
        audit('WINNER_PICKED', undefined, undefined, winner);
        io.emit('game:state', getPublicState());
        cb?.({ ok: true, winner });
      });
    });
    
    // Start round
    socket.on('host:startRound', (cb) => {
      requireHost(cb, () => {
        if (!gameState.winner) {
          cb?.({ ok: false, error: 'Сначала выберите победителя' });
          return;
        }
        
        gameState.roundId = uuidv4();
        gameState.bank = 0;
        gameState.pickIndex = 0;
        gameState.openedTiles = {};
        
        // Generate sequence based on force mode
        if (gameState.forceMode === 'NEXT_ROUND') {
          gameState.sequence = generateForcedMaxWinSequence(gameState.maxWin, gameState.maxPicks);
          gameState.profile = 'jackpot';
          audit('ROUND_START_FORCED', gameState.roundId, undefined, 'Force mode: NEXT_ROUND');
          gameState.forceMode = 'NONE'; // Reset force mode
        } else {
          const result = generateSequence(gameState.targetAvg, gameState.maxWin, gameState.maxPicks);
          gameState.sequence = result.sequence;
          gameState.profile = result.profile;
          audit('ROUND_START', gameState.roundId, undefined, `Profile: ${result.profile}`);
        }
        
        gameState.status = 'PLAYING';
        gameState.skins = getSkins();
        
        io.emit('game:state', getPublicState());
        cb?.({ ok: true, roundId: gameState.roundId });
      });
    });
    
    // Reset game
    socket.on('host:reset', (cb) => {
      requireHost(cb, () => {
        gameState = {
          roundId: null,
          winner: null,
          bank: 0,
          maxWin: gameState.maxWin,
          targetAvg: gameState.targetAvg,
          maxPicks: gameState.maxPicks,
          pickIndex: 0,
          openedTiles: {},
          sequence: [],
          status: 'IDLE',
          forceMode: 'NONE',
          profile: null,
          skins: getSkins(),
          participants: [],
        };
        
        audit('GAME_RESET');
        io.emit('game:state', getPublicState());
        cb?.({ ok: true });
      });
    });
    
    // Clear participants
    socket.on('host:clearParticipants', (cb) => {
      requireHost(cb, () => {
        gameState.participants = [];
        io.emit('game:state', getPublicState());
        cb?.({ ok: true });
      });
    });
    
    // Add to bank (before next tile)
    socket.on('host:addBank', (payload: { amount: number }, cb) => {
      requireHost(cb, () => {
        if (gameState.status !== 'PLAYING') {
          cb?.({ ok: false, error: 'Раунд не активен' });
          return;
        }
        const amount = Math.max(0, Math.min(100000, payload.amount || 0));
        gameState.bank += amount;
        // Cap at maxWin
        if (gameState.bank > gameState.maxWin) {
          gameState.bank = gameState.maxWin;
        }
        audit('BANK_ADDED', gameState.roundId || undefined, undefined, `+${amount}, total: ${gameState.bank}`);
        io.emit('game:state', getPublicState());
        cb?.({ ok: true, bank: gameState.bank });
      });
    });
    
    // ============ FORCE MAX WIN ============
    
    socket.on('host:forceMaxWin', (payload: { mode: 'NEXT_ROUND' | 'THIS_ROUND'; password: string }, cb) => {
      requireHost(cb, () => {
        try {
          // Check if force mode is allowed
          if (!isForceMaxWinAllowed()) {
            cb?.({ ok: false, error: 'Force mode отключен на сервере' });
            return;
          }
          
          // Re-verify password for extra security
          if (!validatePassword(payload.password)) {
            cb?.({ ok: false, error: 'Неверный пароль' });
            return;
          }
          
          if (payload.mode === 'NEXT_ROUND') {
            gameState.forceMode = 'NEXT_ROUND';
            audit('FORCE_MAX_WIN_NEXT_ROUND', gameState.roundId || undefined);
            io.emit('game:state', getPublicState());
            cb?.({ ok: true, message: 'Следующий раунд будет с максимальным выигрышем' });
          } else if (payload.mode === 'THIS_ROUND') {
            if (gameState.status !== 'PLAYING') {
              cb?.({ ok: false, error: 'Раунд не активен' });
              return;
            }
            
            // Modify remaining sequence to guarantee max win
            gameState.sequence = forceSequenceToMaxWin(
              gameState.bank,
              gameState.pickIndex,
              gameState.maxWin,
              gameState.maxPicks,
              gameState.sequence
            );
            gameState.forceMode = 'THIS_ROUND';
            
            audit('FORCE_MAX_WIN_THIS_ROUND', gameState.roundId || undefined);
            io.emit('game:state', getPublicState());
            cb?.({ ok: true, message: 'Оставшиеся тайлы изменены для максимального выигрыша' });
          }
        } catch (e: any) {
          cb?.({ ok: false, error: e?.message || 'Ошибка' });
        }
      });
    });
    
    // Cancel force mode
    socket.on('host:cancelForce', (cb) => {
      requireHost(cb, () => {
        gameState.forceMode = 'NONE';
        audit('FORCE_CANCELLED');
        io.emit('game:state', getPublicState());
        cb?.({ ok: true });
      });
    });
    
    // ============ PLAYER ACTIONS ============
    
    // Click tile (player action)
    socket.on('player:clickTile', (payload: { tileIndex: number }, cb) => {
      try {
        if (gameState.status !== 'PLAYING') {
          cb?.({ ok: false, error: 'Раунд не активен' });
          return;
        }
        
        if (gameState.pickIndex >= gameState.maxPicks) {
          cb?.({ ok: false, error: 'Все попытки использованы' });
          return;
        }
        
        const { tileIndex } = payload;
        
        // Check if tile already opened
        if (gameState.openedTiles[tileIndex]) {
          cb?.({ ok: false, error: 'Тайл уже открыт' });
          return;
        }
        
        // Check valid tile index (0-13)
        if (tileIndex < 0 || tileIndex > 13) {
          cb?.({ ok: false, error: 'Неверный индекс тайла' });
          return;
        }
        
        // Get next outcome from sequence
        const outcome = gameState.sequence[gameState.pickIndex];
        
        // Apply outcome
        let bankAfter = gameState.bank;
        let roundEnded = false;
        
        if (outcome.t === 'STOP') {
          roundEnded = true;
        } else if (outcome.t === 'ADD') {
          bankAfter += outcome.amount || 0;
        } else if (outcome.t === 'MULT') {
          bankAfter = Math.floor(bankAfter * (outcome.value || 1));
          // Cap at maxWin
          if (bankAfter > gameState.maxWin) {
            bankAfter = gameState.maxWin;
          }
        }
        
        // Record opened tile
        gameState.openedTiles[tileIndex] = {
          tileIndex,
          pickIndex: gameState.pickIndex,
          outcome,
          bankAfter,
        };
        
        gameState.bank = bankAfter;
        gameState.pickIndex++;
        
        // Check if round should end
        if (roundEnded || gameState.pickIndex >= gameState.maxPicks) {
          gameState.status = 'ENDED';
          audit('ROUND_ENDED', gameState.roundId || undefined, undefined, `Final bank: ${gameState.bank}`);
        }
        
        io.emit('game:state', getPublicState());
        io.emit('tile:revealed', {
          tileIndex,
          outcome,
          bankAfter,
          roundEnded: gameState.status === 'ENDED',
        });
        
        cb?.({ ok: true, outcome, bankAfter, roundEnded: gameState.status === 'ENDED' });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message || 'Ошибка' });
      }
    });
    
    // ============ DISCONNECT ============
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Don't remove session on disconnect, allow reconnect
    });
  });
  
  // Periodically broadcast state (every 5 seconds) for sync
  setInterval(() => {
    io.emit('game:state', getPublicState());
    io.emit('twitch:status', getTwitchStatus());
  }, 5000);
}

// Export for external access (e.g., adding participants from Twitch)
export function getGameState(): GameState {
  return gameState;
}
