const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

router.use(protect);

// Configure multer for file uploads
// Note: On Vercel, use /tmp directory as it's the only writable location
const getUploadDir = () => {
  if (process.env.VERCEL) {
    return '/tmp/uploads';
  }
  return path.join(__dirname, '../uploads');
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// @route   POST /api/documents/upload
// @desc    Upload document
// @access  Private
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { site_id, project_id, document_type, description } = req.body;

    // On Vercel, files are temporary - store file data or use cloud storage
    // For now, we'll store the file path but note it's temporary on Vercel
    const filePath = process.env.VERCEL 
      ? `/tmp/uploads/${req.file.filename}` 
      : `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO documents (site_id, project_id, name, file_path, file_type, file_size, document_type, uploaded_by, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        site_id || null,
        project_id || null,
        req.file.originalname,
        filePath,
        req.file.mimetype,
        req.file.size,
        document_type || 'other',
        req.user.id,
        description
      ]
    );

    await logAudit(req.user.id, 'UPLOAD_DOCUMENT', 'document', result.rows[0].id, {
      filename: req.file.originalname,
      document_type
    });

    res.status(201).json({ message: 'Document uploaded successfully', document: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents
// @desc    Get documents
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT d.*, 
             u.first_name || ' ' || u.last_name as uploaded_by_name,
             s.name as site_name,
             p.name as project_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN sites s ON d.site_id = s.id
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (req.query.site_id) {
      query += ` AND d.site_id = $${paramCount}`;
      params.push(req.query.site_id);
      paramCount++;
    }

    if (req.query.project_id) {
      query += ` AND d.project_id = $${paramCount}`;
      params.push(req.query.project_id);
      paramCount++;
    }

    if (req.query.document_type) {
      query += ` AND d.document_type = $${paramCount}`;
      params.push(req.query.document_type);
      paramCount++;
    }

    query += ` ORDER BY d.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private/Admin, Manager
router.delete('/:id', async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const doc = await pool.query('SELECT file_path FROM documents WHERE id = $1', [req.params.id]);

    if (doc.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', doc.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);

    await logAudit(req.user.id, 'DELETE_DOCUMENT', 'document', req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

