# Troubleshooting Google OAuth "Site Can't Be Reached"

If you're getting "This site can't be reached" when clicking the Google login button, here are the most common causes and solutions:

## 1. Backend Server Not Running

**Problem:** The backend server must be running for Google OAuth to work.

**Solution:**
```bash
cd backend
npm start
```

Make sure you see: `Server running on port 5000`

## 2. Google OAuth Not Configured

**Problem:** If `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not set in `.env`, the route won't work.

**Solution:**
1. Check your `backend/.env` file has:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

2. If missing, follow the setup guide in `GOOGLE_OAUTH_SETUP.md`

3. Restart the backend server after adding credentials

## 3. Wrong Redirect URI in Google Console

**Problem:** The redirect URI in Google Cloud Console must exactly match your callback URL.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, make sure you have:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
5. **Important:** 
   - Must be `http://localhost:5000` (not 3000)
   - Must include `/api/auth/google/callback`
   - No trailing slash
   - Must be `http://` not `https://` for localhost

## 4. Check Browser Console

**Problem:** Network errors might show in browser console.

**Solution:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click the Google login button
4. Check for any error messages
5. Go to Network tab and see if the request to `/api/auth/google` is being made

## 5. CORS Issues

**Problem:** CORS might be blocking the request.

**Solution:**
The backend should already have CORS configured. If you see CORS errors:
1. Make sure frontend is running on `http://localhost:3000`
2. Make sure backend CORS allows `http://localhost:3000`

## 6. Test the Route Directly

**Problem:** Verify the route exists.

**Solution:**
1. Make sure backend is running
2. Open browser and go to: `http://localhost:5000/api/auth/google`
3. You should be redirected to Google's login page
4. If you get "Cannot GET /api/auth/google", the route isn't set up correctly

## 7. Check Environment Variables

**Problem:** Environment variables might not be loaded.

**Solution:**
1. Make sure `.env` file is in the `backend/` folder (not root)
2. Restart the backend server after changing `.env`
3. Check backend console for the warning message:
   - If you see: `⚠️ Google OAuth not configured` - credentials are missing
   - If you don't see it - credentials are loaded

## Quick Checklist

- [ ] Backend server is running on port 5000
- [ ] Frontend server is running on port 3000
- [ ] `GOOGLE_CLIENT_ID` is set in `backend/.env`
- [ ] `GOOGLE_CLIENT_SECRET` is set in `backend/.env`
- [ ] Redirect URI in Google Console is: `http://localhost:5000/api/auth/google/callback`
- [ ] Backend server was restarted after adding credentials
- [ ] No firewall blocking localhost connections

## Still Not Working?

1. Check backend console for error messages
2. Check browser console (F12) for errors
3. Try accessing `http://localhost:5000/api/auth/google` directly in browser
4. Verify your Google OAuth credentials are correct
5. Make sure you've run the database migration: `database/schema_update_google.sql`


