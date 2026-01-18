# GitHub Setup Instructions

Follow these steps to push your code to GitHub:

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `desi-judgement` (or any name you prefer)
4. Description: "A multiplayer Indian card game (Judgement / Oh Hell)"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these:

```bash
cd "/Users/mandarmenjoge/Desktop/Judgement A Card Game"

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/desi-judgement.git

# Push your code
git branch -M main
git push -u origin main
```

**Or if you prefer SSH:**
```bash
git remote add origin git@github.com:YOUR_USERNAME/desi-judgement.git
git branch -M main
git push -u origin main
```

## Step 3: Verify

1. Go to your GitHub repository page
2. You should see all your files there

## Next Steps

After pushing to GitHub, follow the deployment guide in [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy your app!

