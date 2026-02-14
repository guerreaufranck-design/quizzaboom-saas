import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { useQuizStore, setNavigateCallback } from './stores/useQuizStore';
import { HomePage } from './pages/HomePage';
import { Pricing } from './pages/Pricing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { CreateQuiz } from './pages/CreateQuiz';
import { JoinQuiz } from './pages/JoinQuiz';
import { QuizLobby } from './pages/QuizLobby';
import { PlayerView } from './pages/PlayerView';
import { HostDashboard } from './pages/HostDashboard';
import { TVDisplay } from './pages/TVDisplay';
import { ProSignup } from './pages/ProSignup';
import { ProDashboard } from './pages/ProDashboard';
import { SpecialOffer } from './pages/SpecialOffer';
import { Settings } from './pages/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

function PlayRoute() {
  const { isHost } = useQuizStore();
  return isHost ? <HostDashboard /> : <PlayerView />;
}

function App() {
  const { initialize } = useAuthStore();
  const { restoreSession } = useQuizStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Register the navigate callback so the store can trigger route changes
  useEffect(() => {
    setNavigateCallback(navigate);
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      await initialize();

      // Don't restore session on TV display or join pages (new tab context)
      const isTVRoute = window.location.pathname === '/tv';
      const isJoinRoute = window.location.pathname === '/join';
      if (isTVRoute || isJoinRoute) return;

      await restoreSession();

      const code = searchParams.get('code');
      const view = searchParams.get('view');
      if (code && view === 'join') {
        navigate('/join' + window.location.search);
      }
    };

    init();
  }, []);

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<CreateQuiz />} />
      <Route path="/join" element={<JoinQuiz />} />
      <Route path="/lobby" element={<QuizLobby />} />
      <Route path="/play" element={<PlayRoute />} />
      <Route path="/tv" element={<TVDisplay />} />
      <Route path="/pro-signup" element={<ProtectedRoute><ProSignup /></ProtectedRoute>} />
      <Route path="/pro-dashboard" element={<ProtectedRoute><ProDashboard /></ProtectedRoute>} />
      <Route path="/guide" element={<Navigate to="/" replace />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/offer" element={<SpecialOffer />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
