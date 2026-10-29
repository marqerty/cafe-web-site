import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/games каталог игр с условием фильтров
router.get('/', async (req, res) => {
    const conditions = [];
    const values = [];

    // Фильтр по числу игроков
    if (req.query.players !== undefined) {
        const players = Number(req.query.players);
        if (!Number.isInteger(players) || players < 1) {
            return res.status(400).json({ error: 'Invalid players' });
        }
        values.push(players);
        conditions.push(`g.min_players <= $${values.length} AND g.max_players >= $${values.length}`);
    }

    // Фильтр по длительности
    if (req.query.maxTime !== undefined) {
        const maxTime = Number(req.query.maxTime);
        if (!Number.isInteger(maxTime) || maxTime < 1) {
            return res.status(400).json({ error: 'Invalid maxTime' });
        }
        values.push(maxTime);
        conditions.push(`g.play_time_minutes <= $${values.length}`);
    }

    // Поиск по названию
    if (req.query.search) {
        values.push(`%${req.query.search}%`);
        conditions.push(`g.title ILIKE $${values.length}`);
    }

    // Фильтр по жанру
    if (req.query.genre) {
        values.push(req.query.genre);
        conditions.push(`EXISTS (
      SELECT 1
      FROM game_genres gg2
      JOIN genres ge2 ON ge2.id = gg2.genre_id
      WHERE gg2.game_id = g.id AND ge2.name = $${values.length}
    )`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await pool.query(`
    SELECT
      g.id,
      g.title,
      g.min_players,
      g.max_players,
      g.play_time_minutes,
      string_agg(DISTINCT ge.name, ', ') AS genres,
      round(avg(r.rating), 1)::float     AS rating,
      count(DISTINCT r.id)::int          AS reviews_count
    FROM games g
    LEFT JOIN game_genres gg ON gg.game_id = g.id
    LEFT JOIN genres ge      ON ge.id = gg.genre_id
    LEFT JOIN reviews r      ON r.game_id = g.id
    ${where}
    GROUP BY g.id
    ORDER BY rating DESC NULLS LAST, g.title
  `, values);

    res.json({ games: rows });
});

// GET /api/games/:id информация об одной игре
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
