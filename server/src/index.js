import express from 'express';
import { pool } from './db.js';

const app = express();

// Проверка ответа сервера и базы данных
app.get('/api/health', async (req, res) => {
  const { rows } = await pool.query('SELECT now() AS time');
  res.json({ status: 'ok', dbTime: rows[0].time });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});