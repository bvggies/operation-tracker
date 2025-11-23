const express = require('express');
const pool = require('../config/database');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   GET /api/audit
// @desc    Get audit logs
// @access  Private/Admin, Manager
router.get('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    let query = `
      SELECT al.*, 
             u.username, 
             u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (req.query.user_id) {
      query += ` AND al.user_id = $${paramCount}`;
      params.push(req.query.user_id);
      paramCount++;
    }

    if (req.query.entity_type) {
      query += ` AND al.entity_type = $${paramCount}`;
      params.push(req.query.entity_type);
      paramCount++;
    }

    if (req.query.start_date && req.query.end_date) {
      query += ` AND DATE(al.created_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(req.query.start_date, req.query.end_date);
      paramCount += 2;
    }

    query += ` ORDER BY al.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

