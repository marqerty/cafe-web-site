import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Все маршруты ниже — только для вошедшего админа
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users — список пользователей
router.get('/users', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT id, email, name, role, created_at
    FROM users
    ORDER BY id
  `);
  res.json({ users: rows });
});

export default router;