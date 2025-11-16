import React, { useEffect } from 'react';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shield, Ban, Coins, Star, Clock } from 'lucide-react';

export const PlayerView: React.FC = () => {
  const { currentPlayer, sessionCode, currentQuiz } = useQuizStore();
  const {
    currentPhase,
    phaseTimeRemaining,
    currentQuestion,
    currentThemeTitle,
    playerInventory,
    activeEffects,
    selectedAnswer,
    hasAnswered,
    executeJokerAction,
    submitAnswer,
    loadQuestions,
    listenToPhaseChanges,
  } = useStrategicQuizStore();

  useEffect(() => {
    console.log('📱 PlayerView initializing...');
    
    if (currentQuiz?.id) {
      console.log('📚 Loading questions for quiz:', currentQuiz.id);
      loadQuestions(currentQuiz.id);
    }
    
    if (sessionCode) {
      console.log('👂 Setting up phase listener for session:', sessionCode);
      listenToPhaseChanges(sessionCode);
    }
  }, [currentQuiz?.id, sessionCode]);

  const handleJokerAction = async (jokerType: 'protection' | 'block' | 'steal' | 'double_points') => {
    try {
      await executeJokerAction(jokerType);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAnswerSelect = async (letter: 'A' | 'B' | 'C' | 'D') => {
    const optionIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
    const answer = currentQuestion?.options?.[optionIndex];
    if (answer) {
      await submitAnswer(answer);
    }
  };

  // Header avec Score (toujours visible)
  const PlayerHeader = () => (
    <div className="sticky top-0 z-50 bg-qb-darker/95 backdrop-blur-lg border-b border-white/10 p-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{currentPlayer?.avatar_emoji}</div>
          <div>
            <div className="text-white font-bold text-xl">{currentPlayer?.player_name}</div>
            <div className="text-qb-cyan text-sm">Session: {sessionCode}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-yellow-400">{currentPlayer?.total_score || 0}</div>
          <div className="text-xs text-white/60">points</div>
        </div>
      </div>
    </div>
  );

  // PHASE 1: Theme + Jokers
  if (currentPhase === 'theme_announcement') {
    const isProtected = activeEffects.protections[currentPlayer?.id || ''];
    const hasDoublePoints = activeEffects.doublePoints[currentPlayer?.id || ''];

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <PlayerHeader />
        
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Timer + Theme */}
          <Card className="p-8 text-center bg-white/10 backdrop-blur-lg border-white/20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-white mb-4">NEXT THEME</h2>
            <div className="text-4xl font-bold text-yellow-300 mb-6">
              {currentThemeTitle || currentQuestion?.stage_id || 'Loading...'}
            </div>
            <div className="flex items-center justify-center gap-3 text-white">
              <Clock className="w-8 h-8 animate-pulse" />
              <span className="text-6xl font-mono font-bold">{phaseTimeRemaining}s</span>
            </div>
          </Card>

          {/* Active Jokers */}
          {(isProtected || hasDoublePoints) && (
            <Card className="p-4 bg-green-500/20 border-2 border-green-400">
              <div className="flex gap-3 justify-center">
                {isProtected && (
                  <div className="px-4 py-2 bg-blue-500/40 rounded-xl flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    <span className="font-bold">Protected</span>
                  </div>
                )}
                {hasDoublePoints && (
                  <div className="px-4 py-2 bg-purple-500/40 rounded-xl flex items-center gap-2">
                    <Star className="w-6 h-6" />
                    <span className="font-bold">×2</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Joker Buttons */}
          <Card className="p-4 bg-white/10 backdrop-blur-lg border-white/20">
            <h3 className="text-white font-bold mb-3 text-center">Activate Joker</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                onClick={() => handleJokerAction('protection')}
                disabled={playerInventory.protection === 0 || isProtected}
                className="h-28 flex-col bg-blue-600 hover:bg-blue-700 disabled:opacity-30"
              >
                <Shield className="w-10 h-10 mb-1" />
                <span className="font-bold">Protection</span>
                <span className="text-xs">{playerInventory.protection === 0 ? 'Used' : 'Available'}</span>
              </Button>

              <Button
                size="lg"
                onClick={() => handleJokerAction('double_points')}
                disabled={playerInventory.double_points === 0 || hasDoublePoints}
                className="h-28 flex-col bg-purple-600 hover:bg-purple-700 disabled:opacity-30"
              >
                <Star className="w-10 h-10 mb-1" />
                <span className="font-bold">Double</span>
                <span className="text-xs">{playerInventory.double_points === 0 ? 'Used' : 'Available'}</span>
              </Button>

              <Button
                size="lg"
                onClick={() => handleJokerAction('block')}
                disabled={playerInventory.block === 0}
                className="h-28 flex-col bg-red-600 hover:bg-red-700 disabled:opacity-30"
              >
                <Ban className="w-10 h-10 mb-1" />
                <span className="font-bold">Block</span>
                <span className="text-xs">{playerInventory.block === 0 ? 'Used' : 'Available'}</span>
              </Button>

              <Button
                size="lg"
                onClick={() => handleJokerAction('steal')}
                disabled={playerInventory.steal === 0}
                className="h-28 flex-col bg-yellow-600 hover:bg-yellow-700 disabled:opacity-30"
              >
                <Coins className="w-10 h-10 mb-1" />
                <span className="font-bold">Steal</span>
                <span className="text-xs">{playerInventory.steal === 0 ? 'Used' : 'Available'}</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // PHASE 2: Question Display (juste attendre)
  if (currentPhase === 'question_display') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500">
        <PlayerHeader />
        <div className="flex items-center justify-center h-[calc(100vh-100px)] p-4">
          <Card className="max-w-2xl w-full p-12 text-center bg-white/10 backdrop-blur-lg">
            <div className="text-8xl mb-6">📖</div>
            <h1 className="text-4xl font-bold text-white mb-6">READ THE QUESTION</h1>
            <p className="text-2xl text-white/80 mb-8">on the big screen!</p>
            <div className="flex items-center justify-center gap-4 text-white">
              <Clock className="w-12 h-12 animate-pulse" />
              <span className="text-7xl font-mono font-bold">{phaseTimeRemaining}s</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // PHASE 3: Answer Selection (A/B/C/D SEULEMENT)
  if (currentPhase === 'answer_selection') {
    const isBlocked = activeEffects.blocks[currentPlayer?.id || ''];

    return (
      <div className="min-h-screen bg-qb-dark">
        <PlayerHeader />
        
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Timer */}
          <Card className="p-6 text-center bg-gradient-to-br from-qb-purple to-qb-cyan">
            <div className="flex items-center justify-center gap-4">
              <Clock className="w-10 h-10 text-white animate-pulse" />
              <span className="text-7xl font-mono font-bold text-white">{phaseTimeRemaining}s</span>
            </div>
          </Card>

          {/* Blocked State */}
          {isBlocked && (
            <Card className="p-8 bg-red-500/20 border-2 border-red-500 text-center">
              <Ban className="w-20 h-20 mx-auto mb-4 text-red-500" />
              <p className="text-3xl font-bold text-red-500">BLOCKED!</p>
              <p className="text-white/80 mt-2">Cannot answer</p>
            </Card>
          )}

          {/* A/B/C/D Buttons ONLY */}
          {!isBlocked && (
            <div className="grid grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((letter) => (
                <Button
                  key={letter}
                  size="xl"
                  onClick={() => handleAnswerSelect(letter as 'A' | 'B' | 'C' | 'D')}
                  disabled={hasAnswered}
                  className={`h-40 text-8xl font-bold ${
                    selectedAnswer === currentQuestion?.options?.[['A', 'B', 'C', 'D'].indexOf(letter)]
                      ? 'bg-qb-cyan border-4 border-white scale-110'
                      : 'bg-qb-darker hover:bg-qb-purple'
                  } disabled:opacity-50`}
                >
                  {letter}
                </Button>
              ))}
            </div>
          )}

          {/* Answer Submitted */}
          {hasAnswered && !isBlocked && (
            <Card className="p-6 bg-green-500/20 border-2 border-green-500 text-center">
              <div className="text-6xl mb-3">✅</div>
              <p className="text-2xl font-bold text-green-400">Answer Submitted!</p>
              <p className="text-white/70 mt-2">Wait for results...</p>
            </Card>
          )}

          {/* Active Effects */}
          <div className="flex gap-3 justify-center flex-wrap">
            {activeEffects.protections[currentPlayer?.id || ''] && (
              <div className="px-4 py-2 bg-blue-500/20 border border-blue-500 rounded-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-bold">Protected</span>
              </div>
            )}
            {activeEffects.doublePoints[currentPlayer?.id || ''] && (
              <div className="px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span className="font-bold">×2 Points</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PHASE 4: Results
  if (currentPhase === 'results') {
    const isCorrect = selectedAnswer === currentQuestion?.correct_answer;
    const basePoints = currentQuestion?.points || 100;
    const isDoubled = activeEffects.doublePoints[currentPlayer?.id || ''];
    const finalPoints = isCorrect ? (isDoubled ? basePoints * 2 : basePoints) : 0;

    return (
      <div className={`min-h-screen ${
        isCorrect 
          ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500' 
          : 'bg-gradient-to-br from-red-500 via-pink-500 to-purple-500'
      }`}>
        <PlayerHeader />
        
        <div className="flex items-center justify-center h-[calc(100vh-100px)] p-4">
          <Card className="max-w-2xl w-full p-12 text-center bg-white/10 backdrop-blur-lg">
            <div className="text-9xl mb-6 animate-bounce">
              {isCorrect ? '✅' : '❌'}
            </div>
            <h1 className="text-6xl font-bold text-white mb-8">
              {isCorrect ? 'CORRECT!' : 'WRONG!'}
            </h1>
            
            <div className="mb-8 p-8 bg-white/10 rounded-2xl">
              <p className="text-3xl text-white/80 mb-3">Points:</p>
              <p className="text-8xl font-bold text-white">+{finalPoints}</p>
              {isDoubled && isCorrect && (
                <p className="text-3xl text-yellow-300 mt-4 font-bold animate-pulse">
                  ⭐ DOUBLED!
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-white/70">
              <Clock className="w-8 h-8" />
              <span className="text-4xl font-mono">{phaseTimeRemaining}s</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // PHASE 5: Intermission
  if (currentPhase === 'intermission') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
        <PlayerHeader />
        <div className="flex items-center justify-center h-[calc(100vh-100px)] p-4">
          <Card className="max-w-2xl w-full p-12 text-center bg-white/5 backdrop-blur-lg">
            <div className="text-8xl mb-6 animate-pulse">⏸️</div>
            <h1 className="text-5xl font-bold text-white mb-6">Get Ready!</h1>
            <p className="text-3xl text-white/70 mb-8">Next question...</p>
            <div className="text-8xl font-mono font-bold text-qb-cyan">
              {phaseTimeRemaining}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark flex items-center justify-center">
      <PlayerHeader />
      <div className="text-center">
        <div className="text-8xl mb-6 animate-pulse">⏳</div>
        <p className="text-white text-2xl">Waiting for quiz to start...</p>
        <p className="text-white/50 text-lg mt-2">Session: {sessionCode}</p>
        <p className="text-white/50 text-sm mt-4">Phase: {currentPhase}</p>
      </div>
    </div>
  );
};
