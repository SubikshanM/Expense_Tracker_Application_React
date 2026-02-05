# Vanilla HTML/CSS/JS Expense Tracker

## Files Created:
- `index.html` - Landing page (redirects to login or dashboard)
- `login.html` - Login page
- `signup.html` - Signup page  
- `dashboard.html` - Main dashboard with all features
- `styles.css` - All styling (identical to React version)
- `auth.js` - Authentication functions
- `dashboard.js` - Dashboard functionality

## Features:
✅ Login & Signup authentication
✅ Dashboard with expense tracking
✅ 10 categories with icons (Food, Transportation, Entertainment, etc.)
✅ 4 interactive charts (Line, Bar, Doughnut, Pie) using Chart.js
✅ Add, Edit, Delete expenses
✅ Category filtering
✅ Profile dropdown menu
✅ Change password functionality
✅ Dark mode toggle
✅ Responsive design
✅ Same styling as React version

## How to Deploy to Render (Static Site):

### Option 1: Deploy Vanilla Folder Only
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +" → "Static Site"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: expense-tracker-vanilla
   - **Branch**: main
   - **Root Directory**: `vanilla`
   - **Build Command**: (leave empty or use `echo "No build needed"`)
   - **Publish Directory**: `.` (current directory)
5. Click **"Create Static Site"**
6. Wait for deployment
7. Access your site at: `https://expense-tracker-vanilla.onrender.com`

### Option 2: Upload Files Directly
1. Copy all files from `vanilla/` folder to a new folder
2. Upload to any static hosting (Netlify, Vercel, GitHub Pages, etc.)
3. No build process needed!

## Benefits Over React Version:
- ✅ No build process
- ✅ No environment variables needed at build time
- ✅ No routing issues (each page is a real file)
- ✅ Works on ANY static host
- ✅ Faster load times
- ✅ Easier to debug
- ✅ Same look and functionality

## Testing Locally:
1. Open `vanilla/` folder
2. Use a local server:
   ```bash
   cd vanilla
   python3 -m http.server 8000
   # OR
   npx serve
   ```
3. Open `http://localhost:8000` in browser

## API Configuration:
The app connects to the existing backend:
`https://expense-tracker-application-react.onrender.com/api`

If you need to change the API URL, edit:
- `vanilla/auth.js` - line 2
- `vanilla/dashboard.js` - line 8

## No Routing Issues!
Unlike the React version, this uses real HTML files:
- `/` → index.html (redirects)
- `/login.html` → Login page
- `/signup.html` → Signup page
- `/dashboard.html` → Dashboard

Each URL works directly without rewrite rules!
