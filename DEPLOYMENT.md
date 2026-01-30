# Expense Tracker Backend - Deployment Guide

## Deploy to Render

### 1. Push code to GitHub
```bash
cd server
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy on Render
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: expense-tracker-api
   - **Root Directory**: server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 3. Add Environment Variables
In Render dashboard, add these environment variables:
- `DATABASE_URL`: Your Neon connection string
- `JWT_SECRET`: A random secure string
- `CLIENT_URL`: Your frontend URL (for CORS)
- `NODE_ENV`: production

### 4. Deploy
- Click "Create Web Service"
- Wait for deployment (2-3 minutes)
- Copy your Render URL (e.g., https://expense-tracker-api.onrender.com)

### 5. Update Frontend
Update your frontend `.env`:
```
VITE_API_URL=https://expense-tracker-api.onrender.com/api
```

## Done!
Your backend will now be accessible from anywhere!
