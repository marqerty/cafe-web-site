import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/genres все жанры играми и их количеством
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      ge.id,
      ge.name,
      count(gg.game_id)::int AS games_count
    FROM genres ge
    LEFT JOIN game_genres gg ON gg.genre_id = ge.id
    GROUP BY ge.id
    ORDER BY ge.name
  `);

  res.json({ genres: rows });
});

export default router;