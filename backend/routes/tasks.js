const express = require('express');
const pool = require('../config/database');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks (filtered by user role)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT t.*, 
             s.name as site_name,
             u1.first_name || ' ' || u1.last_name as assigned_to_name,
             u2.first_name || ' ' || u2.last_name as assigned_by_name
      FROM tasks t
      LEFT JOIN sites s ON t.site_id = s.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Workers can only see their own tasks
    if (req.user.role === 'worker') {
      query += ` AND t.assigned_to = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }
    // Supervisors can see tasks for their sites
    else if (req.user.role === 'supervisor') {
      query += ` AND s.supervisor_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
              s.name as site_name,
              u1.first_name || ' ' || u1.last_name as assigned_to_name,
              u2.first_name || ' ' || u2.last_name as assigned_by_name
       FROM tasks t
       LEFT JOIN sites s ON t.site_id = s.id
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get task updates
    const updates = await pool.query(
      `SELECT tu.*, u.first_name || ' ' || u.last_name as user_name
       FROM task_updates tu
       LEFT JOIN users u ON tu.user_id = u.id
       WHERE tu.task_id = $1
       ORDER BY tu.created_at DESC`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], updates: updates.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private/Admin, Manager, Supervisor
router.post('/', async (req, res) => {
  try {
    if (!['admin', 'manager', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { site_id, title, description, assigned_to, priority, due_date } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (site_id, title, description, assigned_to, assigned_by, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [site_id, title, description, assigned_to, req.user.id, priority || 'medium', due_date]
    );

    await logAudit(req.user.id, 'CREATE_TASK', 'task', result.rows[0].id, req.body);

    // Create notification for assigned user
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
       VALUES ($1, 'New Task Assigned', $2, 'task', 'task', $3)`,
      [assigned_to, `You have been assigned a new task: ${title}`, result.rows[0].id]
    );

    res.status(201).json({ message: 'Task created successfully', task: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, priority, due_date, progress_percentage, notes } = req.body;

    // Check if user can update this task
    const taskCheck = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskCheck.rows[0];

    // Workers can only update their own tasks
    if (req.user.role === 'worker' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date),
           completed_at = CASE WHEN $3 = 'completed' AND status != 'completed' THEN NOW() ELSE completed_at END,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description, status, priority, due_date, req.params.id]
    );

    // If progress update, add to task_updates
    if (progress_percentage !== undefined || notes) {
      await pool.query(
        `INSERT INTO task_updates (task_id, user_id, progress_percentage, notes)
         VALUES ($1, $2, $3, $4)`,
        [req.params.id, req.user.id, progress_percentage || task.progress_percentage || 0, notes]
      );
    }

    await logAudit(req.user.id, 'UPDATE_TASK', 'task', req.params.id, req.body);

    res.json({ message: 'Task updated successfully', task: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks/:id/updates
// @desc    Add task progress update
// @access  Private
router.post('/:id/updates', async (req, res) => {
  try {
    const { progress_percentage, notes } = req.body;

    const taskCheck = await pool.query('SELECT assigned_to FROM tasks WHERE id = $1', [req.params.id]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Workers can only update their own tasks
    if (req.user.role === 'worker' && taskCheck.rows[0].assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `INSERT INTO task_updates (task_id, user_id, progress_percentage, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.id, req.user.id, progress_percentage || 0, notes]
    );

    await logAudit(req.user.id, 'TASK_UPDATE', 'task', req.params.id, req.body);

    res.status(201).json({ message: 'Update added successfully', update: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks/activities
// @desc    Log daily activity
// @access  Private
router.post('/activities', async (req, res) => {
  try {
    const { site_id, activity_date, description } = req.body;

    const result = await pool.query(
      `INSERT INTO daily_activities (site_id, user_id, activity_date, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [site_id, req.user.id, activity_date || new Date().toISOString().split('T')[0], description]
    );

    await logAudit(req.user.id, 'LOG_ACTIVITY', 'daily_activity', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Activity logged successfully', activity: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/activities/:siteId
// @desc    Get daily activities for a site
// @access  Private
router.get('/activities/:siteId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT da.*, u.first_name || ' ' || u.last_name as user_name
       FROM daily_activities da
       LEFT JOIN users u ON da.user_id = u.id
       WHERE da.site_id = $1
       ORDER BY da.activity_date DESC, da.created_at DESC`,
      [req.params.siteId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

