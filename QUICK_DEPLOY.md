# Quick Deployment Guide

Your app is now on GitHub: https://github.com/mandar-1005/Desi-Judgment

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Render (Free Tier - 5 minutes)

1. **Sign up/Login to Render**
   - Go to [render.com](https://render.com)
   - Click "Get Started for Free"
   - Sign up with GitHub (easiest)

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Select "Build and deploy from a Git repository"
   - Connect GitHub and select repository: `mandar-1005/Desi-Judgment`

3. **Configure Backend Service**
   - **Name**: `desi-judgement-server`
   - **Region**: Choose closest (e.g., Oregon)
   - **Branch**: `main`
   - **Root Directory**: `server` ⚠️ **IMPORTANT!**
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

4. **Environment Variables**
   - Click "Advanced"
   - Add: `NODE_ENV` = `production`
   - Add: `ALLOWED_ORIGINS` = (leave empty for now, update after frontend deploy)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (3-5 minutes)
   - You'll get a URL like: `https://desi-judgement-server.onrender.com`
   - **Copy this URL** for the frontend!

**Note**: Free tier spins down after 15 min inactivity - first request may take 30-60 seconds to wake up

### Step 2: Deploy Frontend to Vercel (5 minutes)

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign up" → "Continue with GitHub"
   - Authorize Vercel to access your GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import `mandar-1005/Desi-Judgment`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `client` (click "Edit" and set this)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Set Environment Variable**
   - Scroll down to "Environment Variables"
   - Add new variable:
     - **Key**: `NEXT_PUBLIC_SERVER_URL`
     - **Value**: Your Railway backend URL (from Step 1.5)
     - **Environment**: Production, Preview, Development (check all)
   - Click "Add"

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Vercel will give you a URL like: `https://desi-judgment.vercel.app`

### Step 3: Update Backend CORS (2 minutes)

1. **Go back to Render**
   - Open your backend service
   - Go to "Environment" tab
   - Update: `ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app` (your actual Vercel URL)
   - Click "Save Changes"
   - Render will automatically redeploy (2-3 minutes)

### Step 4: Test! 🎮

1. Visit your Vercel URL
2. Create a room
3. Share the room code with your friends
4. Test multiplayer functionality

## 🔧 Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify `npm run build` works locally
- Ensure `server/src/index.ts` exists

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_SERVER_URL` is set correctly in Vercel
- Check browser console for CORS errors
- Ensure backend CORS includes your Vercel domain

### Socket connection fails
- Verify backend URL is accessible (try opening it in browser)
- Check Railway logs for Socket.io errors
- Ensure WebSocket is enabled on Railway (should be automatic)

## 📝 URLs Summary

After deployment, you'll have:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.onrender.com`

Share the frontend URL with your friends to test!

## 🆓 Free Tier Notes

- **Render**: Free forever, but spins down after 15 min inactivity (wakes up automatically)
- **Vercel**: Free forever, no spin-down issues
- Perfect for testing with friends!

**For detailed Render deployment instructions, see [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)**

