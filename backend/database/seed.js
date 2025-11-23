const bcrypt = require('bcryptjs');
const pool = require('../config/database');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Check if admin exists
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (existing.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['admin', 'admin@operations.com', hashedPassword, 'Admin', 'User', 'admin', true]
    );

    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await pool.end();
  }
};

seedAdmin();

