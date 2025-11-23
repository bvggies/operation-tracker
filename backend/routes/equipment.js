const express = require('express');
const pool = require('../config/database');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

router.use(protect);

// @route   GET /api/equipment
// @desc    Get all equipment
// @access  Private
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/equipment
// @desc    Create new equipment
// @access  Private/Admin, Manager
router.post('/', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, type, model, serial_number, status } = req.body;

    const result = await pool.query(
      `INSERT INTO equipment (name, type, model, serial_number, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, type, model, serial_number, status || 'available']
    );

    await logAudit(req.user.id, 'CREATE_EQUIPMENT', 'equipment', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Equipment created successfully', equipment: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Private/Admin, Manager
router.put('/:id', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, type, model, serial_number, status } = req.body;

    const result = await pool.query(
      `UPDATE equipment 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           model = COALESCE($3, model),
           serial_number = COALESCE($4, serial_number),
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING *`,
      [name, type, model, serial_number, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    await logAudit(req.user.id, 'UPDATE_EQUIPMENT', 'equipment', req.params.id, req.body);

    res.json({ message: 'Equipment updated successfully', equipment: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/equipment/assign
// @desc    Assign equipment to site
// @access  Private/Admin, Manager, Supervisor
router.post('/assign', async (req, res) => {
  try {
    const { equipment_id, site_id, assigned_to, notes } = req.body;

    // Check if equipment is available
    const equipment = await pool.query('SELECT status FROM equipment WHERE id = $1', [equipment_id]);
    if (equipment.rows.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (equipment.rows[0].status !== 'available') {
      return res.status(400).json({ message: 'Equipment is not available' });
    }

    // Create assignment
    const result = await pool.query(
      `INSERT INTO equipment_assignments (equipment_id, site_id, assigned_to, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [equipment_id, site_id, assigned_to, notes]
    );

    // Update equipment status
    await pool.query('UPDATE equipment SET status = $1 WHERE id = $2', ['in_use', equipment_id]);

    await logAudit(req.user.id, 'ASSIGN_EQUIPMENT', 'equipment_assignment', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Equipment assigned successfully', assignment: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/equipment/return/:assignmentId
// @desc    Return equipment
// @access  Private
router.post('/return/:assignmentId', async (req, res) => {
  try {
    const assignment = await pool.query(
      'SELECT equipment_id FROM equipment_assignments WHERE id = $1 AND returned_at IS NULL',
      [req.params.assignmentId]
    );

    if (assignment.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or already returned' });
    }

    // Update assignment
    await pool.query(
      'UPDATE equipment_assignments SET returned_at = NOW() WHERE id = $1',
      [req.params.assignmentId]
    );

    // Update equipment status
    await pool.query(
      'UPDATE equipment SET status = $1 WHERE id = $2',
      ['available', assignment.rows[0].equipment_id]
    );

    await logAudit(req.user.id, 'RETURN_EQUIPMENT', 'equipment_assignment', req.params.assignmentId);

    res.json({ message: 'Equipment returned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/equipment/maintenance
// @desc    Schedule equipment maintenance
// @access  Private/Admin, Manager, Supervisor
router.post('/maintenance', async (req, res) => {
  try {
    const { equipment_id, maintenance_type, scheduled_date, description, cost } = req.body;

    const result = await pool.query(
      `INSERT INTO equipment_maintenance (equipment_id, maintenance_type, scheduled_date, description, cost, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled')
       RETURNING *`,
      [equipment_id, maintenance_type, scheduled_date, description, cost]
    );

    // Update equipment status if needed
    if (maintenance_type === 'repair') {
      await pool.query('UPDATE equipment SET status = $1 WHERE id = $2', ['maintenance', equipment_id]);
    }

    // Notify managers
    const managers = await pool.query(
      "SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true"
    );

    const equipment = await pool.query('SELECT name FROM equipment WHERE id = $1', [equipment_id]);

    for (const manager of managers.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
         VALUES ($1, 'Equipment Maintenance Scheduled', $2, 'equipment', 'equipment_maintenance', $3)`,
        [
          manager.id,
          `Maintenance scheduled for ${equipment.rows[0].name} on ${scheduled_date}`,
          result.rows[0].id
        ]
      );
    }

    await logAudit(req.user.id, 'SCHEDULE_MAINTENANCE', 'equipment_maintenance', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Maintenance scheduled successfully', maintenance: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/equipment/maintenance
// @desc    Get maintenance records
// @access  Private
router.get('/maintenance', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT em.*, 
              e.name as equipment_name,
              u.first_name || ' ' || u.last_name as performed_by_name
       FROM equipment_maintenance em
       JOIN equipment e ON em.equipment_id = e.id
       LEFT JOIN users u ON em.performed_by = u.id
       ORDER BY em.scheduled_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/equipment/maintenance/:id
// @desc    Update maintenance status
// @access  Private/Admin, Manager
router.put('/maintenance/:id', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, completed_date, performed_by, cost } = req.body;

    const result = await pool.query(
      `UPDATE equipment_maintenance 
       SET status = COALESCE($1, status),
           completed_date = COALESCE($2, completed_date),
           performed_by = COALESCE($3, performed_by),
           cost = COALESCE($4, cost)
       WHERE id = $5
       RETURNING *`,
      [status, completed_date, performed_by, cost, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // If completed, update equipment status
    if (status === 'completed') {
      const maintenance = result.rows[0];
      await pool.query('UPDATE equipment SET status = $1 WHERE id = $2', ['available', maintenance.equipment_id]);
    }

    await logAudit(req.user.id, 'UPDATE_MAINTENANCE', 'equipment_maintenance', req.params.id, req.body);

    res.json({ message: 'Maintenance updated successfully', maintenance: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/equipment/breakdowns
// @desc    Report equipment breakdown
// @access  Private
router.post('/breakdowns', async (req, res) => {
  try {
    const { equipment_id, site_id, description } = req.body;

    const result = await pool.query(
      `INSERT INTO equipment_breakdowns (equipment_id, site_id, reported_by, description, status)
       VALUES ($1, $2, $3, $4, 'reported')
       RETURNING *`,
      [equipment_id, site_id, req.user.id, description]
    );

    // Update equipment status
    await pool.query('UPDATE equipment SET status = $1 WHERE id = $2', ['broken', equipment_id]);

    // Notify managers
    const managers = await pool.query(
      "SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true"
    );

    const equipment = await pool.query('SELECT name FROM equipment WHERE id = $1', [equipment_id]);
    const site = await pool.query('SELECT name FROM sites WHERE id = $1', [site_id]);

    for (const manager of managers.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
         VALUES ($1, 'Equipment Breakdown Reported', $2, 'equipment', 'equipment_breakdown', $3)`,
        [
          manager.id,
          `Equipment "${equipment.rows[0].name}" has broken down at site "${site.rows[0].name}"`,
          result.rows[0].id
        ]
      );
    }

    await logAudit(req.user.id, 'REPORT_BREAKDOWN', 'equipment_breakdown', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Breakdown reported successfully', breakdown: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/equipment/breakdowns
// @desc    Get equipment breakdowns
// @access  Private
router.get('/breakdowns', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT eb.*, 
              e.name as equipment_name,
              s.name as site_name,
              u.first_name || ' ' || u.last_name as reported_by_name
       FROM equipment_breakdowns eb
       JOIN equipment e ON eb.equipment_id = e.id
       JOIN sites s ON eb.site_id = s.id
       LEFT JOIN users u ON eb.reported_by = u.id
       ORDER BY eb.reported_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

