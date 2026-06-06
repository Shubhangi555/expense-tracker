import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { user } = useAuth();

  // If not logged in → show auth page
  // If logged in → show dashboard (we'll build this next)
  if (!user) return <AuthPage />;
  
  return (
   <Dashboard />
  );
}