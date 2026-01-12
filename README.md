# 🎮 Mines Giveaway — CS2 Twitch Overlay

A production-ready Twitch overlay web app for **shinneeshinn** featuring a CS2-themed "Mines Giveaway" game. Viewers join by typing `легенда` in chat, a host picks a winner, and the player reveals tiles to win prizes!

![CS2 Mines Giveaway](https://img.shields.io/badge/CS2-Mines%20Giveaway-gold?style=for-the-badge)

## 📋 Features

- **Two UIs:**
  - `/play` — Viewer overlay for OBS (1920x1080)
  - `/host` — Streamer control panel (password protected)

- **Twitch Integration:** Viewers join by typing `легенда` in chat
- **14-Tile Circular Game Board** with CS2 weapon skins
- **Deterministic Prize System:** 3-profile mixture model (low/normal/jackpot)
- **Real-time Sync:** Socket.IO for instant updates
- **Force Max Win:** Host-only feature with double-password confirmation and audit logging

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm

### Local Development

1. **Clone and install:**
   ```bash
   cd SHINSHIN
   npm install
   npm run build:client
   npm run build:server
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run development servers:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Player overlay: http://localhost:5173/play
   - Host panel: http://localhost:5173/host

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `production` | Environment mode |
| `ADMIN_PASSWORD` | `change_me` | Host panel password (CHANGE THIS!) |
| `ALLOW_FORCE_MAX_WIN` | `false` | Enable Force Max Win feature |
| `TWITCH_CHANNEL` | `shinneeshinn` | Twitch channel to monitor |
| `TWITCH_BOT_USERNAME` | — | Bot username (optional) |
| `TWITCH_OAUTH_TOKEN` | — | OAuth token for bot (optional) |
| `DEFAULT_TARGET_AVG` | `9000` | Default average win amount |
| `DEFAULT_MAX_WIN` | `20000` | Default maximum win amount |
| `DEFAULT_MAX_PICKS` | `10` | Maximum tile picks per round |
| `JOIN_KEYWORD` | `легенда` | Keyword to join giveaway |

### Getting Twitch Credentials

1. Go to https://twitchapps.com/tmi/
2. Login with your bot account
3. Copy the OAuth token (includes `oauth:` prefix)

## 🚂 Railway Deployment

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

### Manual Deployment

1. **Create new Railway project**

2. **Connect your GitHub repo** or use Railway CLI:
   ```bash
   railway login
   railway init
   railway link
   ```

3. **Set environment variables** in Railway dashboard:
   - `ADMIN_PASSWORD` — Strong password
   - `TWITCH_CHANNEL` — Your channel name
   - `ALLOW_FORCE_MAX_WIN` — `true` if needed
   - Other variables as needed

4. **Deploy:**
   ```bash
   railway up
   ```

### Railway Configuration

The app is configured for single-service deployment:
- Server serves both API + static client
- Listens on `0.0.0.0:$PORT`
- Build command: `npm run build`
- Start command: `npm run start`

## 🎬 OBS Setup

### Adding the Overlay

1. **Add Browser Source:**
   - Source name: `Mines Giveaway`
   - URL: `https://your-railway-app.railway.app/play`
   - Width: `1920`
   - Height: `1080`
   - ✅ Use custom frame rate: `60`

2. **Recommended settings:**
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

### Transparent Background

The `/play` overlay has a dark background by default. For transparency, add this custom CSS in OBS:

```css
body { background: transparent !important; }
.bg-cs-darker { background: transparent !important; }
```

## 🎮 How to Play

### For Streamers (Host Panel)

1. Open `/host` in your browser
2. Login with `ADMIN_PASSWORD`
3. Wait for viewers to join by typing `легенда`
4. Click **"Случайный победитель"** or pick manually
5. Click **"Начать раунд"**
6. Watch the player reveal tiles!
7. Click **"Сбросить игру"** for next giveaway

### For Viewers

1. Type `легенда` in Twitch chat to join
2. Wait for the host to pick a winner
3. If selected, click tiles to reveal prizes!

## 💰 Prize System

### Profiles (Selected at Round Start)

| Profile | Chance | Description |
|---------|--------|-------------|
| Low | 15% | Lower average, more STOP outcomes |
| Normal | 82% | Standard gameplay, cap 75% of maxWin |
| Jackpot | 3% | Higher multipliers, can reach maxWin |

### Outcomes

| Type | Description |
|------|-------------|
| **ADD** | Adds points to bank (+100, +500, etc.) |
| **MULT** | Multiplies bank (×1.5 or ×2) |
| **STOP** | Ends the round immediately |

### Force Max Win (Host Only)

⚠️ **Security Features:**
- Only available when `ALLOW_FORCE_MAX_WIN=true`
- Requires host authentication
- Requires **second password confirmation** in modal
- All actions logged to server audit log

**Two modes:**
- **Force Max Win (Next Round)** — Next round guaranteed to reach maxWin
- **Force Max Win (This Round Now)** — Modifies remaining sequence to reach maxWin

## 🔒 Security

- Host authentication via server-side session tokens
- Host-only socket events require valid session
- Force Max Win requires re-authentication
- All admin actions logged with timestamps
- No hidden endpoints or backdoors

### Audit Log

View audit log (host only):
```
GET /api/audit?password=YOUR_ADMIN_PASSWORD
```

## 🛠 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/skins` | Get skin data |
| `GET /api/force-enabled` | Check if force mode enabled |
| `GET /api/audit?password=...` | Get audit log (auth required) |

## 📁 Project Structure

```
SHINSHIN/
├── server/
│   ├── src/
│   │   ├── index.ts      # Express + Socket.IO server
│   │   ├── socket.ts     # Game state & socket handlers
│   │   ├── twitch.ts     # Twitch chat integration
│   │   ├── skins.ts      # CS2 skin fetching
│   │   ├── prize.ts      # Prize generation logic
│   │   └── auth.ts       # Authentication
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Play.tsx  # Viewer overlay
│   │   │   └── Host.tsx  # Streamer control panel
│   │   ├── features/
│   │   │   └── game/     # Game components & store
│   │   ├── lib/
│   │   │   └── socket.ts # Socket.IO client
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── package.json
└── README.md
```

## 🎨 Customization

### Skins

The app fetches CS2 skins from the [qwkdev/csapi](https://github.com/qwkdev/csapi) dataset. Edit `server/src/skins.ts` to change the preferred skins list.

### Styling

- TailwindCSS with custom CS2 theme colors
- Edit `client/tailwind.config.js` for custom colors
- Framer Motion for animations

### Economy

Adjust these in the host panel or via environment variables:
- `targetAvg` — Average win amount per round
- `maxWin` — Maximum possible win

## 🐛 Troubleshooting

### Twitch not connecting

1. Verify `TWITCH_CHANNEL` is correct
2. Check OAuth token is valid
3. The app works without bot credentials (read-only mode)

### Skins not loading

1. Check internet connection
2. Fallback placeholders will be shown
3. Check server logs for fetch errors

### Socket disconnecting

1. Check Railway deployment logs
2. Ensure `PORT` is set correctly
3. WebSocket transport should work on Railway

## 📄 License

MIT License — Use freely for your streams!

---

Made with ❤️ for **shinneeshinn** and the CS2 community 🎮
