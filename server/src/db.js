import pg from 'pg';

// пул соединений открытых
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});