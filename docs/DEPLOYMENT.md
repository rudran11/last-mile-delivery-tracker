# Deployment Guide

This document outlines the exact manual steps required to deploy the Last Mile Delivery Tracker to production.

## Production Architecture
```text
GitHub
   |
   +--> Vercel
   |     React/Vite Frontend
   |
   +--> Render
         Node/Express Backend
              |
              +--> PostgreSQL + PostGIS (Supabase/Neon)
```

## 1. Database Setup (Supabase / Neon)
The platform **strictly requires PostGIS** for dispatch distance calculations.
1. Create a new PostgreSQL database on Supabase or Neon.
2. Ensure the PostGIS extension is enabled. (In Supabase: SQL Editor -> `create extension postgis;`)
3. Copy the production Connection String (URI).

## 2. Backend Deployment (Render)
1. Connect your GitHub repository to Render and create a new **Web Service**.
2. **Settings**:
   - Build Command: `npm install && npx prisma db push && npx tsc -b`
   - Start Command: `npm start` (ensure `package.json` has `"start": "node dist/server.js"`)
   - Root Directory: `backend`
3. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your Supabase connection string.
   - `JWT_SECRET`: A strong, random 32+ character string.
   - `FRONTEND_URL`: Your intended Vercel domain (e.g. `https://your-frontend.vercel.app`).
   - *Note: Leave `USE_MOCK_EMAIL` empty or false; the codebase restricts it in production.*

> [!WARNING]
> **Migration Strategy**: We recommend using `npx prisma db push` for initial setup. Once deployed, any future schema changes should use structured `npx prisma migrate deploy`. **NEVER** use `prisma migrate reset` or `prisma db push --accept-data-loss` in production.

## 3. Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel and import the project.
2. **Settings**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables**:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://your-backend.onrender.com/api/v1`)

## 4. Security & Hardening
- **CORS**: The backend restricts traffic explicitly to `FRONTEND_URL`. If you see CORS errors in the browser console, double-check the URL in Render exactly matches your Vercel URL (with `https://` and no trailing slash).
- **Helmet**: Adds security headers (HSTS, Content Security Policy) automatically.
- **Rate Limiting**: Limits Auth endpoints to 20 attempts per 15 minutes.
- **Graceful Shutdown**: The production configuration hides internal stack traces.

## 5. Post-Deployment Smoke Test
Verify the following after deployment:
- **Public**: The landing page loads successfully on Vercel.
- **Auth**: Creating a new customer account or logging in works.
- **Dispatch**: Use an Admin account to trigger a dispatch. Verify that PostGIS calculates distance correctly without throwing SQL extension errors.
- **HTTPS**: Confirm both Vercel and Render are operating securely over `https://`.
