# Wardrobe App — Deployment Guide

## Stack
- **Frontend**: React + Vite → Vercel (free)
- **Backend**: Node.js + Express → Render (free)
- **Database**: PostgreSQL → Neon (free)
- **Images**: Cloudinary (free, 25GB)
- **Auth**: JWT

---

## Step 1 — Get your free accounts

Sign up (all free, no credit card):
1. [neon.tech](https://neon.tech) — PostgreSQL database
2. [cloudinary.com](https://cloudinary.com) — image storage
3. [render.com](https://render.com) — backend hosting
4. [vercel.com](https://vercel.com) — frontend hosting

---

## Step 2 — Set up Neon (database)

1. Create a new project in Neon dashboard
2. Copy the **Connection string** (looks like `postgresql://user:pass@host/dbname`)
3. Save it — you'll need it as `DATABASE_URL`

---

## Step 3 — Set up Cloudinary (images)

1. In your Cloudinary dashboard, find:
   - Cloud name
   - API Key
   - API Secret
2. Save all three

---

## Step 4 — Push code to GitHub

```bash
cd wardrobe-app
git init
git add .
git commit -m "initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/wardrobe-app.git
# If your local branch is named `main` (newer Git defaults)
git push -u origin main

# If your local branch is still named `master` (older repos), either push master:
git push -u origin master

# Or rename your local branch to `main` and push (recommended to match GitHub default):
git branch -m master main
git push -u origin main

<!-- Troubleshooting: "src refspec main does not match any" -->
### Troubleshooting

If you see the error "error: src refspec main does not match any" when running `git push -u origin main`, it means your local repository doesn't have a branch named `main` (or it has no commits yet). Quick checks and fixes:

1. Check your current branch and commit history:

   - Run `git status` to see the current branch name.
   - Run `git log --oneline` to verify you have at least one commit.

2. If you haven't committed anything yet, create an initial commit:

   git add .
   git commit -m "initial commit"

3. If your branch is `master`, push it directly or rename it to `main` as shown above.

4. If you prefer not to rename branches, you can set the remote's default branch on GitHub to `master` (or push `master` and open the repo settings on GitHub).

These commands and notes should work on PowerShell (Windows) or any other shell.
```

---

## Step 5 — Deploy backend to Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `FRONTEND_URL` | Set after deploying frontend (e.g. `https://wardrobe.vercel.app`) |
| `NODE_VERSION` | `
` |

7. Click **Deploy**
8. Wait ~2 min. Copy your Render URL (e.g. `https://wardrobe-backend.onrender.com`)

---

## Step 6 — Deploy frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel
```

When prompted:
- Link to existing project? **No**
- Project name: `wardrobe-app`
- Root directory: `.` (you're already in frontend/)
- Framework: **Vite**

Then add the environment variable:
```bash
vercel env add VITE_API_URL
# Enter your Render backend URL, e.g.: https://wardrobe-backend.onrender.com
```

Redeploy:
```bash
vercel --prod
```

---

## Step 7 — Update FRONTEND_URL on Render

1. Go back to Render → your backend service → Environment
2. Update `FRONTEND_URL` to your Vercel URL (e.g. `https://wardrobe-app.vercel.app`)
3. Render will auto-redeploy

---

## Step 8 — Test it

1. Open your Vercel URL
2. Sign up for an account
3. Add some clothes
4. Generate a schedule

---

## Local development

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev

# Terminal 2 — frontend
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

Open http://localhost:5173

---

## Notes

- Render free tier **spins down after 15 min of inactivity** — first request takes ~30s to wake up. This is normal.
- Neon free tier has 0.5GB storage — plenty for a personal wardrobe app.
- Cloudinary free tier is 25GB — more than enough for clothing photos.
- To generate a JWT secret: run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in terminal.
