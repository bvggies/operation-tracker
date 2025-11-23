# Quick Setup Guide

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/bvggies/operation-tracker.git
cd operation-tracker
```

Or if you already have the code locally, see `GITHUB_SETUP.md` for pushing to GitHub.

### 2. Set Up Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy your connection string (looks like: `postgresql://user:password@host/database?sslmode=require`)
4. In Neon dashboard, go to SQL Editor
5. Copy and paste the contents of `backend/database/schema.sql`
6. Run the SQL to create all tables

### 3. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_neon_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

Seed admin user:
```bash
node database/seed.js
```

Start backend:
```bash
npm start
# or for development with auto-reload
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm start
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

**Default Login:**
- Username: `admin`
- Password: `admin123`

**⚠️ Important:** Change the default password after first login!

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Vercel deployment instructions.

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure SSL mode is included: `?sslmode=require`
- Check if your Neon project is active

### Port Already in Use
- Change `PORT` in `backend/.env` to a different port (e.g., 5001)
- Update `REACT_APP_API_URL` in `frontend/.env` accordingly

### Module Not Found Errors
- Run `npm install` in both `backend` and `frontend` directories
- Delete `node_modules` and `package-lock.json`, then reinstall

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that backend is running before starting frontend

