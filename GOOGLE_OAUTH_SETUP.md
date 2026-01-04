# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the chat application.

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required information (App name, User support email, Developer contact)
   - Add your email to test users
6. For the OAuth client:
   - Application type: **Web application**
   - Name: Chat App (or your preferred name)
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 2: Update Database Schema

Run the migration script to add Google OAuth support:

```bash
mysql -u your_username -p chatapp < database/schema_update_google.sql
```

Or manually run the SQL commands in `database/schema_update_google.sql` through your MySQL admin tool.

## Step 3: Update Environment Variables

Add the following to your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Step 4: Install Dependencies

Navigate to the backend directory and install the new packages:

```bash
cd backend
npm install
```

This will install:
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth strategy

## Step 5: Start the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend server:
```bash
cd frontend
npm start
```

## Step 6: Test Google Login

1. Navigate to `http://localhost:3000/login`
2. Click the "Continue with Google" button
3. You should be redirected to Google's login page
4. After authentication, you'll be redirected back to the app

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Make sure the redirect URI in Google Console exactly matches: `http://localhost:5000/api/auth/google/callback`
   - Check for trailing slashes or http vs https

2. **"OAuth not configured" warning**
   - Verify your `.env` file has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Restart the backend server after adding environment variables

3. **Database errors**
   - Make sure you've run the migration script
   - Check that `google_id` and `profile_picture` columns exist in the users table

4. **CORS errors**
   - Ensure the frontend is running on `http://localhost:3000`
   - Check that the backend CORS settings allow credentials

## Production Deployment

For production, you'll need to:

1. Update authorized origins and redirect URIs in Google Console to your production domain
2. Update the callback URL in `backend/server.js` to use your production domain
3. Ensure environment variables are set securely (use a secrets manager)
4. Use HTTPS (required by Google OAuth)

## Notes

- Users can log in with either email/password or Google OAuth
- If a user signs up with email/password and later uses Google with the same email, the accounts will be linked
- Google profile pictures are stored in the database for future use


