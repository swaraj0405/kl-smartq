# 🔧 Fix Supabase OTP Verification

## Problem
You modified the email template to show `{{ .Token }}` (OTP code) but Supabase is still configured for email confirmation LINKS, not OTP codes.

## Solution: Configure Supabase for OTP Mode

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: `xnmwuyrmhwydunpnxzom`
3. Click **Authentication** in the left sidebar
4. Click **Providers** tab

### Step 2: Check Email Provider Settings
Look for these settings and configure them:

**Option A: Use Email OTP (Recommended for your use case)**
1. In Authentication → Email Templates
2. Find the template you modified with `{{ .Token }}`
3. This is correct for OTP mode

**Option B: Verify Auth Settings**
1. Go to Authentication → Settings
2. Scroll to "Email Auth"
3. Check these settings:
   - ✅ **Enable email provider** - should be ON
   - 🔴 **Enable email confirmations** - Try setting this to **OFF**
   - Set **Mailer OTP Expiration** to something like 3600 (1 hour)

### Step 3: Critical - Check Email Template Type
The issue might be that you're using the WRONG email template!

In Supabase Authentication → Email Templates, there are DIFFERENT templates:
- **Confirm signup** - Used for LINK-based confirmation ({{ .ConfirmationURL }})
- **Magic Link** - Used for passwordless login links
- **Email OTP** - Used for OTP codes ({{ .Token }})

**You need to use the "Email OTP" template, NOT "Confirm signup"!**

## What to Do:

### Method 1: Disable Email Confirmations (Easiest)
1. Go to Authentication → Settings
2. Find "Enable email confirmations"
3. Turn it **OFF**
4. This makes users immediately active without needing verification
5. You can verify them later with a separate OTP flow

### Method 2: Use Email OTP Template (Better for Security)
1. Go to Authentication → Email Templates
2. Click on **"Email OTP"** template (NOT "Confirm signup")
3. Edit the template to show:
```html
<h2>Your Verification Code</h2>
<p>Enter this code to verify your email:</p>
<h1 style="font-size: 32px; font-weight: bold;">{{ .Token }}</h1>
<p>This code expires in 1 hour.</p>
```
4. Save the template

### Method 3: Use Signup with Auto-Confirm + Separate OTP
1. Go to Authentication → Settings
2. **Disable** "Enable email confirmations"
3. Users are created immediately without email verification
4. Then call Supabase's OTP generation separately:

**Backend Code Change:**
```java
// After user signs up (they're already confirmed)
// Send OTP separately using Supabase's OTP API
POST /auth/v1/otp
{
  "email": "user@example.com",
  "create_user": false
}
```

## Test After Changes:
1. Register a new user
2. Check email - should receive OTP code (6 digits)
3. Enter OTP code in your app
4. Should verify successfully!

## Current Status:
- ❌ Email template shows {{ .Token }} (correct)
- ❌ But Supabase is configured for link-based confirmation (wrong)
- ❌ Backend expects type="email" for OTP (correct)
- ❌ Mismatch between template and auth settings (THIS IS THE PROBLEM!)

## Recommended Fix:
**DISABLE "Enable email confirmations" in Supabase Settings**
- This makes users immediately active
- No email verification needed during signup
- You can add a separate OTP verification step if needed later
