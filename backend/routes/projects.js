const express = require('express');
const pool = require('../config/database');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

router.use(protect);

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              u.first_name || ' ' || u.last_name as created_by_name,
              COUNT(DISTINCT s.id) as site_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN sites s ON s.project_id = p.id
       GROUP BY p.id, u.first_name, u.last_name
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/sites/all
// @desc    Get all sites
// @access  Private
router.get('/sites/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
              p.name as project_name,
              u.first_name || ' ' || u.last_name as supervisor_name
       FROM sites s
       LEFT JOIN projects p ON s.project_id = p.id
       LEFT JOIN users u ON s.supervisor_id = u.id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/sites/all
// @desc    Get all sites
// @access  Private
router.get('/sites/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
              p.name as project_name,
              u.first_name || ' ' || u.last_name as supervisor_name
       FROM sites s
       LEFT JOIN projects p ON s.project_id = p.id
       LEFT JOIN users u ON s.supervisor_id = u.id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              u.first_name || ' ' || u.last_name as created_by_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private/Admin, Manager
router.post('/', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, location, start_date, end_date, status } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (name, description, location, start_date, end_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, location, start_date, end_date, status || 'active', req.user.id]
    );

    await logAudit(req.user.id, 'CREATE_PROJECT', 'project', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Project created successfully', project: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private/Admin, Manager
router.put('/:id', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, location, start_date, end_date, status } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           start_date = COALESCE($4, start_date),
           end_date = COALESCE($5, end_date),
           status = COALESCE($6, status),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, description, location, start_date, end_date, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await logAudit(req.user.id, 'UPDATE_PROJECT', 'project', req.params.id, req.body);

    res.json({ message: 'Project updated successfully', project: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id/sites
// @desc    Get sites for a project
// @access  Private
router.get('/:id/sites', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
              u.first_name || ' ' || u.last_name as supervisor_name
       FROM sites s
       LEFT JOIN users u ON s.supervisor_id = u.id
       WHERE s.project_id = $1
       ORDER BY s.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:id/sites
// @desc    Create site for a project
// @access  Private/Admin, Manager, Supervisor
router.post('/:id/sites', async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'manager', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create sites' });
    }

    const { name, address, supervisor_id, status } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Site name is required' });
    }

    // Verify project exists
    const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1', [req.params.id]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If supervisor_id is provided, verify it exists
    if (supervisor_id) {
      const supervisorCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND role IN ($2, $3, $4)',
        [supervisor_id, 'admin', 'manager', 'supervisor']
      );
      if (supervisorCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid supervisor' });
      }
    }

    const result = await pool.query(
      `INSERT INTO sites (project_id, name, address, supervisor_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.params.id, name || null, address || null, supervisor_id || null, status || 'active']
    );

    await logAudit(req.user.id, 'CREATE_SITE', 'site', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Site created successfully', site: result.rows[0] });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/projects/sites/:siteId
// @desc    Update site
// @access  Private/Admin, Manager, Supervisor
router.put('/sites/:siteId', async (req, res) => {
  try {
    const { name, address, supervisor_id, status } = req.body;

    const result = await pool.query(
      `UPDATE sites 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           supervisor_id = COALESCE($3, supervisor_id),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, address, supervisor_id, status, req.params.siteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Site not found' });
    }

    await logAudit(req.user.id, 'UPDATE_SITE', 'site', req.params.siteId, req.body);

    res.json({ message: 'Site updated successfully', site: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/sites/:siteId/teams
// @desc    Assign worker to site
// @access  Private/Admin, Manager, Supervisor
router.post('/sites/:siteId/teams', async (req, res) => {
  try {
    const { worker_id } = req.body;

    const result = await pool.query(
      `INSERT INTO site_teams (site_id, worker_id)
       VALUES ($1, $2)
       ON CONFLICT (site_id, worker_id) DO NOTHING
       RETURNING *`,
      [req.params.siteId, worker_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Worker already assigned to this site' });
    }

    await logAudit(req.user.id, 'ASSIGN_WORKER', 'site_team', result.rows[0].id, { worker_id });

    res.status(201).json({ message: 'Worker assigned successfully', assignment: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/sites/:siteId/teams
// @desc    Get site team members
// @access  Private
router.get('/sites/:siteId/teams', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.*, 
              u.id as worker_id,
              u.username, 
              u.first_name, 
              u.last_name, 
              u.role
       FROM site_teams st
       JOIN users u ON st.worker_id = u.id
       WHERE st.site_id = $1
       ORDER BY st.assigned_at DESC`,
      [req.params.siteId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

