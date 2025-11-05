# Supabase OTP Configuration Guide

## ✅ What Changed

Your system now uses **OTP (One-Time Password)** verification instead of email links:

1. User registers → Supabase sends 6-digit code to email
2. User enters code → Backend calls Supabase verify API
3. User can login after verification

## 🔧 Configure Supabase for OTP Mode

### Step 1: Enable Email Provider with OTP
1. Go to: https://supabase.com/dashboard
2. Select project: **xnmwuyrmhwydunpnxzom**
3. Go to **Authentication** → **Providers**
4. Click on **Email** provider
5. **IMPORTANT**: Enable these settings:
   - ✅ **Enable Email Provider** = ON
   - ✅ **Enable Email OTP** = ON
   - ✅ **Confirm email** = ON
6. Click **Save**

### Step 2: Configure Email Templates
1. In Supabase Dashboard → **Authentication** → **Email Templates**
2. Click **Magic Link** or **Confirm signup** template
3. The template should include `{{ .Token }}` variable for the OTP code
4. Default template already includes this, but verify it shows the 6-digit code

### Step 3: Add Environment Variables to Render (if not done yet)
```
SUPABASE_URL=https://xnmwuyrmhwydunpnxzom.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubXd1eXJtaHd5ZHVucG54em9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzEwNTgsImV4cCI6MjA3Nzc0NzA1OH0.pQY9luQKX2Xcb18SNpOezuawwjPgCNOwpjr6KzcN3JM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubXd1eXJtaHd5ZHVucG54em9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE3MTA1OCwiZXhwIjoyMDc3NzQ3MDU4fQ.oRxmutt6EQ0QMBU3Nt6RolkdIZozn8LFPxlCW0xSH6Q
```

## 📱 User Flow

### Registration Flow:
1. **Frontend calls**: `POST /api/auth/send-verification-code`
   - Body: `{ name, email, password }`
   - Response: Success message
   - **Supabase sends OTP email automatically**

2. **User receives email** with 6-digit code (e.g., `123456`)

3. **Frontend calls**: `POST /api/auth/verify-code`
   - Body: `{ email, code: "123456" }`
   - Response: Success message

4. **User can now login**: `POST /api/auth/login`
   - Body: `{ email, password }`
   - Response: JWT token + user data

## 🔄 Backward Compatibility

The old endpoints still work:
- `/send-verification-code` → maps to `/register`
- `/verify-code` → maps to `/verify-otp`
- `/complete-registration` → returns success

Your frontend doesn't need changes if it's already using these endpoints!

## 🐛 Fixed Issues

1. ✅ **Null pointer error** - Now properly handles Supabase response
2. ✅ **OTP system** - Uses 6-digit codes instead of email links
3. ✅ **Email verification** - Supabase sends OTP automatically
4. ✅ **Database sync** - Creates user profile after registration

## 🧪 Testing

After deployment:
1. Go to https://kl-smartq.vercel.app
2. Register with your email
3. Check email for 6-digit OTP code
4. Enter code in verification screen
5. Login with email/password

The OTP code expires after 1 hour (Supabase default).
