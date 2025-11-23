# Troubleshooting Guide

## Blank White Page After Login

### Common Causes & Solutions

#### 1. API URL Not Configured

**Problem:** Frontend can't connect to backend API.

**Solution:**
- Check browser console (F12) for errors
- Verify `REACT_APP_API_URL` environment variable is set
- On Vercel: Go to Project Settings > Environment Variables
- Add: `REACT_APP_API_URL=https://your-backend-url.vercel.app/api`

**Test:**
```javascript
// Open browser console and check:
console.log('API URL:', process.env.REACT_APP_API_URL);
```

#### 2. CORS Issues

**Problem:** Backend blocking frontend requests.

**Solution:**
- Verify `FRONTEND_URL` in backend environment variables
- Must match your frontend URL exactly (including https://)
- Redeploy backend after updating

**Check:**
- Browser console will show CORS errors
- Network tab will show failed requests

#### 3. JavaScript Error

**Problem:** Component crashing on render.

**Solution:**
- Open browser console (F12)
- Look for red error messages
- Check if error is in Dashboard or other component
- Error boundary should catch and display errors

#### 4. Missing Dependencies

**Problem:** Tailwind CSS or other dependencies not loading.

**Solution:**
```bash
cd frontend
npm install
npm run build
```

#### 5. Authentication Token Issues

**Problem:** Token not being stored or validated.

**Solution:**
- Check browser localStorage (F12 > Application > Local Storage)
- Should see `token` and `user` keys after login
- If missing, check login API response

### Debug Steps

1. **Open Browser Console (F12)**
   - Look for errors (red text)
   - Check Network tab for failed requests

2. **Check API Connection**
   ```javascript
   // In browser console:
   fetch('https://your-backend-url.vercel.app/api/health')
     .then(r => r.json())
     .then(console.log)
   ```

3. **Check Environment Variables**
   - Vercel: Project Settings > Environment Variables
   - Verify `REACT_APP_API_URL` is set
   - Must start with `https://` for production

4. **Check Network Requests**
   - F12 > Network tab
   - Try logging in
   - Check if `/api/auth/login` request succeeds
   - Look at response status and data

5. **Check Local Storage**
   - F12 > Application > Local Storage
   - After login, should see:
     - `token`: JWT token string
     - `user`: JSON user object

### Quick Fixes

#### Fix 1: Verify API URL
```bash
# In frontend/.env or Vercel environment variables:
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

#### Fix 2: Check Backend CORS
```javascript
// In backend/server.js, verify:
origin: process.env.FRONTEND_URL || 'http://localhost:3000'
```

#### Fix 3: Clear Cache
- Clear browser cache
- Clear localStorage: `localStorage.clear()`
- Try logging in again

#### Fix 4: Check Build
```bash
cd frontend
npm run build
# Check for build errors
```

### Common Error Messages

#### "Network Error" or "Failed to fetch"
- API URL is wrong or backend is down
- CORS issue
- Check backend is deployed and accessible

#### "401 Unauthorized"
- Invalid credentials
- Token expired
- Check login credentials

#### "Cannot read property of undefined"
- JavaScript error in component
- Check browser console for stack trace
- Error boundary should catch this

#### Blank page with no errors
- Check if Tailwind CSS is loading
- Check if React Router is working
- Verify all imports are correct

### Still Not Working?

1. **Check Vercel Deployment Logs**
   - Go to Vercel dashboard
   - Check deployment logs for errors

2. **Test Backend Directly**
   - Visit: `https://your-backend-url.vercel.app/api/health`
   - Should return: `{"status":"OK",...}`

3. **Test Frontend Build Locally**
   ```bash
   cd frontend
   npm run build
   npm install -g serve
   serve -s build
   ```

4. **Check Browser Compatibility**
   - Try different browser
   - Check if JavaScript is enabled
   - Try incognito/private mode

