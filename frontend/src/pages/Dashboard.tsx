import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import Charts from '../components/Charts';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category_name: string;
  icon: string;
  note: string;
  date: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  type: 'income' | 'expense';
}

interface Summary {
  total_income: number;
  total_expense: number;
  total_savings: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // ─── Fetch transactions ───────────────────────────────────────────────────
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => api.get('/transactions').then(r => r.data),
  });

  // ─── Fetch summary ────────────────────────────────────────────────────────
  const { data: summary } = useQuery<Summary>({
    queryKey: ['summary'],
    queryFn: () => api.get('/analytics/summary').then(r => r.data),
  });

  // ─── Fetch categories ─────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  // ─── Delete transaction ───────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      // Refetch both transactions and summary after delete
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.logo}>💰 Expense Tracker</h1>
        <div style={s.headerRight}>
          <span style={s.username}>👤 {user?.display_name}</span>
          <button onClick={logout} style={s.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={s.content}>
        {/* Summary cards */}
        <div style={s.cards}>
          <div style={{ ...s.card, borderTop: '4px solid #10b981' }}>
            <p style={s.cardLabel}>Total Income</p>
            <p style={{ ...s.cardValue, color: '#10b981' }}>
              {formatAmount(Number(summary?.total_income ?? 0))}
            </p>
          </div>
          <div style={{ ...s.card, borderTop: '4px solid #ef4444' }}>
            <p style={s.cardLabel}>Total Expenses</p>
            <p style={{ ...s.cardValue, color: '#ef4444' }}>
              {formatAmount(Number(summary?.total_expense ?? 0))}
            </p>
          </div>
          <div style={{ ...s.card, borderTop: '4px solid #6366f1' }}>
            <p style={s.cardLabel}>Savings</p>
            <p style={{ ...s.cardValue, color: '#6366f1' }}>
              {formatAmount(Number(summary?.total_savings ?? 0))}
            </p>
          </div>
        </div>

        <Charts />

        {/* Add transaction button */}
        <div style={s.row}>
          <h2 style={s.sectionTitle}>Transactions</h2>
          <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>

        {/* Add transaction form */}
        {showForm && (
          <AddTransactionForm
            categories={categories}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['summary'] });
            }}
          />
        )}

        {/* Transaction list */}
        {isLoading ? (
          <p style={s.empty}>Loading...</p>
        ) : transactions.length === 0 ? (
          <p style={s.empty}>No transactions yet. Add one above!</p>
        ) : (
          <div style={s.list}>
            {transactions.map(tx => (
              <div key={tx.id} style={s.txRow}>
                <span style={s.txIcon}>{tx.icon}</span>
                <div style={s.txInfo}>
                  <p style={s.txCategory}>{tx.category_name}</p>
                  <p style={s.txNote}>{tx.note || tx.date}</p>
                </div>
                <p style={{
                  ...s.txAmount,
                  color: tx.type === 'income' ? '#10b981' : '#ef4444'
                }}>
                  {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                </p>
                <button
                  onClick={() => deleteMutation.mutate(tx.id)}
                  style={s.deleteBtn}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Transaction Form ─────────────────────────────────────────────────────
function AddTransactionForm({
  categories,
  onSuccess,
}: {
  categories: Category[];
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // today's date
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: object) => api.post('/transactions', data),
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.error || 'Something went wrong'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
      setError('Please fill all required fields');
      return;
    }
    mutation.mutate({ amount: Number(amount), type, category_id: Number(categoryId), note, date });
  };

  // Filter categories by selected type
  const filtered = categories.filter(c => c.type === type);

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <div style={s.formRow}>
        {/* Type toggle */}
        <select style={s.input} value={type} onChange={e => { setType(e.target.value as any); setCategoryId(''); }}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        {/* Amount */}
        <input
          style={s.input}
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />

        {/* Category */}
        <select style={s.input} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
          <option value="">Select category</option>
          {filtered.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        {/* Date */}
        <input
          style={s.input}
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      {/* Note */}
      <input
        style={{ ...s.input, width: '100%' }}
        placeholder="Note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
      />

      {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}

      <button type="submit" style={s.addBtn} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save Transaction'}
      </button>
    </form>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  header: {
    background: '#fff', padding: '16px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  logo: { fontSize: 20, fontWeight: 700 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  username: { fontSize: 14, color: '#666' },
  logoutBtn: {
    background: 'transparent', border: '1px solid #e0e0e0',
    borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13,
  },
  content: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  card: {
    background: '#fff', borderRadius: 12,
    padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardLabel: { fontSize: 13, color: '#888', marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 700 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 600 },
  addBtn: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  form: {
    background: '#fff', borderRadius: 12,
    padding: 20, marginBottom: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  input: {
    padding: '10px 12px', border: '1px solid #e0e0e0',
    borderRadius: 8, fontSize: 14, outline: 'none', width: '100%',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  txRow: {
    background: '#fff', borderRadius: 10,
    padding: '14px 16px', display: 'flex',
    alignItems: 'center', gap: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  txIcon: { fontSize: 24 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 14, fontWeight: 600 },
  txNote: { fontSize: 12, color: '#888', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: 700 },
  deleteBtn: {
    background: 'transparent', border: 'none',
    cursor: 'pointer', fontSize: 16, opacity: 0.5,
  },
  empty: { color: '#888', textAlign: 'center', padding: '40px 0' },
};