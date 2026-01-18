# Quick Deployment Guide

Your app is now on GitHub: https://github.com/mandar-1005/Desi-Judgment

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Railway (5 minutes)

1. **Sign up/Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with your GitHub account (easiest)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select repository: `mandar-1005/Desi-Judgment`

3. **Configure Backend Service**
   - Railway will detect the repo
   - Click "Add Service" → "GitHub Repo"
   - Select your repo
   - In settings, set **Root Directory** to: `server`
   - Railway will auto-detect Node.js

4. **Deploy**
   - Railway will automatically:
     - Run `npm install`
     - Run `npm run build`
     - Run `npm start`
   - Wait for deployment to complete (2-3 minutes)

5. **Get Your Backend URL**
   - Click on your service
   - Go to "Settings" → "Domains"
   - Railway will generate a URL like: `https://your-app-name.up.railway.app`
   - **Copy this URL** - you'll need it for the frontend!

6. **Set Environment Variables (Optional)**
   - Go to "Variables" tab
   - Add: `ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app` (we'll update this after frontend deploy)

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

1. **Go back to Railway**
   - Open your backend service
   - Go to "Variables" tab
   - Add/Update: `ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app` (your actual Vercel URL)
   - Railway will automatically redeploy

2. **Alternative: Update in Code** (if environment variable doesn't work)
   - The code already supports `ALLOWED_ORIGINS` env var
   - If needed, we can update `server/src/index.ts` directly

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
- **Backend**: `https://your-app.railway.app`

Share the frontend URL with your friends to test!

