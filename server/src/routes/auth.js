import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Хэш-пустышка: сравниваем с ним, если пользователь не найден,
// чтобы время ответа не выдавало, существует ли email
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

// POST /api/auth/register — регистрация нового пользователя
router.post('/register', async (req, res) => {
  // Берём только нужные поля: role из тела НЕ читаем никогда
  const { email, password, name } = req.body ?? {};

  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({ error: 'Invalid name' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const { rows } = await pool.query(`
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, role
    `, [email.toLowerCase(), passwordHash, name.trim()]);

    res.status(201).json({ user: rows[0] });
  } catch (err) {
    // 23505 — код Postgres «нарушение UNIQUE»: такой email уже есть
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// POST /api/auth/login — вход, выдаёт JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await pool.query(`
    SELECT id, email, name, role, password_hash
    FROM users
    WHERE email = $1
  `, [email.toLowerCase()]);
  const user = rows[0];

  // Сравниваем всегда, даже если пользователя нет
  const passwordOk = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !passwordOk) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { sub: String(user.id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// GET /api/auth/me данные текущего пользователя (нужен токен)
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT id, email, name, role, created_at
    FROM users
    WHERE id = $1
  `, [req.user.id]);

  if (rows.length === 0) {
    return res.status(401).json({ error: 'User no longer exists' });
  }

  res.json({ user: rows[0] });
});

export default router;