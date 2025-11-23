# Database Setup Instructions

## Your Neon Database Connection

Your Neon PostgreSQL connection string:
```
postgresql://neondb_owner:npg_IPuJvF7j8WzK@ep-purple-wave-ahboae4g-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Step 1: Run Database Schema

You have two options:

### Option A: Using Neon SQL Editor (Recommended)

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click on "SQL Editor"
4. Copy the entire contents of `backend/database/schema.sql`
5. Paste into the SQL Editor
6. Click "Run" to execute

### Option B: Using psql Command Line

```bash
# Make sure you have psql installed
psql "postgresql://neondb_owner:npg_IPuJvF7j8WzK@ep-purple-wave-ahboae4g-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -f backend/database/schema.sql
```

## Step 2: Seed Admin User

After running the schema, create the admin user:

### Option A: Using Seed Script

```bash
cd backend
node database/seed.js
```

Make sure your `.env` file has the `DATABASE_URL` set correctly.

### Option B: Using SQL Directly

Run this SQL in Neon SQL Editor:

```sql
-- Generate password hash for 'admin123'
-- You can use: https://bcrypt-generator.com/
-- Or run: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h));"

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

**Note:** The password hash above is a placeholder. Generate a proper hash using bcrypt.

## Step 3: Verify Setup

Test the connection:

```bash
cd backend
node -e "const pool = require('./config/database'); pool.query('SELECT COUNT(*) FROM users').then(r => { console.log('Users:', r.rows[0].count); pool.end(); });"
```

## Default Login Credentials

- **Username:** admin
- **Password:** admin123

**⚠️ IMPORTANT:** Change the password immediately after first login!

## Environment Variables

Your `.env` file should contain:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:npg_IPuJvF7j8WzK@ep-purple-wave-ahboae4g-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**Security Note:** Never commit the `.env` file to Git! It's already in `.gitignore`.

