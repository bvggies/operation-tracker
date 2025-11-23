# Quick Start Guide

## ✅ Database Setup Complete!

Your Neon PostgreSQL database is configured and the admin user has been created.

**Database:** Connected ✅  
**Admin User:** Created ✅

### Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change the password after first login!

## Next Steps

### 1. Verify Database Schema

Make sure all tables are created. Run the schema if needed:

**Option A: Using Neon SQL Editor (Recommended)**
1. Go to [Neon Console](https://console.neon.tech)
2. Click "SQL Editor"
3. Copy contents of `backend/database/schema.sql`
4. Paste and run

**Option B: Using psql**
```bash
psql "postgresql://neondb_owner:npg_IPuJvF7j8WzK@ep-purple-wave-ahboae4g-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -f backend/database/schema.sql
```

### 2. Start Backend Server

```bash
cd backend
npm start
```

Server will run on http://localhost:5000

### 3. Start Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend will run on http://localhost:3000

### 4. Access Application

1. Open browser: http://localhost:3000
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Start using the application!

## Environment Variables

Your `.env` file is configured in `backend/.env`:
- ✅ Database URL configured
- ⚠️ Update `JWT_SECRET` for production (generate a secure random string)

## Deployment to Vercel

When ready to deploy:

1. **Push to GitHub** (if not done):
   ```bash
   git add .
   git commit -m "Update"
   git push
   ```

2. **Deploy Backend to Vercel:**
   - Connect GitHub repo
   - Root directory: `backend`
   - Add environment variables (see DEPLOYMENT.md)

3. **Deploy Frontend to Vercel:**
   - Create new Vercel project
   - Root directory: `frontend`
   - Add `REACT_APP_API_URL` environment variable

See `DEPLOYMENT.md` for detailed instructions.

## Troubleshooting

### Database Connection Issues
- Verify connection string in `backend/.env`
- Check Neon dashboard to ensure database is active

### Port Already in Use
- Change `PORT` in `backend/.env` to a different port
- Update `REACT_APP_API_URL` in `frontend/.env` accordingly

### Module Not Found
- Run `npm install` in both `backend` and `frontend` directories

## Support

- Check `DEPLOYMENT.md` for deployment help
- Check `SETUP.md` for detailed setup instructions
- Check `DATABASE_SETUP.md` for database-specific help

