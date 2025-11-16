import React, { useEffect } from 'react';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shield, Ban, Coins, Star, Clock } from 'lucide-react';

export const PlayerView: React.FC = () => {
  const { currentPlayer, sessionCode, currentQuiz, restoreSession } = useQuizStore();
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
    
    // Restaurer la session si refresh
    restoreSession();
    
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

  const PlayerHeader = () => (
    <div className="sticky top-0 z-50 bg-qb-darker/95 backdrop-blur-lg border-b border-white/10 p-3">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="text-3xl">{currentPlayer?.avatar_emoji}</div>
          <div>
            <div className="text-white font-bold text-lg">{currentPlayer?.player_name}</div>
            <div className="text-qb-cyan text-xs">Session: {sessionCode}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-yellow-400">{currentPlayer?.total_score || 0}</div>
          <div className="text-xs text-white/60">points</div>
        </div>
      </div>
    </div>
  );

  const isProtected = activeEffects.protections[currentPlayer?.id || ''];
  const hasDoublePoints = activeEffects.doublePoints[currentPlayer?.id || ''];
  const isBlocked = activeEffects.blocks[currentPlayer?.id || ''];
  
  // Déterminer si les jokers sont activables
  const jokersEnabled = currentPhase === 'theme_announcement';
  // Déterminer si les réponses sont activables
  const answersEnabled = currentPhase === 'answer_selection' && !isBlocked && !hasAnswered;

  return (
    <div className="min-h-screen bg-qb-dark">
      <PlayerHeader />
      
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Timer + Phase Indicator */}
        <Card className="p-4 text-center bg-gradient-to-br from-qb-purple to-qb-cyan">
          <div className="text-xs text-white/70 mb-1 uppercase tracking-wider">
            {currentPhase === 'theme_announcement' && '🎯 Theme + Jokers'}
            {currentPhase === 'question_display' && '📖 Read Question'}
            {currentPhase === 'answer_selection' && '✍️ Answer Now!'}
            {currentPhase === 'results' && '📊 Results'}
            {currentPhase === 'intermission' && '⏸️ Get Ready'}
          </div>
          {currentPhase === 'theme_announcement' && currentThemeTitle && (
            <div className="text-2xl font-bold text-yellow-300 mb-2">
              {currentThemeTitle}
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-white animate-pulse" />
            <span className="text-6xl font-mono font-bold text-white">{phaseTimeRemaining}s</span>
          </div>
        </Card>

        {/* Active Effects */}
        {(isProtected || hasDoublePoints || isBlocked) && (
          <Card className="p-3 bg-white/10">
            <div className="flex gap-2 justify-center flex-wrap">
              {isProtected && (
                <div className="px-3 py-1 bg-blue-500/40 rounded-lg flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4" />
                  <span className="font-bold">Protected</span>
                </div>
              )}
              {hasDoublePoints && (
                <div className="px-3 py-1 bg-purple-500/40 rounded-lg flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4" />
                  <span className="font-bold">×2 Points</span>
                </div>
              )}
              {isBlocked && (
                <div className="px-3 py-1 bg-red-500/40 rounded-lg flex items-center gap-2 text-sm">
                  <Ban className="w-4 h-4" />
                  <span className="font-bold">Blocked</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Joker Buttons - TOUJOURS VISIBLES */}
        <Card className="p-4 bg-white/10 backdrop-blur-lg border-white/20">
          <h3 className="text-white font-bold mb-3 text-center text-sm">
            Jokers {jokersEnabled ? '(Choose Now!)' : '(Wait for theme)'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() => handleJokerAction('protection')}
              disabled={!jokersEnabled || playerInventory.protection === 0 || isProtected}
              className="h-24 flex-col bg-blue-600 hover:bg-blue-700 disabled:opacity-30"
            >
              <Shield className="w-8 h-8 mb-1" />
              <span className="font-bold text-sm">Protection</span>
              <span className="text-xs">{playerInventory.protection === 0 ? 'Used' : 'Ready'}</span>
            </Button>

            <Button
              size="lg"
              onClick={() => handleJokerAction('double_points')}
              disabled={!jokersEnabled || playerInventory.double_points === 0 || hasDoublePoints}
              className="h-24 flex-col bg-purple-600 hover:bg-purple-700 disabled:opacity-30"
            >
              <Star className="w-8 h-8 mb-1" />
              <span className="font-bold text-sm">Double</span>
              <span className="text-xs">{playerInventory.double_points === 0 ? 'Used' : 'Ready'}</span>
            </Button>

            <Button
              size="lg"
              onClick={() => handleJokerAction('block')}
              disabled={!jokersEnabled || playerInventory.block === 0}
              className="h-24 flex-col bg-red-600 hover:bg-red-700 disabled:opacity-30"
            >
              <Ban className="w-8 h-8 mb-1" />
              <span className="font-bold text-sm">Block</span>
              <span className="text-xs">{playerInventory.block === 0 ? 'Used' : 'Ready'}</span>
            </Button>

            <Button
              size="lg"
              onClick={() => handleJokerAction('steal')}
              disabled={!jokersEnabled || playerInventory.steal === 0}
              className="h-24 flex-col bg-yellow-600 hover:bg-yellow-700 disabled:opacity-30"
            >
              <Coins className="w-8 h-8 mb-1" />
              <span className="font-bold text-sm">Steal</span>
              <span className="text-xs">{playerInventory.steal === 0 ? 'Used' : 'Ready'}</span>
            </Button>
          </div>
        </Card>

        {/* Answer Buttons - TOUJOURS VISIBLES */}
        <Card className="p-4 bg-white/10 backdrop-blur-lg border-white/20">
          <h3 className="text-white font-bold mb-3 text-center text-sm">
            Answers {answersEnabled ? '(Select Now!)' : '(Wait for answer time)'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <Button
                key={letter}
                size="xl"
                onClick={() => handleAnswerSelect(letter as 'A' | 'B' | 'C' | 'D')}
                disabled={!answersEnabled}
                className={`h-32 text-7xl font-bold ${
                  selectedAnswer === currentQuestion?.options?.[['A', 'B', 'C', 'D'].indexOf(letter)]
                    ? 'bg-qb-cyan border-4 border-white scale-105'
                    : 'bg-qb-darker hover:bg-qb-purple'
                } disabled:opacity-30`}
              >
                {letter}
              </Button>
            ))}
          </div>

          {hasAnswered && (
            <div className="mt-4 p-3 bg-green-500/20 border-2 border-green-500 rounded-lg text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-lg font-bold text-green-400">Answer Submitted!</p>
            </div>
          )}
        </Card>

        {/* Results Display */}
        {currentPhase === 'results' && (
          <Card className={`p-8 text-center ${
            selectedAnswer === currentQuestion?.correct_answer
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500'
              : 'bg-gradient-to-br from-red-500/20 to-pink-500/20 border-2 border-red-500'
          }`}>
            <div className="text-8xl mb-4 animate-bounce">
              {selectedAnswer === currentQuestion?.correct_answer ? '✅' : '❌'}
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              {selectedAnswer === currentQuestion?.correct_answer ? 'CORRECT!' : 'WRONG!'}
            </h2>
            <div className="text-6xl font-bold text-yellow-300">
              +{selectedAnswer === currentQuestion?.correct_answer 
                ? (hasDoublePoints ? 200 : 100) 
                : 0}
            </div>
            {hasDoublePoints && selectedAnswer === currentQuestion?.correct_answer && (
              <p className="text-2xl text-yellow-300 mt-3 font-bold animate-pulse">
                ⭐ DOUBLED!
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
