import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '../models/transaction';

const router = Router();
router.use(authMiddleware); // protect ALL routes below — no token = blocked

// GET /transactions — get all transactions for logged in user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const data = await getTransactions(req.user!.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /transactions — add a new transaction
router.post('/', async (req: AuthRequest, res) => {
  const { amount, type, category_id, note, date } = req.body;

  // Basic validation
  if (!amount || !type || !category_id || !date) {
    return res.status(400).json({ error: 'amount, type, category_id and date are required' });
  }

  try {
    const tx = await createTransaction(req.user!.userId, {
      amount,
      type,
      category_id,
      note,
      date,
    });
    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT /transactions/:id — update a transaction
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const tx = await updateTransaction(req.params['id'] as string, req.user!.userId, req.body);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// DELETE /transactions/:id — delete a transaction
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const deleted = await deleteTransaction(req.params['id'] as string, req.user!.userId);
    if (!deleted) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;