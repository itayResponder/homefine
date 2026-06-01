// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage.tsx';
import AppPage from './pages/AppPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import JoinPage from './pages/JoinPage.tsx';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', opacity: 0.6 }}>
          Home<span style={{ color: '#2563EB' }}>Fine</span>
        </span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/" replace />} />
        <Route path="/join/:householdId" element={<JoinPage />} />
        <Route path="/app/:householdId" element={user ? <AppPage /> : <Navigate to="/" replace />} />
        <Route path="/app" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;