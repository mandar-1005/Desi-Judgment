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

## Deployment (Free Tier)

See [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) for detailed step-by-step instructions or [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for a quick guide.

### Quick Deploy (Free Tier)

1. **Backend (Render Free)**: Deploy the `server` folder to [render.com](https://render.com)
2. **Frontend (Vercel Free)**: Deploy the `client` folder to [vercel.com](https://vercel.com) with `NEXT_PUBLIC_SERVER_URL` environment variable

Both platforms offer free tiers perfect for testing with friends! 🎉
