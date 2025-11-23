# Deployment Guide - Vercel + Neon PostgreSQL

This guide covers deploying the Operations Tracker application to Vercel with Neon PostgreSQL database.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Neon PostgreSQL account (free tier works)

## Step 1: Set Up Neon PostgreSQL Database

1. **Create a Neon Account:**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for a free account

2. **Create a New Project:**
   - Click "Create Project"
   - Choose a project name and region
   - Click "Create Project"

3. **Get Connection String:**
   - After project creation, you'll see a connection string
   - Copy the connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)
   - Save this for later use

4. **Run Database Schema:**
   - In Neon dashboard, go to "SQL Editor"
   - Copy the contents of `backend/database/schema.sql`
   - Paste and run it in the SQL Editor
   - This will create all necessary tables

5. **Seed Admin User:**
   - Update `backend/database/seed.js` with your connection string temporarily
   - Or manually insert admin user using SQL:
   ```sql
   -- First, generate a password hash (you can use an online bcrypt generator)
   -- For password 'admin123', the hash is approximately:
   INSERT INTO users (username, email, password, first_name, last_name, role, is_active)
   VALUES (
     'admin',
     'admin@operations.com',
     '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
     'Admin',
     'User',
     'admin',
     true
   );
   ```
   - **Better approach:** Use the seed script locally first, then deploy

## Step 2: Prepare Your Code

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/bvggies/operation-tracker.git
   git push -u origin main
   ```
   
   See `GITHUB_SETUP.md` for detailed GitHub setup instructions.

2. **Update Environment Variables:**
   - Create `.env.example` files if needed
   - Document all required environment variables

## Step 3: Deploy Backend to Vercel

### Option A: Deploy Backend as Separate Vercel Project (Recommended)

1. **Create New Vercel Project:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the repository

2. **Configure Project:**
   - **Root Directory:** Set to `backend`
   - **Framework Preset:** Other
   - **Build Command:** Leave empty (or `npm install`)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

3. **Set Environment Variables:**
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `JWT_SECRET`: A secure random string (generate one: `openssl rand -base64 32`)
   - `JWT_EXPIRE`: `7d`
   - `FRONTEND_URL`: Will be set after frontend deployment (e.g., `https://your-frontend.vercel.app`)
   - `NODE_ENV`: `production`
   - `PORT`: Vercel sets this automatically

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy the deployment URL (e.g., `https://your-backend.vercel.app`)

### Option B: Deploy Backend as API Routes (Alternative)

If you want everything in one Vercel project, you can restructure the backend as Vercel serverless functions. This requires more setup.

## Step 4: Deploy Frontend to Vercel

1. **Create New Vercel Project:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import the same GitHub repository (or create a separate one)

2. **Configure Project:**
   - **Root Directory:** Set to `frontend`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build` (auto-detected)
   - **Install Command:** `npm install`

3. **Set Environment Variables:**
   - `REACT_APP_API_URL`: Your backend URL from Step 3 (e.g., `https://your-backend.vercel.app/api`)

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy the deployment URL (e.g., `https://your-frontend.vercel.app`)

## Step 5: Update Backend CORS Settings

1. **Update Backend Environment Variable:**
   - Go back to your backend Vercel project
   - Go to Settings > Environment Variables
   - Update `FRONTEND_URL` to your frontend URL from Step 4
   - Redeploy the backend

## Step 6: Seed Admin User (If Not Done)

1. **Option 1: Use Seed Script Locally**
   ```bash
   # Set environment variable
   export DATABASE_URL="your-neon-connection-string"
   
   # Run seed script
   cd backend
   node database/seed.js
   ```

2. **Option 2: Use Neon SQL Editor**
   - Go to Neon dashboard > SQL Editor
   - Run the INSERT statement from Step 1

## Step 7: Test Your Deployment

1. **Access Frontend:**
   - Go to your frontend Vercel URL
   - You should see the login page

2. **Login:**
   - Username: `admin`
   - Password: `admin123`
   - Change password immediately after first login!

3. **Test Features:**
   - Create a project
   - Add a site
   - Create a task
   - Test other features

## Environment Variables Summary

### Backend (Vercel)
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-secure-random-string
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

## File Uploads on Vercel

**Important:** Vercel serverless functions have limitations:
- File system is read-only except `/tmp`
- Files uploaded to `/tmp` are temporary and will be deleted

**Solutions:**
1. **Use Cloud Storage:** Integrate with AWS S3, Cloudinary, or similar
2. **Use Vercel Blob Storage:** Vercel's own storage solution
3. **Store file metadata only:** Keep files in external storage

For now, the uploads directory won't persist on Vercel. Consider updating the documents route to use cloud storage.

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if Neon allows connections from Vercel IPs
- Ensure SSL mode is set (`?sslmode=require`)

### CORS Issues
- Verify `FRONTEND_URL` in backend matches your frontend URL exactly
- Check that backend allows the frontend origin

### API Not Found
- Verify `REACT_APP_API_URL` in frontend is correct
- Check backend deployment URL
- Ensure API routes are working: `https://your-backend.vercel.app/api/health`

### Build Failures
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18.x by default)

## Updating Your Deployment

1. **Make changes to your code**
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. **Vercel will automatically redeploy** (if auto-deploy is enabled)

## Cost Estimation

- **Vercel:** Free tier includes:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Serverless function execution time limits apply
  
- **Neon PostgreSQL:** Free tier includes:
  - 0.5 GB storage
  - Shared compute
  - Perfect for development and small projects

## Security Notes

1. **Change default admin password** immediately after first login
2. **Use strong JWT_SECRET** (at least 32 characters, random)
3. **Enable HTTPS** (automatic with Vercel)
4. **Review environment variables** - never commit secrets to Git
5. **Set up proper CORS** - only allow your frontend domain

## Support

For issues:
- Check Vercel deployment logs
- Check Neon database logs
- Review application logs in browser console
- Open an issue on GitHub
