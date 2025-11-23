const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin, Manager
router.get('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    // Users can view their own profile, admins/managers can view any
    if (req.user.id !== req.params.id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin, Manager
router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { first_name, last_name, email, role, is_active } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           role = COALESCE($4, role),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, username, email, first_name, last_name, role, is_active`,
      [first_name, last_name, email, role, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAudit(req.user.id, 'UPDATE_USER', 'user', req.params.id, req.body);

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user (soft delete)
// @access  Private/Admin
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAudit(req.user.id, 'DEACTIVATE_USER', 'user', req.params.id);

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

