# Deployment Guide

This guide explains how to deploy Desi Judgement to production.

## Architecture

- **Frontend**: Next.js app deployed on Vercel
- **Backend**: Express + Socket.io server deployed on Railway/Render/Fly.io

## Deployment Steps

### 1. Deploy Backend Server

The backend needs to be deployed to a service that supports Node.js and WebSockets (Socket.io).

**Recommended platforms:**
- Railway (easiest)
- Render
- Fly.io

**Steps for Railway:**
1. Create a Railway account
2. Create a new project
3. Connect your GitHub repository
4. Select the `server` folder as the root
5. Railway will auto-detect Node.js and deploy
6. Copy the deployed URL (e.g., `https://your-app.railway.app`)

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

