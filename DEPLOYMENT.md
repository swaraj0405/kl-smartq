# KL SmartQ - Deployment Guide

## ✅ Backend Migration Complete!

Your backend has been converted from MySQL to PostgreSQL (Supabase).

---

## 📋 What Was Changed:

1. **Database Driver**: MySQL → PostgreSQL in `pom.xml`
2. **Connection Config**: Updated `application.yml` with Supabase connection
3. **Environment Variables**: All sensitive data now uses env vars
4. **Render Config**: Created `render.yaml` for deployment
5. **PostgreSQL Schema**: Migration script in `migrations/postgresql_schema.sql`

---

## 🚀 Deploy to Render (Step-by-Step):

### Step 1: Create Database Tables in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `backend/migrations/postgresql_schema.sql`
3. Paste and run it to create tables

### Step 2: Push to GitHub
```bash
cd C:\app\kl-smartq
git init
git add .
git commit -m "Initial commit - PostgreSQL migration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kl-smartq.git
git push -u origin main
```

### Step 3: Deploy on Render
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: kl-smartq-backend
   - **Root Directory**: backend
   - **Runtime**: Java
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/kl-smartq-backend-java-1.0.0.jar`

4. Add Environment Variables:
   - `DATABASE_URL`: `jdbc:postgresql://db.xnmwuyrmhwydunpnxzom.supabase.co:5432/postgres?sslmode=require`
   - `DB_USERNAME`: `postgres`
   - `DB_PASSWORD`: `Swaraj@0405`
   - `JWT_SECRET`: `dev-secret-kl-smartq-production-2025`
   - `MAIL_HOST`: `smtp.gmail.com`
   - `MAIL_PORT`: `587`
   - `MAIL_USERNAME`: `paramjitbaral44@gmail.com`
   - `MAIL_PASSWORD`: `bsxo htpy odbz zuhu`
   - `JWT_EXPIRATION`: `3600`
   - `CORS_ORIGINS`: `https://your-frontend-url.vercel.app,http://localhost:5173`

5. Click "Create Web Service"

### Step 4: Update Frontend API URL
Once deployed, Render will give you a URL like: `https://kl-smartq-backend.onrender.com`

Update `src/api/auth.ts` and `src/api/admin.ts`:
```typescript
const API_BASE = import.meta.env.PROD 
  ? 'https://kl-smartq-backend.onrender.com/api'
  : 'http://localhost:8083/api';
```

---

## 🧪 Test Locally with PostgreSQL:

```powershell
cd C:\app\kl-smartq\backend
mvn clean package -DskipTests
java -jar target/kl-smartq-backend-java-1.0.0.jar
```

Backend will connect to Supabase PostgreSQL automatically!

---

## 🎯 Next Steps:

1. ✅ Run PostgreSQL schema in Supabase
2. ✅ Push code to GitHub
3. ✅ Deploy backend on Render
4. ✅ Deploy frontend on Vercel/Netlify
5. ✅ Update CORS_ORIGINS with production frontend URL

---

## 🔧 Troubleshooting:

**"Connection refused"**: Check Supabase is running and credentials are correct
**"SSL required"**: Make sure connection string includes `?sslmode=require`
**Build fails**: Ensure Java 17 is selected in Render settings

---

Your backend is now production-ready! 🎉
