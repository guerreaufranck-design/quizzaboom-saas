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
  const { currentView, setCurrentView, isHost, restoreSession } = useQuizStore();

  useEffect(() => {
    const init = async () => {
      await initialize();
      
      // Try to restore session first
      await restoreSession();

      // Then check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const view = urlParams.get('view');
      const tvCode = urlParams.get('tv');

      if (tvCode) {
        console.log('TV Display mode:', tvCode);
        return;
      }

      if (code && view === 'join') {
        setCurrentView('join');
        return;
      }
    };

    init();
  }, []);

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
        return isHost ? <HostDashboard /> : <PlayerView />;
      default:
        return <HomePage />;
    }
  };

  return renderView();
}

export default App;
