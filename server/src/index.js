import cors from 'cors';
import express from 'express';
import { pool } from './db.js';
import gamesRouter from './routes/games.js';
import genresRouter from './routes/genres.js';
import tablesRouter from './routes/tables.js'
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import bookingsRouter from './routes/bookings.js';

const app = express();

// Разрешаем запросы только с адреса нашего фронтенда
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));

// middleware (читает тело запроса, превращает JSON в объект и кладёт его в req.body) limit защищает от огромных тел
app.use(express.json({ limit: '10kb' }));

// Проверка ответа сервера и базы данных
app.get('/api/health', async (req, res) => {
  const { rows } = await pool.query('SELECT now() AS time');
  res.json({ status: 'ok', dbTime: rows[0].time });
});

app.use('/api/games', gamesRouter);
app.use('/api/genres', genresRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bookings', bookingsRouter);

// Неизвестный адрес 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
//   сломанный JSON
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: 'Bad request' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});