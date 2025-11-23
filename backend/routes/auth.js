const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const generateToken = require('../utils/generateToken');
const { protect, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user (Admin only)
// @access  Private/Admin
router.post('/register', protect, authorize('admin'), async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role } = req.body;

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, role, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, first_name, last_name, role, is_active, created_at`,
      [username, email, hashedPassword, first_name, last_name, role, req.user?.id || null]
    );

    if (req.user?.id) {
      await logAudit(req.user.id, 'CREATE_USER', 'user', result.rows[0].id, {
        username, email, role
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Check user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await logAudit(user.id, 'LOGIN', 'user', user.id);

    res.json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
});

module.exports = router;

