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

// GET /api/tables/available — свободные столики на интервал для N гостей
router.get('/available', async (req, res) => {
  const start = new Date(req.query.startsAt);
  const end = new Date(req.query.endsAt);
  const guests = Number(req.query.guests);

  if (isNaN(start) || isNaN(end) || start >= end) {
    return res.status(400).json({ error: 'Invalid dates' });
  }
  if (!Number.isInteger(guests) || guests < 1) {
    return res.status(400).json({ error: 'Invalid guests' });
  }

  const { rows } = await pool.query(`
    SELECT t.id, t.number, t.capacity, t.zone
    FROM tables_in_cafe t
    WHERE t.is_active
      AND t.capacity >= $3
      AND NOT EXISTS (
        SELECT 1
        FROM bookings b
        WHERE b.table_id = t.id
          AND b.status <> 'cancelled'
          AND b.starts_at < $2
          AND b.ends_at > $1
      )
    ORDER BY t.capacity, t.number
  `, [start, end, guests]);

  res.json({ tables: rows });
});

export default router;