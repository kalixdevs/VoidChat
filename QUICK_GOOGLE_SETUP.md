# Quick Google OAuth Setup - Step by Step

## The Error You're Seeing
"The OAuth client was not found" means Google can't find your OAuth credentials. This happens when:
- The Client ID in your `.env` file doesn't match what's in Google Cloud Console
- The credentials are still placeholders
- The OAuth client wasn't created properly

## Step-by-Step Fix

### 1. Open Google Cloud Console
Go to: https://console.cloud.google.com/

### 2. Create/Select Project
- Click the project dropdown at the top
- Click "New Project" or select existing
- Name it "Chat App" (or anything)
- Click "Create"

### 3. Enable APIs
- Go to **APIs & Services** > **Library** (left sidebar)
- Search for "Google+ API" 
- Click on it and press **Enable**

### 4. Configure OAuth Consent Screen
- Go to **APIs & Services** > **OAuth consent screen** (left sidebar)
- Choose **External** → Click **Create**
- Fill in:
  - **App name**: Chat App
  - **User support email**: Your email
  - **Developer contact information**: Your email
- Click **Save and Continue**
- On "Scopes" page, click **Save and Continue**
- On "Test users" page:
  - Click **Add Users**
  - Add your email: `timlmgg@gmail.com`
  - Click **Add**
- Click **Save and Continue**
- Click **Back to Dashboard**

### 5. Create OAuth Credentials
- Go to **APIs & Services** > **Credentials** (left sidebar)
- Click **+ CREATE CREDENTIALS** at the top
- Select **OAuth client ID**
- If asked, choose **Web application**
- Fill in:
  - **Name**: Chat App
  - **Authorized JavaScript origins**: 
    ```
    http://localhost:3000
    ```
  - **Authorized redirect URIs**: 
    ```
    http://localhost:5000/api/auth/google/callback
    ```
- Click **Create**
- **IMPORTANT**: A popup will show your credentials
  - Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
  - Copy the **Client Secret** (looks like: `GOCSPX-abc123xyz`)
- Click **OK**

### 6. Update Your .env File

Open `backend/.env` and replace these lines:

```env
GOOGLE_CLIENT_ID=paste_the_client_id_here
GOOGLE_CLIENT_SECRET=paste_the_client_secret_here
```

**Example:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### 7. Restart Backend Server

**Important**: You MUST restart the server after updating `.env`

1. Stop the server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```

3. Look for this message:
   - ✅ `✅ Google OAuth configured` = Good!
   - ⚠️ `⚠️ Google OAuth not configured` = Credentials not loaded

### 8. Test Again

1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. You should be redirected to Google's login page
4. After logging in, you'll be redirected back to the app

## Common Mistakes

❌ **Wrong redirect URI**: Must be exactly `http://localhost:5000/api/auth/google/callback`
❌ **Forgot to restart server**: `.env` changes only load on restart
❌ **Copy-paste errors**: Make sure no extra spaces in `.env` file
❌ **Not added as test user**: Must add your email in OAuth consent screen
❌ **Wrong Client ID**: Make sure you copied the Client ID, not the Client Secret

## Still Not Working?

1. **Check backend console** - Look for the `✅ Google OAuth configured` message
2. **Verify .env format** - No quotes, no spaces around `=`
3. **Check Google Console** - Make sure redirect URI matches exactly
4. **Clear browser cache** - Sometimes helps with OAuth redirects


