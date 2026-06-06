import { pool } from '../db';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: number;
  amount: number;
  type: 'income' | 'expense';
  note: string;
  date: string;
  category_name?: string;
  icon?: string;
}

// Get all transactions for a user (with category name + icon)
export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { rows } = await pool.query<Transaction>(
    `SELECT t.*, c.name as category_name, c.icon
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1
     ORDER BY t.date DESC`,
    [userId]
  );
  return rows;
}

// Create a new transaction
export async function createTransaction(
  userId: string,
  data: Pick<Transaction, 'amount' | 'type' | 'category_id' | 'note' | 'date'>
): Promise<Transaction> {
  const { rows } = await pool.query<Transaction>(
    `INSERT INTO transactions (user_id, amount, type, category_id, note, date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, data.amount, data.type, data.category_id, data.note, data.date]
  );
  return rows[0];
}

// Delete a transaction (only if it belongs to the user)
export async function deleteTransaction(
  id: string,
  userId: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM transactions
     WHERE id = $1 AND user_id = $2`, // user_id check = ownership protection
    [id, userId]
  );
  return (rowCount ?? 0) > 0; // returns true if deleted, false if not found
}

// Update a transaction (only if it belongs to the user)
export async function updateTransaction(
  id: string,
  userId: string,
  data: Partial<Pick<Transaction, 'amount' | 'type' | 'category_id' | 'note' | 'date'>>
): Promise<Transaction | null> {
  const { rows } = await pool.query<Transaction>(
    `UPDATE transactions
     SET amount = COALESCE($1, amount),       -- COALESCE = use new value if provided, else keep old
         type = COALESCE($2, type),
         category_id = COALESCE($3, category_id),
         note = COALESCE($4, note),
         date = COALESCE($5, date)
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [data.amount, data.type, data.category_id, data.note, data.date, id, userId]
  );
  return rows[0] || null;
}