# Fix: Frontend Folder Not Showing in Vercel

## The Issue
Vercel is not detecting the `frontend` folder even though it's in the repository.

## Solution Steps

### Option 1: Re-import Project in Vercel (Recommended)

1. **Go to Vercel Dashboard**
2. **Delete the existing project** (if you created one)
3. **Create a NEW project:**
   - Click "Add New Project"
   - Import repository: `bvggies/operation-tracker`
   - **IMPORTANT:** Wait for Vercel to scan the repository
   - You should see both `backend` and `frontend` folders

4. **Create TWO separate projects:**
   - **Project 1 (Backend):**
     - Root Directory: `backend`
     - Framework: Other
   
   - **Project 2 (Frontend):**
     - Root Directory: `frontend`
     - Framework: Create React App

### Option 2: Manual Folder Selection

If Vercel still doesn't show the frontend folder:

1. **In Vercel project settings:**
   - Go to Settings > General
   - Scroll to "Root Directory"
   - Click "Edit"
   - Type: `frontend` (manually)
   - Save

2. **Or use Vercel CLI:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy frontend
   cd frontend
   vercel --prod
   ```

### Option 3: Verify Repository on GitHub

1. **Check GitHub directly:**
   - Go to: https://github.com/bvggies/operation-tracker
   - Verify you can see the `frontend` folder
   - Click into it and verify files are there

2. **If frontend folder is missing on GitHub:**
   - The push might not have completed
   - Try pushing again:
     ```bash
     git push origin main --force
     ```

### Option 4: Create Frontend Project Manually

1. **In Vercel Dashboard:**
   - Click "Add New Project"
   - Select "Deploy Git Repository"
   - Choose: `bvggies/operation-tracker`
   - **Project Name:** `operations-tracker-frontend`
   - **Root Directory:** Type `frontend` manually
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`

2. **Add Environment Variable:**
   - `REACT_APP_API_URL` = `https://your-backend-url.vercel.app/api`

3. **Deploy**

## Verification

After deploying, verify:

1. **Check GitHub:** https://github.com/bvggies/operation-tracker/tree/main/frontend
   - Should show all frontend files

2. **Check Vercel:**
   - Go to project settings
   - Check "Root Directory" setting
   - Should be `frontend` for frontend project

3. **Test Build:**
   - Vercel should automatically detect `package.json` in frontend folder
   - Build logs should show React app building

## Quick Test

Run this to verify frontend is in repository:

```bash
git ls-tree -r --name-only HEAD | findstr "^frontend"
```

Should show many frontend files.

## Still Not Working?

If Vercel still doesn't see the frontend folder:

1. **Check Vercel project type:**
   - Make sure you're creating a NEW project, not using an existing one
   - Vercel might cache the old structure

2. **Try Vercel CLI:**
   ```bash
   cd frontend
   vercel
   ```
   This will deploy directly from the frontend folder

3. **Contact Vercel Support:**
   - They can help debug repository detection issues

