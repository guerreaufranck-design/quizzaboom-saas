import { useEffect } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useQuizStore } from './stores/useQuizStore';
import { HomePage } from './pages/HomePage';
import { Pricing } from './pages/Pricing';
import { CreateQuiz } from './pages/CreateQuiz';
import { JoinQuiz } from './pages/JoinQuiz';
import { QuizLobby } from './pages/QuizLobby';
import { PlayerView } from './pages/PlayerView';
import { HostDashboard } from './pages/HostDashboard';
import { TVDisplay } from './pages/TVDisplay';

function App() {
  const { initialize } = useAuthStore();
  const { currentView, setCurrentView, isHost, restoreSession } = useQuizStore();

  useEffect(() => {
    const init = async () => {
      await initialize();
      
      const urlParams = new URLSearchParams(window.location.search);
      const tvCode = urlParams.get('tv');
      const code = urlParams.get('code');
      const view = urlParams.get('view');

      // TV Display mode (for Chromecast)
      if (tvCode) {
        return; // TVDisplay component handles its own routing
      }

      // Try to restore session
      await restoreSession();

      // Direct join link
      if (code && view === 'join') {
        setCurrentView('join');
        return;
      }
    };

    init();
  }, []);

  // Check if TV mode
  const urlParams = new URLSearchParams(window.location.search);
  const tvCode = urlParams.get('tv');
  if (tvCode) {
    return <TVDisplay />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'pricing':
        return <Pricing />;
      case 'create':
        return <CreateQuiz />;
      case 'join':
        return <JoinQuiz />;
      case 'lobby':
        return <QuizLobby />;
      case 'playing':
        return isHost ? <HostDashboard /> : <PlayerView />;
      default:
        return <HomePage />;
    }
  };

  return renderView();
}

export default App;
