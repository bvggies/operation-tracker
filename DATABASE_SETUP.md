# Database Setup - Quick Guide

## Your Neon Database Connection

```
postgresql://neondb_owner:npg_IPuJvF7j8WzK@ep-purple-wave-ahboae4g-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Step 1: Run Database Schema

### Option A: Using Neon SQL Editor (Easiest)

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click "SQL Editor"
4. Copy ALL contents from `backend/database/schema.sql`
5. Paste and click "Run"

### Option B: Using psql Command

```bash
psql "postgresql://neondb_owner:npg_IPuJvF7j8WzK@ep-purple-wave-ahboae4g-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -f backend/database/schema.sql
```

## Step 2: Create Admin User

After schema is created, run:

```bash
cd backend
node database/seed.js
```

This will create:
- **Username:** admin
- **Password:** admin123

## Step 3: Test Connection

```bash
cd backend
npm start
```

The server should start and connect to your database.

## Environment Variables

Your `.env` file in `backend/` directory is already configured with your database URL.

**⚠️ Security:** Never commit `.env` file to Git! It's in `.gitignore`.

## Next Steps

1. ✅ Database schema created
2. ✅ Admin user seeded
3. Start backend: `cd backend && npm start`
4. Start frontend: `cd frontend && npm install && npm start`
5. Login at http://localhost:3000 with admin/admin123

