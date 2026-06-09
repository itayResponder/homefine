// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import './App.css'
import LandingPage from './pages/LandingPage.tsx';
import HouseholdLayout from './pages/HouseholdLayout.tsx';
import AppPage from './pages/AppPage.tsx';
import HouseholdPage from './pages/HouseholdPage.tsx';
import CalendarPage from './pages/CalendarPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import JoinPage from './pages/JoinPage.tsx';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-root-loading">
        <span className="app-root-logo">
          Home<span>Fine</span>
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
        <Route path="/app/:householdId" element={user ? <HouseholdLayout /> : <Navigate to="/" replace />}>
          <Route index element={<AppPage />} />
          <Route path="home" element={<HouseholdPage />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>
        <Route path="/app" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
