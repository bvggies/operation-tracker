# Deploying to Vercel - Step by Step

## Prerequisites
- ✅ GitHub repository: https://github.com/bvggies/operation-tracker
- ✅ Neon PostgreSQL database configured
- ✅ Vercel account (free tier works)

## Step 1: Deploy Backend to Vercel

### 1.1 Create Backend Project on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository: `bvggies/operation-tracker`
4. Configure the project:
   - **Project Name:** `operations-tracker-backend` (or your choice)
   - **Root Directory:** `backend` ⚠️ **IMPORTANT: Set this to `backend`**
   - **Framework Preset:** Other
   - **Build Command:** Leave empty (or `npm install`)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

### 1.2 Set Environment Variables

Click **"Environment Variables"** and add:

```
DATABASE_URL=postgresql://neondb_owner:npg_IPuJvF7j8WzK@ep-purple-wave-ahboae4g-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_secure_random_string_here_generate_one
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.3 Deploy

Click **"Deploy"** and wait for deployment to complete.

### 1.4 Get Backend URL

After deployment, copy your backend URL (e.g., `https://operations-tracker-backend.vercel.app`)

**Test it:**
- Visit: `https://your-backend-url.vercel.app/`
- Should see API information
- Visit: `https://your-backend-url.vercel.app/api/health`
- Should see: `{"status":"OK","message":"Operations Tracker API is running"}`

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Frontend Project on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import the same GitHub repository: `bvggies/operation-tracker`
4. Configure the project:
   - **Project Name:** `operations-tracker-frontend` (or your choice)
   - **Root Directory:** `frontend` ⚠️ **IMPORTANT: Set this to `frontend`**
   - **Framework Preset:** Create React App (auto-detected)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build` (auto-detected)
   - **Install Command:** `npm install`

### 2.2 Set Environment Variables

Click **"Environment Variables"** and add:

```
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

Replace `your-backend-url.vercel.app` with your actual backend URL from Step 1.4.

### 2.3 Deploy

Click **"Deploy"** and wait for deployment to complete.

### 2.4 Get Frontend URL

After deployment, copy your frontend URL (e.g., `https://operations-tracker-frontend.vercel.app`)

## Step 3: Update Backend CORS

1. Go back to your **Backend Project** on Vercel
2. Go to **Settings** > **Environment Variables**
3. Update `FRONTEND_URL` to your frontend URL from Step 2.4
4. Go to **Deployments** tab
5. Click the **"..."** menu on the latest deployment
6. Click **"Redeploy"**

This ensures CORS is properly configured.

## Step 4: Test Your Deployment

1. **Visit Frontend:** `https://your-frontend-url.vercel.app`
2. **Login:**
   - Username: `admin`
   - Password: `admin123`
3. **Test Features:**
   - Create a project
   - Add a site
   - Create a task
   - Test other features

## Important Notes

### File Uploads on Vercel

⚠️ **Limitation:** Vercel serverless functions have a read-only filesystem except `/tmp`. Files uploaded to `/tmp` are temporary and will be deleted.

**Current Status:** File uploads will work but files won't persist. For production, consider:
- AWS S3
- Cloudinary
- Vercel Blob Storage

### Environment Variables

**Never commit `.env` files to Git!** Always use Vercel's Environment Variables in the dashboard.

### Database Connection

Make sure your Neon PostgreSQL connection string includes `?sslmode=require` for secure connections.

## Troubleshooting

### Backend Returns "Cannot GET /"
- ✅ Fixed! The root route is now configured
- Visit `/api/health` to verify backend is working

### CORS Errors
- Verify `FRONTEND_URL` in backend environment variables matches your frontend URL exactly
- Redeploy backend after updating `FRONTEND_URL`

### Database Connection Errors
- Verify `DATABASE_URL` is correct in Vercel environment variables
- Check Neon dashboard to ensure database is active
- Ensure connection string includes `?sslmode=require`

### Frontend Can't Connect to Backend
- Verify `REACT_APP_API_URL` is set correctly
- Check that backend URL is accessible (visit it in browser)
- Check browser console for specific error messages

### Build Failures
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18.x by default)

## Quick Reference

### Backend URLs
- Root: `https://your-backend.vercel.app/`
- Health: `https://your-backend.vercel.app/api/health`
- API Base: `https://your-backend.vercel.app/api`

### Frontend URL
- App: `https://your-frontend.vercel.app`

### Default Login
- Username: `admin`
- Password: `admin123`

## Next Steps

1. ✅ Deploy backend
2. ✅ Deploy frontend
3. ✅ Update CORS
4. ✅ Test application
5. 🔒 Change default admin password
6. 🔒 Generate secure JWT_SECRET
7. 📝 Consider adding custom domain
8. 📝 Set up file storage for production

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test backend endpoints directly

