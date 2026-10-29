import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/tables активные столики
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT id, number, capacity, zone
    FROM tables_in_cafe
    WHERE is_active
    ORDER BY number
  `);
  res.json({ tables: rows });
});

export default router;