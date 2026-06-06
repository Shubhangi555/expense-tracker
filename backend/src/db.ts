import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// Test connection on startup
pool.query('SELECT NOW()', (err) => {
  if (err) console.error('❌ Database connection failed:', err.message);
  else console.log('✅ Database connected');
});