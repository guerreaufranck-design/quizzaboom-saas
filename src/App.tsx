import { useEffect } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useQuizStore } from './stores/useQuizStore';
import { HomePage } from './pages/HomePage';
import { CreateQuiz } from './pages/CreateQuiz';
import { JoinQuiz } from './pages/JoinQuiz';
import { QuizLobby } from './pages/QuizLobby';
import { PlayerView } from './pages/PlayerView';
import { HostDashboard } from './pages/HostDashboard';

function App() {
  const { initialize } = useAuthStore();
  const { currentView, setCurrentView, isHost } = useQuizStore();

  useEffect(() => {
    initialize();

    // Detect URL parameters on page load
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const view = urlParams.get('view');
    const tvCode = urlParams.get('tv');

    // Priority 1: TV Display
    if (tvCode) {
      // TODO: Set TV display mode
      console.log('TV Display mode:', tvCode);
      return;
    }

    // Priority 2: Join via QR code
    if (code && view === 'join') {
      setCurrentView('join');
      return;
    }

    // Default: stay on current view or home
  }, [initialize, setCurrentView]);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'create':
        return <CreateQuiz />;
      case 'join':
        return <JoinQuiz />;
      case 'lobby':
        return <QuizLobby />;
      case 'playing':
        // Host voit le dashboard, joueurs voient PlayerView
        return isHost ? <HostDashboard /> : <PlayerView />;
      default:
        return <HomePage />;
    }
  };

  return renderView();
}

export default App;
