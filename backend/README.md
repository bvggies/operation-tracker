# Backend API - Operations Tracker

Express.js backend API for the Operations Tracker application.

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_neon_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## Local Development

```bash
npm install
npm start
# or
npm run dev  # with nodemon for auto-reload
```

## Vercel Deployment

The backend is configured to work with Vercel serverless functions. When deployed to Vercel:

1. Set environment variables in Vercel dashboard
2. Root directory should be set to `backend`
3. Build command: `npm install` (or leave empty)
4. Output directory: leave empty
5. Install command: `npm install`

## Important Notes

### File Uploads on Vercel

Vercel serverless functions have limitations:
- File system is read-only except `/tmp`
- Files in `/tmp` are temporary and will be deleted after function execution
- **Recommendation:** Use cloud storage (AWS S3, Cloudinary, Vercel Blob) for production

The current implementation uses `/tmp/uploads` on Vercel, but files won't persist. Consider integrating cloud storage for production use.

## API Endpoints

- `/api/health` - Health check
- `/api/auth/*` - Authentication routes
- `/api/users/*` - User management
- `/api/projects/*` - Project and site management
- `/api/tasks/*` - Task management
- `/api/materials/*` - Material tracking
- `/api/equipment/*` - Equipment management
- `/api/attendance/*` - Attendance tracking
- `/api/reports/*` - Reports and analytics
- `/api/notifications/*` - Notifications
- `/api/documents/*` - Document management
- `/api/audit/*` - Audit logs

