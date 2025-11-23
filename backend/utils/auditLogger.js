const pool = require('../config/database');

const logAudit = async (userId, action, entityType, entityId, details = {}) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

module.exports = { logAudit };

