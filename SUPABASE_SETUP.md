# Supabase Auth Integration Setup

## Overview
We've integrated Supabase Auth to handle user authentication, verification emails, and password management.

## What Changed

### Backend
1. **Added Supabase Java client** to handle auth operations
2. **Created `SupabaseAuthService`** for:
   - Student self-registration (with email verification)
   - Login authentication
   - Staff/Admin user creation by admins
3. **Kept existing `User` table** for profile data (roles, points, office assignments)
4. **Removed manual email sending** - Supabase handles verification emails

### Authentication Flow

#### Student Registration
1. User fills registration form → Frontend calls `/api/auth/register`
2. Backend creates Supabase auth user
3. **Supabase automatically sends verification email**
4. Backend creates profile in `users` table
5. User clicks verification link in email
6. User can now login

#### Staff/Admin Creation (by Admin)
1. Admin fills form in admin panel → Frontend calls `/api/admin/users`
2. Backend creates Supabase auth user with auto-confirmed email
3. Backend creates profile with `STAFF` or `ADMIN` role
4. Staff member receives credentials and can login immediately

#### Login
1. User enters email/password → Frontend calls `/api/auth/login`
2. Backend validates with Supabase Auth
3. Backend checks email verification status
4. Backend generates JWT token
5. Returns user profile + token

## Required Environment Variables in Render

Add these to Render Dashboard → Environment:

```
SUPABASE_URL=https://xnmwuyrmhwydunpnxzom.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### How to Get Keys

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `xnmwuyrmhwydunpnxzom`
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Keep secret!)

## Enable Email Authentication in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Email Templates**
   - Customize "Confirm signup" template
   - Set redirect URL to your frontend: `https://kl-smartq.vercel.app`

## Database Setup (Already Done)

Your existing `users` table works as-is. Supabase Auth manages passwords separately.

The `id` field in `users` table will match Supabase auth user IDs.

## Benefits

✅ **No More Email Sending Issues** - Supabase handles all verification emails
✅ **Secure Password Management** - Passwords hashed and managed by Supabase
✅ **Built-in Email Verification** - Automatic with customizable templates
✅ **Password Reset** - Can add password reset flow easily
✅ **Session Management** - Supabase handles token refresh
✅ **Same Admin Flow** - Staff creation still works through admin panel

## Migration Notes

- Existing users in database won't have Supabase auth accounts
- New registrations will use Supabase Auth
- Consider adding password reset endpoint later
- Can add social login (Google, GitHub) easily in future

## Testing

1. **Test Student Registration:**
   - Go to https://kl-smartq.vercel.app
   - Register with new email
   - Check email for verification link
   - Click link to verify
   - Login with credentials

2. **Test Staff Creation:**
   - Login as admin
   - Go to User Management
   - Create staff user
   - Staff user can login immediately

3. **Check Supabase Dashboard:**
   - Go to Authentication → Users
   - See all registered users
   - Monitor verification status
