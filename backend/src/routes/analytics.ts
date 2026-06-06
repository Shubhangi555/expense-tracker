import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /analytics/summary — total income, expense, savings
router.get('/summary', async (req: AuthRequest, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_savings
       FROM transactions
       WHERE user_id = $1`,
      [req.user!.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /analytics/monthly — income vs expense per month (for bar chart)
router.get('/monthly', async (req: AuthRequest, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') as month,
        DATE_TRUNC('month', date) as month_date,
        SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
       FROM transactions
       WHERE user_id = $1
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY DATE_TRUNC('month', date)`,
      [req.user!.userId]
    );
    res.json(rows);
    // Returns: [{month:'Jan 2026', income:45000, expense:28000}, ...]
    // Recharts BarChart reads this directly
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /analytics/by-category — spending by category (for pie chart)
router.get('/by-category', async (req: AuthRequest, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        c.name,
        c.icon,
        SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.type = 'expense'
       GROUP BY c.name, c.icon
       ORDER BY total DESC`,
      [req.user!.userId]
    );
    res.json(rows);
    // Returns: [{name:'Food', icon:'🍔', total:8500}, ...]
    // Recharts PieChart reads this directly
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;