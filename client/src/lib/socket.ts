import { io, Socket } from 'socket.io-client';

// Socket.IO client instance
declare const __PROD__: boolean;
const SOCKET_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? '' 
  : 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

// Connection status
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

export default socket;
