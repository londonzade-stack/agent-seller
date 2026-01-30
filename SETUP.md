# AgentSeller Setup Guide

## Environment Variables

### 1. Google OAuth Setup (Gmail Integration)

You need to create a Google Cloud project and OAuth credentials:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create a new project** (or select existing one)

3. **Enable the Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (or "Internal" if using Google Workspace)
   - Fill in the required fields:
     - App name: "AgentSeller"
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/userinfo.email`
   - Add test users (while in testing mode)

5. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "AgentSeller Web"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-production-domain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/gmail/callback` (development)
     - `https://your-production-domain.com/api/auth/gmail/callback` (production)
   - Click "Create"

6. **Copy your credentials**:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### 2. Supabase Setup

1. **Create a Supabase project**: https://supabase.com/

2. **Get your API keys**:
   - Go to Project Settings > API
   - Copy the "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Run the database migration**:
   - Go to SQL Editor in Supabase
   - Copy and run the contents of `supabase/migrations/001_user_email_connections.sql`

### 3. Full Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App URL (change for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing the Gmail Integration

1. Start the dev server: `npm run dev`
2. Log in to your app
3. Go to Dashboard > Email settings
4. Click "Connect Gmail"
5. Authorize with a test Google account
6. You should be redirected back to the dashboard with Gmail connected

## Production Deployment

When deploying to Vercel:

1. Add all environment variables in Vercel project settings
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Add the production callback URL to Google Cloud Console
4. If your app is still in "Testing" mode on Google, either:
   - Submit for verification, or
   - Add all users as test users

## Troubleshooting

### "Access Denied" during OAuth
- Make sure your Google account is added as a test user in the OAuth consent screen

### "Invalid redirect URI"
- Check that the callback URL matches exactly in Google Cloud Console

### "Token refresh failed"
- The refresh token may have expired. Disconnect and reconnect Gmail.

### Gmail API quota exceeded
- Check your API quotas in Google Cloud Console
