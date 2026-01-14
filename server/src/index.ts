import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { initSkins, getSkins } from './skins.js';
import { initTwitch } from './twitch.js';
import { setupSocketHandlers, addParticipant, auditLog } from './socket.js';

const PORT = parseInt(process.env.PORT || '3000');
const NODE_ENV = process.env.NODE_ENV || 'development';

async function main() {
  console.log(`Starting server in ${NODE_ENV} mode...`);
  
  // Initialize Express
  const app = express();
  const httpServer = createServer(app);
  
  // CORS configuration
  const corsOptions = {
    origin: NODE_ENV === 'production' 
      ? true // Allow all origins in production (single service)
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());
  
  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
  });
  
  // Initialize skins cache
  console.log('Initializing skins cache...');
  await initSkins();
  console.log(`Loaded ${getSkins().length} skins`);
  
  // Setup socket handlers
  setupSocketHandlers(io);
  
  // Initialize Twitch connection
  console.log('Connecting to Twitch...');
  const twitchConnected = await initTwitch(
    // Callback when participant joins via chat
    (username) => {
      addParticipant(username);
      // Emit both the individual event and updated state for immediate UI update
      io.emit('participant:joined', { username });
    },
    // Callback for all chat messages
    (username, message) => {
      io.emit('chat:message', { username, message, ts: Date.now() });
    }
  );
  
  if (twitchConnected) {
    console.log(`Connected to Twitch channel: ${process.env.TWITCH_CHANNEL}`);
  } else {
    console.warn('Failed to connect to Twitch. Participants can still be added manually.');
  }
  
  // ============ API ROUTES ============
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
  
  // Get skins
  app.get('/api/skins', (req, res) => {
    res.json(getSkins());
  });
  
  // Get audit log (host only - requires password in query)
  app.get('/api/audit', (req, res) => {
    const password = req.query.password as string;
    if (password !== process.env.ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json(auditLog);
  });
  
  // Check if force max win is enabled
  app.get('/api/force-enabled', (req, res) => {
    res.json({ enabled: process.env.ALLOW_FORCE_MAX_WIN === 'true' });

  });
  
  // ============ STATIC FILES ============
  
  // Serve static client files in production
  if (NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientPath));
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientPath, 'index.html'));
    });
  }
  
  // ============ START SERVER ============
  
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Force Max Win: ${process.env.ALLOW_FORCE_MAX_WIN === 'true' ? 'ENABLED' : 'DISABLED'}`);
  });
}

main().catch(console.error);
