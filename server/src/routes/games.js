import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/games — каталог
router.get('/', async (req, res) => {
    const { rows } = await pool.query(`
    SELECT
    g.id,
    g.title,
    g.min_players,
    g.max_players,
    g.play_time_minutes,
    string_agg(DISTINCT ge.name, ', ') AS genres,
    round(avg(r.rating), 1)::float            AS rating,
    count(DISTINCT r.id)::int               AS reviews_count
    FROM games g
    LEFT JOIN game_genres gg ON gg.game_id = g.id
    LEFT JOIN genres ge      ON ge.id = gg.genre_id
    LEFT JOIN reviews r      ON r.game_id = g.id
    GROUP BY g.id
    ORDER BY rating DESC NULLS LAST, g.title;
    `);
    res.json({ games: rows });
});

// GET /api/games/:id — одна игра
router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Invalid game id' });
    }
    const { rows } = await pool.query(`
    SELECT
    g.id,
    g.title,
    g.min_players,
    g.max_players,
    g.play_time_minutes,
    string_agg(DISTINCT ge.name, ', ') AS genres,
    round(avg(r.rating), 1)::float            AS rating,
    count(DISTINCT r.id)::int               AS reviews_count,
    g.description,
    g.image_url
    FROM games g
    LEFT JOIN game_genres gg ON gg.game_id = g.id
    LEFT JOIN genres ge      ON ge.id = gg.genre_id
    LEFT JOIN reviews r      ON r.game_id = g.id
    where g.id = $1
    GROUP BY g.id
    `, [id]);
    // [req.params.id]
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ game: rows[0] });
});

export default router;
