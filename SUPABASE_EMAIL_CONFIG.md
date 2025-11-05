# Supabase Email Link to OTP Configuration

## 🔑 Critical: The email is showing a LINK instead of OTP code

To get OTP codes instead of confirmation links, you need to configure Supabase settings:

### Step 1: Disable Email Confirmations (Enable OTP)

1. Go to: https://supabase.com/dashboard
2. Select project: **xnmwuyrmhwydunpnxzom**
3. Go to **Authentication** → **Settings** (NOT Providers!)
4. Scroll to **Email Auth** section
5. Find **Enable email confirmations** toggle
6. **TURN IT OFF** ❌
7. Click **Save**

### Step 2: Verify Email Template

1. Go to **Authentication** → **Email Templates**
2. Click **Confirm signup** template
3. Make sure the template uses `{{ .Token }}` for the OTP code
4. Template should show the 6-digit code, not a link

### Alternative: Use Supabase Built-in OTP API

If you want to keep confirmations ON but use OTP, you need to:

1. Keep **Enable email confirmations** = ON
2. The user clicks the link in the email
3. The link redirects to your frontend with a token
4. Your frontend sends the token to your backend for verification

## 🎯 Recommended: Use Email Link (Simpler)

Actually, the email link method is MORE secure and easier:

1. User registers
2. User clicks link in email
3. Link redirects to your frontend: `https://kl-smartq.vercel.app?token=xxx`
4. Frontend extracts token and calls your backend to complete registration
5. Done!

This is the standard Supabase flow and requires less configuration.

## 📝 Current Code Changes

The code has been updated to:
- ✅ Handle Supabase signup response when user data is pending
- ✅ Create user profile after OTP/link verification
- ✅ Store user metadata (name) in Supabase
- ✅ Sync email verification status with database

The system will work with BOTH:
- Email confirmation links (default Supabase behavior)
- OTP codes (if you disable email confirmations)
