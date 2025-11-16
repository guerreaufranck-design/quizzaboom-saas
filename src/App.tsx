import { useEffect } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useQuizStore } from './stores/useQuizStore';
import { HomePage } from './pages/HomePage';
import { CreateQuiz } from './pages/CreateQuiz';
import { JoinQuiz } from './pages/JoinQuiz';
import { QuizLobby } from './pages/QuizLobby';

function App() {
  const { initialize } = useAuthStore();
  const { currentView, setCurrentView } = useQuizStore();

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
        return (
          <div className="min-h-screen bg-qb-dark flex items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white">Playing Quiz</h1>
              <p className="text-xl text-white/70">Coming Soon...</p>
            </div>
          </div>
        );
      default:
        return <HomePage />;
    }
  };

  return renderView();
}

export default App;
