# Deployment Guide

This guide explains how to deploy Desi Judgement to production.

## Architecture

- **Frontend**: Next.js app deployed on Vercel (Free tier)
- **Backend**: Express + Socket.io server deployed on Render (Free tier)

**Note**: Both platforms offer free tiers perfect for testing with friends!

## Deployment Steps

### 1. Deploy Backend Server

The backend needs to be deployed to a service that supports Node.js and WebSockets (Socket.io).

**Recommended platform: Render (Free Tier)**

**Steps for Render:**
1. Create a Render account (free tier available)
2. Create a new Web Service
3. Connect your GitHub repository (`mandar-1005/Desi-Judgment`)
4. Set Root Directory to `server`
5. Set Build Command: `npm install && npm run build`
6. Set Start Command: `npm start`
7. Select Free plan
8. Deploy and copy the URL (e.g., `https://your-app.onrender.com`)

**Note**: Free tier spins down after 15 min inactivity but wakes up automatically

**Environment Variables:**
- `PORT`: Automatically set by Railway (usually 3001 or 443)

### 2. Deploy Frontend (Vercel)

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure project:
   - **Root Directory**: `client`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add Environment Variable:
   - `NEXT_PUBLIC_SERVER_URL`: Your backend URL (e.g., `https://your-app.railway.app`)
5. Deploy

### 3. Update Backend CORS

After deploying, update `server/src/index.ts` to allow your Vercel domain:
```typescript
cors: {
    origin: ["https://your-app.vercel.app"],
    methods: ["GET", "POST"]
}
```

## Testing

1. Visit your Vercel URL
2. Create/join a room
3. Test multiplayer functionality

## Troubleshooting

- **CORS errors**: Make sure backend CORS includes your frontend domain
- **Socket connection fails**: Verify `NEXT_PUBLIC_SERVER_URL` is set correctly
- **Backend won't start**: Check Railway/Render logs for errors

