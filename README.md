# Desi Judgement - The Game

A multiplayer Indian card game (Judgement / Oh Hell) built with Next.js and Socket.io.

## Features
- **Real-time Multiplayer**: Powered by Socket.io.
- **Desi Flavor**: "Hukum", "Boli", "Gang" terminology.
- **Rules Enforced**: Server-authoritative logic for turn order, suit following, and scoring.
- **Core Gameplay**: Bidding, Trump logic, Ladder rounds.

## How to Run Locally

### 1. Start the Server
```bash
cd server
npm install
npm run dev
```

### 2. Start the Client
```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000 to play.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Backend (Railway/Render)**: Deploy the `server` folder
2. **Frontend (Vercel)**: Deploy the `client` folder with `NEXT_PUBLIC_SERVER_URL` environment variable
