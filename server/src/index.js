import express from 'express';
import { pool } from './db.js';
import gamesRouter from './routes/games.js';

const app = express();


// Проверка ответа сервера и базы данных
app.get('/api/health', async (req, res) => {
  const { rows } = await pool.query('SELECT now() AS time');
  res.json({ status: 'ok', dbTime: rows[0].time });
});

app.use('/api/games', gamesRouter);

// Неизвестный адрес 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Любая ошибка в маршрутах 500 без подробностей для пользователя
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});