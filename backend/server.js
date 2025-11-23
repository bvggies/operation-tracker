const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware - CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash
  process.env.FRONTEND_URL?.replace(/\/$/, '') + '/', // Add trailing slash
  'http://localhost:3000',
  'http://localhost:3000/',
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Normalize origin (remove trailing slash for comparison)
    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
    
    if (normalizedAllowed.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      // For development, allow localhost
      if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
// Note: On Vercel, files in /tmp are temporary and not served statically
// Consider using cloud storage (S3, Cloudinary, etc.) for production
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/audit', require('./routes/audit'));

// Root route - works on both local and Vercel
app.get('/', (req, res) => {
  res.json({ 
    message: 'Operations Tracker API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects',
      tasks: '/api/tasks',
      materials: '/api/materials',
      equipment: '/api/equipment',
      attendance: '/api/attendance',
      reports: '/api/reports',
      notifications: '/api/notifications',
      documents: '/api/documents',
      audit: '/api/audit'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Operations Tracker API is running' });
});

// For Vercel serverless functions
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

