const express = require('express');
const pool = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const stats = {};

    // Total projects
    const projects = await pool.query('SELECT COUNT(*) as count FROM projects WHERE status = $1', ['active']);
    stats.activeProjects = parseInt(projects.rows[0].count);

    // Total sites
    const sites = await pool.query('SELECT COUNT(*) as count FROM sites WHERE status = $1', ['active']);
    stats.activeSites = parseInt(sites.rows[0].count);

    // Pending tasks
    const pendingTasks = await pool.query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE status IN ('pending', 'in_progress')`
    );
    stats.pendingTasks = parseInt(pendingTasks.rows[0].count);

    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await pool.query(
      'SELECT COUNT(*) as count FROM attendance WHERE attendance_date = $1 AND status = $2',
      [today, 'present']
    );
    stats.todayAttendance = parseInt(todayAttendance.rows[0].count);

    // Equipment in maintenance
    const equipmentMaintenance = await pool.query(
      "SELECT COUNT(*) as count FROM equipment WHERE status = $1",
      ['maintenance']
    );
    stats.equipmentInMaintenance = parseInt(equipmentMaintenance.rows[0].count);

    // Low stock materials
    const lowStock = await pool.query(
      `SELECT COUNT(*) as count FROM material_inventory 
       WHERE quantity <= min_threshold`
    );
    stats.lowStockMaterials = parseInt(lowStock.rows[0].count);

    // Recent tasks
    const recentTasks = await pool.query(
      `SELECT t.*, s.name as site_name
       FROM tasks t
       LEFT JOIN sites s ON t.site_id = s.id
       ORDER BY t.created_at DESC
       LIMIT 5`
    );
    stats.recentTasks = recentTasks.rows;

    // Recent activities
    const recentActivities = await pool.query(
      `SELECT da.*, s.name as site_name, u.first_name || ' ' || u.last_name as user_name
       FROM daily_activities da
       LEFT JOIN sites s ON da.site_id = s.id
       LEFT JOIN users u ON da.user_id = u.id
       ORDER BY da.created_at DESC
       LIMIT 5`
    );
    stats.recentActivities = recentActivities.rows;

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/progress
// @desc    Get progress report
// @access  Private
router.get('/progress', async (req, res) => {
  try {
    const { site_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks
      FROM tasks
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (site_id) {
      query += ` AND site_id = $${paramCount}`;
      params.push(site_id);
      paramCount++;
    }

    if (start_date && end_date) {
      query += ` AND DATE(created_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(start_date, end_date);
      paramCount += 2;
    } else {
      // Default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      query += ` AND DATE(created_at) BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
    }

    query += ` GROUP BY DATE(created_at) ORDER BY date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/material-usage
// @desc    Get material usage report
// @access  Private
router.get('/material-usage', async (req, res) => {
  try {
    const { site_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        m.name as material_name,
        m.unit,
        SUM(mu.quantity) as total_used,
        COUNT(mu.id) as usage_count
      FROM material_usage mu
      JOIN materials m ON mu.material_id = m.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (site_id) {
      query += ` AND mu.site_id = $${paramCount}`;
      params.push(site_id);
      paramCount++;
    }

    if (start_date && end_date) {
      query += ` AND mu.usage_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(start_date, end_date);
    }

    query += ` GROUP BY m.id, m.name, m.unit ORDER BY total_used DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/attendance
// @desc    Get attendance report
// @access  Private
router.get('/attendance', async (req, res) => {
  try {
    const { site_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        u.id as user_id,
        u.first_name || ' ' || u.last_name as user_name,
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE a.status = 'present') as present_days,
        COUNT(*) FILTER (WHERE a.status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE a.status = 'late') as late_days,
        SUM(a.work_hours) as total_hours
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (site_id) {
      query += ` AND a.site_id = $${paramCount}`;
      params.push(site_id);
      paramCount++;
    }

    if (start_date && end_date) {
      query += ` AND a.attendance_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(start_date, end_date);
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      query += ` AND a.attendance_date >= $${paramCount}`;
      params.push(firstDay.toISOString().split('T')[0]);
    }

    query += ` GROUP BY u.id, u.first_name, u.last_name ORDER BY user_name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/equipment-status
// @desc    Get equipment status report
// @access  Private
router.get('/equipment-status', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM equipment
       GROUP BY status
       ORDER BY status`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

