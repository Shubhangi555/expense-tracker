import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import './db';
import { pool } from './db';
import authRouter from './routes/auth';
import transactionRouter from './routes/transactions';
import categoryRouter from './routes/categories';
import analyticsRouter from './routes/analytics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/transactions', transactionRouter);
app.use('/categories', categoryRouter);
app.use('/analytics', analyticsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Auto-run migration then start server
async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/001_init.sql'),
      'utf8'
    );
    await pool.query(sql);
    console.log('✅ Migration complete');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

runMigration().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
