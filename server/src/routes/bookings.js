import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Все маршруты броней — только для вошедших пользователей
router.use(requireAuth);

const HOUR = 60 * 60 * 1000; // час в миллисекундах

// GET /api/bookings/my — мои брони, ближайшие сверху
router.get('/my', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      b.id,
      t.number AS table_number,
      t.zone,
      b.starts_at,
      b.ends_at,
      b.guests,
      b.status,
      b.created_at
    FROM bookings b
    JOIN tables_in_cafe t ON t.id = b.table_id
    WHERE b.user_id = $1
    ORDER BY b.starts_at
  `, [req.user.id]);

  res.json({ bookings: rows });
});

// POST /api/bookings — создать бронь
router.post('/', async (req, res) => {
  const { tableId, startsAt, endsAt, guests } = req.body ?? {};
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (!Number.isInteger(tableId) || tableId < 1) {
    return res.status(400).json({ error: 'Invalid tableId' });
  }
  if (!Number.isInteger(guests) || guests < 1) {
    return res.status(400).json({ error: 'Invalid guests' });
  }
  if (typeof startsAt !== 'string' || typeof endsAt !== 'string' || isNaN(start) || isNaN(end)) {
    return res.status(400).json({ error: 'Invalid dates' });
  }
  if (start <= new Date()) {
    return res.status(400).json({ error: 'Booking must be in the future' });
  }
  const duration = end - start;
  if (duration < HOUR || duration > 6 * HOUR) {
    return res.status(400).json({ error: 'Booking must last from 1 to 6 hours' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Блокируем строку столика до конца транзакции
    const tableResult = await client.query(`
      SELECT capacity, is_active
      FROM tables_in_cafe
      WHERE id = $1
      FOR UPDATE
    `, [tableId]);
    const table = tableResult.rows[0];

    if (!table || !table.is_active) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Table not found' });
    }
    if (guests > table.capacity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Too many guests for this table' });
    }

    // Есть ли пересекающаяся неотменённая бронь
    const conflict = await client.query(`
      SELECT 1
      FROM bookings
      WHERE table_id = $1
        AND status <> 'cancelled'
        AND starts_at < $3
        AND ends_at > $2
      LIMIT 1
    `, [tableId, start, end]);

    if (conflict.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Table is already booked for this time' });
    }

    const { rows } = await client.query(`
      INSERT INTO bookings (user_id, table_id, starts_at, ends_at, guests)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, table_id, starts_at, ends_at, guests, status, created_at
    `, [req.user.id, tableId, start, end, guests]);

    await client.query('COMMIT');
    res.status(201).json({ booking: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /api/bookings/:id/cancel — отменить СВОЮ будущую бронь
router.patch('/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid booking id' });
  }

  const { rows } = await pool.query(`
    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = $1
      AND user_id = $2
      AND status <> 'cancelled'
      AND starts_at > now()
    RETURNING id, status
  `, [id, req.user.id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json({ booking: rows[0] });
});


export default router;