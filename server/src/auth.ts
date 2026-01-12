import { v4 as uuidv4 } from 'uuid';

// Session storage for authenticated hosts
interface HostSession {
  sessionId: string;
  socketId: string;
  createdAt: number;
  lastActivity: number;
}

const sessions = new Map<string, HostSession>();
const socketToSession = new Map<string, string>();

// Session timeout: 24 hours
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// Validate admin password
export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword === 'change_me') {
    console.warn('WARNING: ADMIN_PASSWORD not set or using default!');
  }
  return password === adminPassword;
}

// Create a new host session
export function createSession(socketId: string): string {
  // Remove any existing session for this socket
  removeSessionBySocketId(socketId);
  
  const sessionId = uuidv4();
  const session: HostSession = {
    sessionId,
    socketId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  
  sessions.set(sessionId, session);
  socketToSession.set(socketId, sessionId);
  
  return sessionId;
}

// Validate session token
export function validateSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  // Check if session expired
  if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    sessions.delete(sessionId);
    socketToSession.delete(session.socketId);
    return false;
  }
  
  // Update last activity
  session.lastActivity = Date.now();
  return true;
}

// Check if socket is authorized
export function isSocketAuthorized(socketId: string): boolean {
  const sessionId = socketToSession.get(socketId);
  if (!sessionId) return false;
  return validateSession(sessionId);
}

// Get session by socket ID
export function getSessionBySocketId(socketId: string): HostSession | null {
  const sessionId = socketToSession.get(socketId);
  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

// Remove session by socket ID
export function removeSessionBySocketId(socketId: string): void {
  const sessionId = socketToSession.get(socketId);
  if (sessionId) {
    sessions.delete(sessionId);
    socketToSession.delete(socketId);
  }
}

// Update socket ID for session (on reconnect)
export function updateSessionSocketId(sessionId: string, newSocketId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  // Remove old socket mapping
  socketToSession.delete(session.socketId);
  
  // Update session
  session.socketId = newSocketId;
  session.lastActivity = Date.now();
  
  // Add new socket mapping
  socketToSession.set(newSocketId, sessionId);
  
  return true;
}

// Check if force max win is allowed
export function isForceMaxWinAllowed(): boolean {
  return process.env.ALLOW_FORCE_MAX_WIN === 'true';
}

// Cleanup expired sessions
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(sessionId);
      socketToSession.delete(session.socketId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
