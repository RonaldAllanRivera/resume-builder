# Google OAuth2 Setup Guide

This guide explains how to set up Google OAuth2 for local Docker testing. This approach uses your personal Google account and Drive quota, avoiding service account limitations.

## Why OAuth2 Instead of Service Account?

- **Service accounts have 0 storage quota** - can't create files
- **OAuth2 uses your personal Drive quota** - works immediately
- **No domain-wide delegation needed** - simpler setup
- **Perfect for local Docker testing** - same as Laravel system

## Setup Steps

### 1. Create OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Configure:
   - **Name**: Resume Builder OAuth
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/google/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### 2. Update Environment Variables

Edit `.env` and add your credentials:

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

### 3. Authorize the Application

1. Start your Docker containers: `docker compose up`
2. Visit: http://localhost:3000/api/google/authorize
3. Sign in with your Google account
4. Grant permissions for Drive and Docs access
5. You'll be redirected back to `/admin?google_auth_success=true`

### 4. Verify Authentication

Check if you're authenticated:
```bash
curl http://localhost:3000/api/google/status
```

You should see:
```json
{
  "authenticated": true,
  "tokenExpired": false,
  "message": "Authenticated and ready"
}
```

### 5. Test Google Docs Export

1. Go to any generation in your admin panel
2. Click **Export to Google Docs**
3. Files will be created in your Drive folder using **your quota** ✅

## How It Works

```
┌─────────────┐
│ Your App    │
│ (Docker)    │
└──────┬──────┘
       │
       │ 1. Redirect to /api/google/authorize
       ▼
┌─────────────┐
│ Google      │
│ OAuth2      │
└──────┬──────┘
       │
       │ 2. User grants access
       ▼
┌─────────────┐
│ Callback    │
│ /api/google │
│ /callback   │
└──────┬──────┘
       │
       │ 3. Exchange code for tokens
       │ 4. Save tokens to .google-token.json
       ▼
┌─────────────┐
│ Tokens      │
│ Stored      │
└─────────────┘
```

## Token Storage

- Tokens are saved to `.google-token.json` in the project root
- This file is in `.gitignore` - never commit it!
- Tokens auto-refresh when expired
- To re-authorize: delete `.google-token.json` and visit `/api/google/authorize` again

## API Endpoints

The OAuth2 implementation provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/google/authorize` | GET | Redirect to Google consent screen |
| `/api/google/callback` | GET | Handle OAuth callback (automatic) |
| `/api/google/status` | GET | Check authentication status |
| `/api/google/logout` | POST | Clear stored tokens |

### Example: Check Status

```bash
curl http://localhost:3000/api/google/status
```

Response when authenticated:
```json
{
  "authenticated": true,
  "tokenExpired": false,
  "scopes": "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents",
  "message": "Authenticated and ready"
}
```

### Example: Logout

```bash
curl -X POST http://localhost:3000/api/google/logout
```

Response:
```json
{
  "success": true,
  "message": "Google authentication tokens cleared"
}
```

## Troubleshooting

### "User not authenticated with Google"

**Solution**: Visit http://localhost:3000/api/google/authorize to grant access

### "Redirect URI mismatch"

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
```
http://localhost:3000/api/google/callback
```

### "Invalid client"

**Solution**: Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

### Token expired

**Solution**: Tokens auto-refresh. If issues persist, delete `.google-token.json` and re-authorize.

## Production Deployment

For production, you have two options:

### Option 1: OAuth2 (Simpler)
- Use the same OAuth2 approach
- Update redirect URI to your production domain
- Store tokens securely (database or encrypted storage)

### Option 2: Service Account with Domain-Wide Delegation
- Requires Google Workspace admin access
- More complex setup but better for multi-user apps
- See [Domain-Wide Delegation Guide](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)

## Security Notes

- ✅ `.google-token.json` is in `.gitignore`
- ✅ Never commit OAuth2 credentials to Git
- ✅ Tokens are stored locally (not in database for local dev)
- ✅ Use environment variables for credentials
- ⚠️ For production, store tokens in encrypted database or secret manager

## Comparison: Service Account vs OAuth2

| Feature | Service Account | OAuth2 User |
|---------|----------------|-------------|
| Storage Quota | 0 GB ❌ | Your Drive quota ✅ |
| Setup Complexity | Complex (domain delegation) | Simple ✅ |
| Local Docker | Doesn't work ❌ | Works perfectly ✅ |
| Multi-user | Better for production | Good for single user |
| File Ownership | Service account | Your account ✅ |

**For local Docker testing: OAuth2 is the clear winner! 🎉**
