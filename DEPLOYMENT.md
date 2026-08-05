# 🚀 LMS MVP Quick Deployment Guide (Render + Vercel)

This guide covers deploying the LMS application for client testing using **Render** (for the Backend API) and **Vercel** (for the React Frontend).

---

## 🛠️ What Has Been Done For You (Pre-configured Codebase)

1. **CORS Enabled**: Installed and configured `cors` in `backend/src/app.ts` so the Vercel frontend can make cross-origin API calls to Render without browser security blocks.
2. **Prisma & Database Ready**: Pushed database schema to cloud PostgreSQL database (`c7q5h4r3.eu-central.database.insforge.app`).
3. **Build Verification**: Verified both `backend` (TypeScript) and `frontend/react` (Vite) build locally with 0 errors.

---

## 📋 What You Need To Do (3 Simple Steps)

### Step 1: Push Code to GitHub / GitLab

Make sure your repository has the latest code pushed:
```bash
git add .
git commit -m "Configure CORS, Prisma config and preparation for Render + Vercel deployment"
git push origin main
```

---

### Step 2: Deploy Backend to Render (5 minutes)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the following fields:
   - **Name**: `lms-backend` (or any name you choose)
   - **Region**: Select closest region (e.g., Frankfurt / EU Central or Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   | Key | Value |
   | :--- | :--- |
   | `DATABASE_URL` | `postgresql://postgres:82ce05c2c7c6a262e17848c40764a108@c7q5h4r3.eu-central.database.insforge.app:5432/insforge?sslmode=require` |
   | `PORT` | `5200` |
   | `JWT_SECRET` | `prod-secret-key-replace-with-your-own` |
   | `JWT_EXPIRY` | `86400` |

5. Click **Create Web Service**.
6. Wait 2-3 minutes for the build to finish. Copy your backend URL once live:
   👉 `https://lms-backend.onrender.com` (Example URL)

> **Quick Check**: Open `https://lms-backend.onrender.com/health` in your browser. It should respond with `{"status":"ok"}`.

---

### Step 3: Deploy Frontend to Vercel (3 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import your Git repository.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend/react`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://lms-backend.onrender.com` *(Replace with your actual Render URL from Step 2)* |

5. Click **Deploy**.
6. Vercel will build and launch your site (e.g. `https://lms-mvp.vercel.app`).

---

## 🎉 Testing the Deployed Application

1. Open your Vercel URL in your browser.
2. Log in using a test account (Admin / Teacher / Parent / Student).
3. Verify attendance, grades, and schedule loading.

---

## 🔍 Troubleshooting & Helpful Tips
- **Free Tier Sleep**: Render's free tier Web Services spin down after 15 minutes of inactivity. The first request after a sleep period might take 30–50 seconds to respond as it wakes up.
- **Updating Backend URL**: If you re-deploy the backend to a custom domain later, simply update `VITE_API_URL` in Vercel settings and trigger a redeploy on Vercel.
