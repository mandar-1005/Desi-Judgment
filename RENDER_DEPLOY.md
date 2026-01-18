# Deploy to Render (Free Tier) 🚀

Complete guide to deploy Desi Judgement to Render's free tier.

## Prerequisites

- GitHub account with your code pushed to `mandar-1005/Desi-Judgment`
- Render account (free tier)

## Step 1: Deploy Backend to Render (Free Tier)

### 1.1 Sign up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your GitHub

### 1.2 Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Select **"Build and deploy from a Git repository"**
3. Connect your GitHub account (if not already connected)
4. Select repository: `mandar-1005/Desi-Judgment`
5. Click **"Connect"**

### 1.3 Configure Backend Service

Fill in the settings:

- **Name**: `desi-judgement-server` (or any name you like)
- **Region**: Choose closest to you (e.g., `Oregon`)
- **Branch**: `main`
- **Root Directory**: `server` ⚠️ **IMPORTANT!**
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: **Free** (select from dropdown)

### 1.4 Environment Variables

Click **"Advanced"** and add environment variables:

- `NODE_ENV` = `production`
- `ALLOWED_ORIGINS` = Leave empty for now (we'll update after frontend deploy)

**Note**: `PORT` is automatically set by Render - don't add it manually!

### 1.5 Deploy

1. Click **"Create Web Service"**
2. Render will start building (takes 3-5 minutes)
3. Wait for deployment to complete
4. Once deployed, you'll get a URL like: `https://desi-judgement-server.onrender.com`
5. **Copy this URL** - you'll need it for the frontend!

### 1.6 Important Notes for Free Tier

- Free services **spin down after 15 minutes of inactivity**
- First request after spin-down may take 30-60 seconds (cold start)
- Services wake up automatically when accessed
- This is fine for testing with friends!

## Step 2: Deploy Frontend to Vercel (Free)

### 2.1 Sign up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub

### 2.2 Import Project

1. Click **"Add New"** → **"Project"**
2. Import `mandar-1005/Desi-Judgment`
3. Click **"Import"**

### 2.3 Configure Frontend

1. **Framework Preset**: `Next.js` (auto-detected)
2. **Root Directory**: `client` ⚠️ **Click "Edit" and change this!**
3. **Build Command**: `npm run build` (auto-filled)
4. **Output Directory**: `.next` (auto-filled)
5. **Install Command**: `npm install` (auto-filled)

### 2.4 Environment Variables

Scroll to **"Environment Variables"** and add:

- **Key**: `NEXT_PUBLIC_SERVER_URL`
- **Value**: Your Render backend URL (from Step 1.5)
  - Example: `https://desi-judgement-server.onrender.com`
- **Environments**: Check all (Production, Preview, Development)

Click **"Add"**

### 2.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Vercel will give you a URL like: `https://desi-judgement.vercel.app`
4. **Copy this URL**!

## Step 3: Update Backend CORS

### 3.1 Update Render Environment Variables

1. Go back to your Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Edit the `ALLOWED_ORIGINS` variable:
   - **Value**: Your Vercel URL (from Step 2.5)
   - Example: `https://desi-judgement.vercel.app`
5. Click **"Save Changes"**
6. Render will automatically redeploy (takes 2-3 minutes)

## Step 4: Test! 🎮

1. Visit your Vercel frontend URL
2. Create a room or join one
3. Share the room code with your friends
4. Test multiplayer functionality

## Troubleshooting

### Backend won't start on Render

- Check **"Logs"** tab in Render dashboard
- Verify `Root Directory` is set to `server`
- Verify build command: `npm install && npm run build`
- Verify start command: `npm start`

### Frontend can't connect to backend

- Verify `NEXT_PUBLIC_SERVER_URL` is set correctly in Vercel
- Check browser console for errors
- Verify backend CORS includes your Vercel domain
- Note: Free tier backend may take 30-60 seconds to wake up

### Socket.io connection fails

- Make sure backend URL doesn't have a trailing slash
- Check Render logs for Socket.io errors
- Verify WebSocket is supported (it is on Render free tier)

### "Service is sleeping" error

- This is normal for Render free tier after 15 minutes of inactivity
- Just wait 30-60 seconds and try again - it will wake up automatically

## Free Tier Limitations

### Render (Backend)
- ✅ Free forever
- ⚠️ Spins down after 15 min inactivity (wakes up automatically)
- ⚠️ Cold starts take 30-60 seconds
- ✅ Perfect for testing with friends!

### Vercel (Frontend)
- ✅ Free forever
- ✅ No sleep/spin-down issues
- ✅ Instant loading
- ✅ Perfect for production!

## Your URLs

After deployment:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.onrender.com`

Share the frontend URL with your friends! 🎉

