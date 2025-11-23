const express = require('express');
const pool = require('../config/database');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

router.use(protect);

// @route   POST /api/attendance/clock-in
// @desc    Clock in
// @access  Private
router.post('/clock-in', async (req, res) => {
  try {
    const { site_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    // Check if already clocked in today
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND site_id = $2 AND attendance_date = $3',
      [req.user.id, site_id, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].clock_in) {
      return res.status(400).json({ message: 'Already clocked in today' });
    }

    let result;
    if (existing.rows.length > 0) {
      // Update existing record
      result = await pool.query(
        `UPDATE attendance 
         SET clock_in = $1, status = 'present', marked_by = $2
         WHERE id = $3
         RETURNING *`,
        [now, req.user.id, existing.rows[0].id]
      );
    } else {
      // Create new record
      result = await pool.query(
        `INSERT INTO attendance (user_id, site_id, attendance_date, clock_in, status, marked_by)
         VALUES ($1, $2, $3, $4, 'present', $5)
         RETURNING *`,
        [req.user.id, site_id, today, now, req.user.id]
      );
    }

    await logAudit(req.user.id, 'CLOCK_IN', 'attendance', result.rows[0].id, { site_id });

    res.json({ message: 'Clocked in successfully', attendance: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/clock-out
// @desc    Clock out
// @access  Private
router.post('/clock-out', async (req, res) => {
  try {
    const { site_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND site_id = $2 AND attendance_date = $3',
      [req.user.id, site_id, today]
    );

    if (existing.rows.length === 0 || !existing.rows[0].clock_in) {
      return res.status(400).json({ message: 'Not clocked in today' });
    }

    if (existing.rows[0].clock_out) {
      return res.status(400).json({ message: 'Already clocked out today' });
    }

    // Calculate work hours
    const clockIn = existing.rows[0].clock_in;
    const clockOut = now;
    const [inHours, inMinutes] = clockIn.split(':').map(Number);
    const [outHours, outMinutes] = clockOut.split(':').map(Number);
    const workHours = (outHours + outMinutes / 60) - (inHours + inMinutes / 60);

    const result = await pool.query(
      `UPDATE attendance 
       SET clock_out = $1, work_hours = $2
       WHERE id = $3
       RETURNING *`,
      [now, workHours, existing.rows[0].id]
    );

    await logAudit(req.user.id, 'CLOCK_OUT', 'attendance', result.rows[0].id, { site_id, work_hours: workHours });

    res.json({ message: 'Clocked out successfully', attendance: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/mark
// @desc    Mark attendance (for supervisors)
// @access  Private/Supervisor, Manager, Admin
router.post('/mark', async (req, res) => {
  try {
    if (!['admin', 'manager', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { user_id, site_id, attendance_date, clock_in, clock_out, status, notes } = req.body;

    // Calculate work hours if both clock in and out are provided
    let workHours = null;
    if (clock_in && clock_out) {
      const [inHours, inMinutes] = clock_in.split(':').map(Number);
      const [outHours, outMinutes] = clock_out.split(':').map(Number);
      workHours = (outHours + outMinutes / 60) - (inHours + inMinutes / 60);
    }

    const result = await pool.query(
      `INSERT INTO attendance (user_id, site_id, attendance_date, clock_in, clock_out, work_hours, status, marked_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, site_id, attendance_date)
       DO UPDATE SET 
         clock_in = COALESCE(EXCLUDED.clock_in, attendance.clock_in),
         clock_out = COALESCE(EXCLUDED.clock_out, attendance.clock_out),
         work_hours = COALESCE(EXCLUDED.work_hours, attendance.work_hours),
         status = COALESCE(EXCLUDED.status, attendance.status),
         marked_by = EXCLUDED.marked_by,
         notes = COALESCE(EXCLUDED.notes, attendance.notes)
       RETURNING *`,
      [user_id, site_id, attendance_date, clock_in, clock_out, workHours, status || 'present', req.user.id, notes]
    );

    await logAudit(req.user.id, 'MARK_ATTENDANCE', 'attendance', result.rows[0].id, req.body);

    res.json({ message: 'Attendance marked successfully', attendance: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT a.*, 
             u.first_name || ' ' || u.last_name as user_name,
             s.name as site_name,
             m.first_name || ' ' || m.last_name as marked_by_name
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      JOIN sites s ON a.site_id = s.id
      LEFT JOIN users m ON a.marked_by = m.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Workers can only see their own attendance
    if (req.user.role === 'worker') {
      query += ` AND a.user_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }
    // Supervisors can see attendance for their sites
    else if (req.user.role === 'supervisor') {
      query += ` AND s.supervisor_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    if (req.query.site_id) {
      query += ` AND a.site_id = $${paramCount}`;
      params.push(req.query.site_id);
      paramCount++;
    }

    if (req.query.start_date && req.query.end_date) {
      query += ` AND a.attendance_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(req.query.start_date, req.query.end_date);
      paramCount += 2;
    }

    query += ` ORDER BY a.attendance_date DESC, a.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/leave-requests
// @desc    Create leave request
// @access  Private
router.post('/leave-requests', async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;

    const result = await pool.query(
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [req.user.id, leave_type, start_date, end_date, reason]
    );

    // Notify managers
    const managers = await pool.query(
      "SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true"
    );

    for (const manager of managers.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
         VALUES ($1, 'Leave Request', $2, 'attendance', 'leave_request', $3)`,
        [
          manager.id,
          `${req.user.first_name} ${req.user.last_name} has requested leave from ${start_date} to ${end_date}`,
          result.rows[0].id
        ]
      );
    }

    await logAudit(req.user.id, 'CREATE_LEAVE_REQUEST', 'leave_request', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Leave request created successfully', request: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/leave-requests
// @desc    Get leave requests
// @access  Private
router.get('/leave-requests', async (req, res) => {
  try {
    let query = `
      SELECT lr.*, 
             u.first_name || ' ' || u.last_name as user_name,
             a.first_name || ' ' || a.last_name as approved_by_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users a ON lr.approved_by = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Workers can only see their own requests
    if (req.user.role === 'worker') {
      query += ` AND lr.user_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    query += ` ORDER BY lr.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/leave-requests/:id
// @desc    Approve/reject leave request
// @access  Private/Admin, Manager
router.put('/leave-requests/:id', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE leave_requests 
       SET status = $1, 
           approved_by = $2, 
           approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END
       WHERE id = $3
       RETURNING *`,
      [status, req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Notify requester
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
       VALUES ($1, 'Leave Request ' || $2, $3, 'attendance', 'leave_request', $4)`,
      [
        result.rows[0].user_id,
        status === 'approved' ? 'Approved' : 'Rejected',
        `Your leave request has been ${status}`,
        req.params.id
      ]
    );

    await logAudit(req.user.id, `${status.toUpperCase()}_LEAVE_REQUEST`, 'leave_request', req.params.id, { status });

    res.json({ message: `Leave request ${status} successfully`, request: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

