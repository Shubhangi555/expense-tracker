import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './db';
import authRouter from './routes/auth'; // import auth routes
import path from 'path';
import transactionRouter from './routes/transactions';
import categoryRouter from './routes/categories';
import analyticsRouter from './routes/analytics';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Auto-run migration on startup
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

// Call it before starting server
runMigration().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json()); // allows reading JSON from req.body
app.use(express.static(path.join(__dirname, '../../'))); // serve static files (like the React build) from the root of the project

app.use('/auth', authRouter); // all routes inside authRouter are prefixed with /auth
                               // so router.post('/register') becomes POST /auth/register
app.use('/transactions', transactionRouter); // ← add
app.use('/categories', categoryRouter); 
app.use('/analytics', analyticsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
