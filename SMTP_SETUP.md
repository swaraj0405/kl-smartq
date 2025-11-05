# SMTP Email Setup for Production (Render)

## Problem
Render's free tier **blocks outbound SMTP on port 587** (anti-spam measure), so Gmail SMTP won't work even with correct credentials.

## Solution: Use SendGrid Free SMTP Relay

### Step 1: Create SendGrid Account (Free)
1. Go to: https://signup.sendgrid.com/
2. Sign up (free tier includes 100 emails/day forever)
3. Verify your email address

### Step 2: Generate API Key
1. Login to SendGrid
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: `kl-smartq-production`
5. Permissions: **Restricted Access** → Check **Mail Send** → **Full Access**
6. Click **Create & View**
7. **Copy the API key** (starts with `SG.`) — you won't see it again!

### Step 3: Update Render Environment Variables
1. Go to Render Dashboard → Your `kl-smartq` service
2. Click **Environment** tab
3. Update these variables:

```
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.your_actual_sendgrid_api_key_here
```

4. **Important:** Also add if not already present:
```
CORS_ORIGINS=https://kl-smartq.vercel.app,https://kl-smartq-ijmv7wzze-swaraj04-05s-projects.vercel.app
```

5. Click **Save Changes**
6. Wait for Render to redeploy (1-2 minutes)

### Step 4: Test
1. Go to your frontend: https://kl-smartq.vercel.app
2. Try to register or request verification code
3. Check email (also check spam folder first time)
4. Check Render logs for success messages

---

## Local Development (Keep Using Gmail)

Your local setup will continue using Gmail SMTP because the environment variables will fall back to the defaults in `application.yml`:

```yaml
host: ${MAIL_HOST:smtp.gmail.com}
username: ${MAIL_USERNAME:paramjitbaral44@gmail.com}
password: ${MAIL_PASSWORD:bsxo htpy odbz zuhu}
```

So:
- **Production (Render)**: Uses SendGrid (set via environment variables)
- **Local (your machine)**: Uses Gmail (uses defaults in application.yml)

---

## Troubleshooting

### SendGrid emails go to spam
1. Go to SendGrid → Settings → Sender Authentication
2. Set up **Domain Authentication** (recommended) or **Single Sender Verification**
3. This improves deliverability

### Still getting connection errors
1. Check Render logs for exact error
2. Verify API key is correct (no extra spaces)
3. Make sure `MAIL_USERNAME=apikey` (literal word "apikey", not your email)

### Want to use a different provider?
Other options that work on Render:
- **Mailgun**: smtp.mailgun.org:587
- **Postmark**: smtp.postmarkapp.com:587
- **AWS SES**: email-smtp.us-east-1.amazonaws.com:587

Just update the 4 MAIL_* environment variables in Render.
