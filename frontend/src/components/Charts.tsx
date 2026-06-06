import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryData {
  name: string;
  icon: string;
  total: number;
}

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function Charts() {
  // Fetch monthly data for bar chart
  const { data: monthly = [] } = useQuery<MonthlyData[]>({
    queryKey: ['monthly'],
    queryFn: () => api.get('/analytics/monthly').then(r =>
    r.data.map((item: MonthlyData) => ({
        ...item,
        income: Number(item.income),
        expense: Number(item.expense),
    }))
    ),
  });

  // Fetch category data for pie chart
  const { data: byCategory = [] } = useQuery<CategoryData[]>({
    queryKey: ['by-category'],
    queryFn: () => api.get('/analytics/by-category').then(r =>
    r.data.map((item: CategoryData) => ({ ...item, total: Number(item.total) }))
    ),
  });

  // Don't render charts if no data yet
  if (monthly.length === 0 && byCategory.length === 0) {
    return (
      <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>
        Add more transactions to see charts
      </p>
    );
  }

  return (
    <div style={s.container}>
      {/* Bar chart — monthly income vs expense */}
      {monthly.length > 0 && (
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => formatINR(Number(v))} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie chart — spending by category */}
      {byCategory.length > 0 && (
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Spending by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: any) =>
                `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatINR(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  chartCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
    color: '#1a1a1a',
  },
};