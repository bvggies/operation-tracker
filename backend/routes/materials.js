const express = require('express');
const pool = require('../config/database');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

router.use(protect);

// @route   GET /api/materials
// @desc    Get all materials
// @access  Private
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materials ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/materials
// @desc    Create new material
// @access  Private/Admin, Manager
router.post('/', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, unit, description } = req.body;

    const result = await pool.query(
      `INSERT INTO materials (name, unit, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, unit, description]
    );

    await logAudit(req.user.id, 'CREATE_MATERIAL', 'material', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Material created successfully', material: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/materials/inventory/:siteId
// @desc    Get material inventory for a site
// @access  Private
router.get('/inventory/:siteId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mi.*, m.name as material_name, m.unit
       FROM material_inventory mi
       JOIN materials m ON mi.material_id = m.id
       WHERE mi.site_id = $1
       ORDER BY m.name`,
      [req.params.siteId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/materials/deliveries
// @desc    Record material delivery
// @access  Private/Admin, Manager, Supervisor
router.post('/deliveries', async (req, res) => {
  try {
    const { site_id, material_id, quantity, delivery_date, supplier } = req.body;

    // Record delivery
    const deliveryResult = await pool.query(
      `INSERT INTO material_deliveries (site_id, material_id, quantity, delivery_date, supplier, received_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [site_id, material_id, quantity, delivery_date || new Date().toISOString().split('T')[0], supplier, req.user.id]
    );

    // Update inventory
    await pool.query(
      `INSERT INTO material_inventory (site_id, material_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (site_id, material_id)
       DO UPDATE SET quantity = material_inventory.quantity + $3, updated_at = NOW()`,
      [site_id, material_id, quantity]
    );

    await logAudit(req.user.id, 'RECORD_DELIVERY', 'material_delivery', deliveryResult.rows[0].id, req.body);

    res.status(201).json({ message: 'Delivery recorded successfully', delivery: deliveryResult.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/materials/usage
// @desc    Record material usage
// @access  Private
router.post('/usage', async (req, res) => {
  try {
    const { site_id, material_id, quantity, usage_date, notes } = req.body;

    // Check inventory
    const inventory = await pool.query(
      'SELECT quantity FROM material_inventory WHERE site_id = $1 AND material_id = $2',
      [site_id, material_id]
    );

    if (inventory.rows.length === 0 || parseFloat(inventory.rows[0].quantity) < parseFloat(quantity)) {
      return res.status(400).json({ message: 'Insufficient material in inventory' });
    }

    // Record usage
    const usageResult = await pool.query(
      `INSERT INTO material_usage (site_id, material_id, quantity, used_by, usage_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [site_id, material_id, quantity, req.user.id, usage_date || new Date().toISOString().split('T')[0], notes]
    );

    // Update inventory
    await pool.query(
      `UPDATE material_inventory 
       SET quantity = quantity - $1, updated_at = NOW()
       WHERE site_id = $2 AND material_id = $3`,
      [quantity, site_id, material_id]
    );

    // Check if below threshold
    const updatedInventory = await pool.query(
      'SELECT quantity, min_threshold FROM material_inventory WHERE site_id = $1 AND material_id = $2',
      [site_id, material_id]
    );

    if (updatedInventory.rows.length > 0 && 
        parseFloat(updatedInventory.rows[0].quantity) <= parseFloat(updatedInventory.rows[0].min_threshold)) {
      // Create notification for managers
      const managers = await pool.query(
        "SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true"
      );
      
      const material = await pool.query('SELECT name FROM materials WHERE id = $1', [material_id]);
      const site = await pool.query('SELECT name FROM sites WHERE id = $1', [site_id]);

      for (const manager of managers.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
           VALUES ($1, 'Material Low Stock', $2, 'material', 'material_inventory', $3)`,
          [
            manager.id,
            `Material "${material.rows[0].name}" is running low at site "${site.rows[0].name}"`,
            material_id
          ]
        );
      }
    }

    await logAudit(req.user.id, 'RECORD_USAGE', 'material_usage', usageResult.rows[0].id, req.body);

    res.status(201).json({ message: 'Usage recorded successfully', usage: usageResult.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/materials/requisitions
// @desc    Create material requisition
// @access  Private
router.post('/requisitions', async (req, res) => {
  try {
    const { site_id, material_id, quantity, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO material_requisitions (site_id, material_id, quantity, requested_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [site_id, material_id, quantity, req.user.id, notes]
    );

    // Notify managers
    const managers = await pool.query(
      "SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true"
    );

    const material = await pool.query('SELECT name FROM materials WHERE id = $1', [material_id]);

    for (const manager of managers.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
         VALUES ($1, 'Material Requisition Request', $2, 'material', 'material_requisition', $3)`,
        [
          manager.id,
          `New material requisition request for ${quantity} ${material.rows[0].name}`,
          result.rows[0].id
        ]
      );
    }

    await logAudit(req.user.id, 'CREATE_REQUISITION', 'material_requisition', result.rows[0].id, req.body);

    res.status(201).json({ message: 'Requisition created successfully', requisition: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/materials/requisitions
// @desc    Get material requisitions
// @access  Private
router.get('/requisitions', async (req, res) => {
  try {
    let query = `
      SELECT mr.*, 
             m.name as material_name, m.unit,
             s.name as site_name,
             u1.first_name || ' ' || u1.last_name as requested_by_name,
             u2.first_name || ' ' || u2.last_name as approved_by_name
      FROM material_requisitions mr
      JOIN materials m ON mr.material_id = m.id
      JOIN sites s ON mr.site_id = s.id
      LEFT JOIN users u1 ON mr.requested_by = u1.id
      LEFT JOIN users u2 ON mr.approved_by = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Workers can only see their own requisitions
    if (req.user.role === 'worker') {
      query += ` AND mr.requested_by = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    query += ` ORDER BY mr.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/materials/requisitions/:id
// @desc    Approve/reject material requisition
// @access  Private/Admin, Manager
router.put('/requisitions/:id', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE material_requisitions 
       SET status = $1, 
           approved_by = $2, 
           approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
           notes = COALESCE($3, notes)
       WHERE id = $4
       RETURNING *`,
      [status, req.user.id, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    // Notify requester
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
       VALUES ($1, 'Material Requisition ' || $2, $3, 'material', 'material_requisition', $4)`,
      [
        result.rows[0].requested_by,
        status === 'approved' ? 'Approved' : 'Rejected',
        `Your material requisition has been ${status}`,
        req.params.id
      ]
    );

    await logAudit(req.user.id, `${status.toUpperCase()}_REQUISITION`, 'material_requisition', req.params.id, req.body);

    res.json({ message: `Requisition ${status} successfully`, requisition: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

