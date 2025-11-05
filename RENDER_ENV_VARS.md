# Render Environment Variables Setup

## 🔑 Add These to Render Dashboard

Go to: https://dashboard.render.com → Your Service (kl-smartq) → Environment

### Required Variables for Supabase Auth

```bash
# Supabase Configuration
SUPABASE_URL=https://xnmwuyrmhwydunpnxzom.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubXd1eXJtaHd5ZHVucG54em9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzEwNTgsImV4cCI6MjA3Nzc0NzA1OH0.pQY9luQKX2Xcb18SNpOezuawwjPgCNOwpjr6KzcN3JM
SUPABASE_SERVICE_ROLE_KEY=<GET THIS FROM SUPABASE DASHBOARD - Settings → API → service_role key>
```

### Existing Variables (Keep These)

```bash
# Database
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USERNAME=postgres.xnmwuyrmhwydunpnxzom
DB_PASSWORD=<your-db-password>

# JWT
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRATION=3600

# CORS
CORS_ORIGINS=https://kl-smartq.vercel.app,https://kl-smartq-ijmv7wzze-swaraj04-05s-projects.vercel.app
```

## 📍 How to Get Service Role Key

1. Go to https://supabase.com/dashboard
2. Select project: xnmwuyrmhwydunpnxzom
3. Go to **Settings** (gear icon in sidebar)
4. Click **API**
5. Find **service_role** key (NOT the anon key)
6. Click "Reveal" and copy it
7. ⚠️ **IMPORTANT:** This is a SECRET key - never expose it in frontend code!

## ✅ After Adding Variables

1. Click **Save Changes** in Render
2. Render will automatically redeploy with new environment variables
3. Wait 3-5 minutes for deployment to complete

## 🎯 What Each Key Does

- **SUPABASE_URL**: Your Supabase project endpoint
- **SUPABASE_ANON_KEY**: Public key for student registration/login (safe to expose)
- **SUPABASE_SERVICE_ROLE_KEY**: Admin key for creating staff users (KEEP SECRET!)

## 🔒 Security Note

The anon key is safe to use in frontend code because Supabase uses Row Level Security (RLS) to protect data. The service role key bypasses RLS, so it must ONLY be used in your backend server code, never in frontend.
