import React, { useEffect } from 'react';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AnswerOption } from '../components/ui/AnswerOption';
import { Shield, Ban, Coins, Star, Clock, Zap } from 'lucide-react';

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
    if (currentQuiz?.id) {
      loadQuestions(currentQuiz.id);
    }
    if (sessionCode) {
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

  const handleAnswerSelect = async (answer: string) => {
    await submitAnswer(answer);
  };

  // PHASE 1: Theme Announcement + Joker Selection (25s)
  if (currentPhase === 'theme_announcement') {
    const isProtected = activeEffects.protections[currentPlayer?.id || ''];
    const hasDoublePoints = activeEffects.doublePoints[currentPlayer?.id || ''];

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full space-y-6">
          {/* Theme Display */}
          <Card className="p-12 text-center bg-white/10 backdrop-blur-lg border-white/20">
            <div className="text-7xl mb-6 animate-bounce">🎯</div>
            <h1 className="text-5xl font-bold text-white mb-4">NEXT THEME</h1>
            <div className="text-4xl font-bold text-yellow-300 mb-6">
              {currentThemeTitle || currentQuestion?.stage_id || 'Loading...'}
            </div>
            <div className="flex items-center justify-center gap-4 text-white/80">
              <Clock className="w-8 h-8 animate-pulse" />
              <span className="text-5xl font-mono font-bold">{phaseTimeRemaining}s</span>
            </div>
            <p className="text-xl text-white/70 mt-6">
              💡 Decide now if you want to use a joker!
            </p>
          </Card>

          {/* Active Effects */}
          {(isProtected || hasDoublePoints) && (
            <Card className="p-6 bg-green-500/20 border-2 border-green-400">
              <h3 className="text-xl font-bold text-white mb-3 text-center">✅ Jokers Activated!</h3>
              <div className="flex gap-4 justify-center flex-wrap">
                {isProtected && (
                  <div className="px-6 py-3 bg-blue-500/40 rounded-xl border-2 border-blue-300">
                    <Shield className="w-8 h-8 text-white mx-auto mb-2" />
                    <span className="font-bold text-white">Protected</span>
                  </div>
                )}
                {hasDoublePoints && (
                  <div className="px-6 py-3 bg-purple-500/40 rounded-xl border-2 border-purple-300">
                    <Star className="w-8 h-8 text-white mx-auto mb-2" />
                    <span className="font-bold text-white">Double Points</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Joker Selection */}
          <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              Choose Your Joker (1 per quiz)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="xl"
                onClick={() => handleJokerAction('protection')}
                disabled={playerInventory.protection === 0 || isProtected}
                className="h-32 flex-col bg-blue-600 hover:bg-blue-700 disabled:opacity-30"
              >
                <Shield className="w-12 h-12 mb-2" />
                <span className="text-lg font-bold">Protection</span>
                <span className="text-xs mt-1">Immunity from attacks</span>
                <span className="text-sm mt-2 font-bold">
                  {playerInventory.protection === 0 ? '❌ Used' : '✅ Available'}
                </span>
              </Button>

              <Button
                size="xl"
                onClick={() => handleJokerAction('double_points')}
                disabled={playerInventory.double_points === 0 || hasDoublePoints}
                className="h-32 flex-col bg-purple-600 hover:bg-purple-700 disabled:opacity-30"
              >
                <Star className="w-12 h-12 mb-2" />
                <span className="text-lg font-bold">Double Points</span>
                <span className="text-xs mt-1">×2 score this question</span>
                <span className="text-sm mt-2 font-bold">
                  {playerInventory.double_points === 0 ? '❌ Used' : '✅ Available'}
                </span>
              </Button>

              <Button
                size="xl"
                onClick={() => handleJokerAction('block')}
                disabled={playerInventory.block === 0}
                className="h-32 flex-col bg-red-600 hover:bg-red-700 disabled:opacity-30"
              >
                <Ban className="w-12 h-12 mb-2" />
                <span className="text-lg font-bold">Block</span>
                <span className="text-xs mt-1">Block an opponent</span>
                <span className="text-sm mt-2 font-bold">
                  {playerInventory.block === 0 ? '❌ Used' : '✅ Available'}
                </span>
              </Button>

              <Button
                size="xl"
                onClick={() => handleJokerAction('steal')}
                disabled={playerInventory.steal === 0}
                className="h-32 flex-col bg-yellow-600 hover:bg-yellow-700 disabled:opacity-30"
              >
                <Coins className="w-12 h-12 mb-2" />
                <span className="text-lg font-bold">Steal</span>
                <span className="text-xs mt-1">Steal opponent's points</span>
                <span className="text-sm mt-2 font-bold">
                  {playerInventory.steal === 0 ? '❌ Used' : '✅ Available'}
                </span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // PHASE 2: Question Display Only (15s)
  if (currentPhase === 'question_display') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 p-4 flex items-center justify-center">
        <Card className="max-w-4xl w-full p-12 text-center bg-white/10 backdrop-blur-lg border-white/20">
          <div className="text-7xl mb-6">📖</div>
          <h1 className="text-4xl font-bold text-white mb-8">READ THE QUESTION</h1>
          
          <div className="bg-white/20 rounded-2xl p-8 mb-8">
            <p className="text-3xl font-bold text-white leading-relaxed">
              {currentQuestion?.question_text || 'Loading...'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-white">
            <Clock className="w-10 h-10 animate-pulse" />
            <span className="text-6xl font-mono font-bold">{phaseTimeRemaining}s</span>
          </div>

          <p className="text-xl text-white/80 mt-6">
            💭 Think about your answer...
          </p>
        </Card>
      </div>
    );
  }

  // PHASE 3: Answer Selection (20s)
  if (currentPhase === 'answer_selection') {
    const isBlocked = activeEffects.blocks[currentPlayer?.id || ''];

    return (
      <div className="min-h-screen bg-qb-dark p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full space-y-6">
          {/* Timer */}
          <Card gradient className="p-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <Clock className="w-8 h-8 text-qb-cyan animate-pulse" />
              <span className="text-5xl font-mono font-bold text-white">
                {phaseTimeRemaining}s
              </span>
            </div>
          </Card>

          {/* Question + Answers */}
          <Card gradient className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                {currentQuestion?.question_text}
              </h2>
              <div className="text-sm text-white/70">
                {currentQuestion?.points || 100} points • Choose your answer!
              </div>
            </div>

            {/* Blocked Warning */}
            {isBlocked && (
              <div className="mb-6 p-6 bg-red-500/20 border-2 border-red-500 rounded-xl text-center animate-pulse">
                <Ban className="w-16 h-16 mx-auto mb-3 text-red-500" />
                <p className="text-2xl font-bold text-red-500">
                  🚫 YOU'VE BEEN BLOCKED!
                </p>
                <p className="text-white/80 mt-2">Cannot answer this question</p>
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion?.options?.map((option, index) => (
                <AnswerOption
                  key={index}
                  letter={['A', 'B', 'C', 'D'][index] as 'A' | 'B' | 'C' | 'D'}
                  text={option}
                  selected={selectedAnswer === option}
                  disabled={isBlocked || hasAnswered}
                  onClick={() => handleAnswerSelect(option)}
                />
              ))}
            </div>

            {/* Active Effects */}
            <div className="mt-6 flex gap-4 justify-center flex-wrap">
              {activeEffects.protections[currentPlayer?.id || ''] && (
                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-500 inline mr-2" />
                  <span className="text-white font-bold">Protected</span>
                </div>
              )}
              {activeEffects.doublePoints[currentPlayer?.id || ''] && (
                <div className="px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg">
                  <Star className="w-5 h-5 text-purple-500 inline mr-2" />
                  <span className="text-white font-bold">Double Points!</span>
                </div>
              )}
            </div>

            {/* Confirmation */}
            {hasAnswered && !isBlocked && (
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-center">
                <p className="text-green-400 font-bold text-xl">✅ Answer Submitted!</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // PHASE 4: Results (20s)
  if (currentPhase === 'results') {
    const isCorrect = selectedAnswer === currentQuestion?.correct_answer;
    const basePoints = currentQuestion?.points || 100;
    const isDoubled = activeEffects.doublePoints[currentPlayer?.id || ''];
    const finalPoints = isCorrect ? (isDoubled ? basePoints * 2 : basePoints) : 0;

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isCorrect 
          ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500' 
          : 'bg-gradient-to-br from-red-500 via-pink-500 to-purple-500'
      }`}>
        <Card className="max-w-2xl w-full p-12 text-center bg-white/10 backdrop-blur-lg border-white/20">
          <div className="text-9xl mb-6 animate-bounce">
            {isCorrect ? '✅' : '❌'}
          </div>
          <h1 className="text-6xl font-bold text-white mb-8">
            {isCorrect ? 'CORRECT!' : 'WRONG!'}
          </h1>
          
          {/* Points */}
          <div className="mb-8 p-6 bg-white/10 rounded-2xl">
            <p className="text-2xl text-white/80 mb-2">Points Earned:</p>
            <p className="text-7xl font-bold text-white">+{finalPoints}</p>
            {isDoubled && isCorrect && (
              <p className="text-2xl text-yellow-300 mt-3 font-bold animate-pulse">
                ⭐ DOUBLE POINTS! (×2)
              </p>
            )}
          </div>

          {/* Explanation */}
          {currentQuestion && (
            <div className="p-6 bg-white/10 rounded-xl space-y-4 text-left">
              <div>
                <p className="text-lg text-white/90">
                  <span className="font-bold">✓ Correct Answer:</span>{' '}
                  {currentQuestion.correct_answer}
                </p>
              </div>
              {currentQuestion.explanation && (
                <div className="text-white/80 text-sm">
                  <strong>📝 Explanation:</strong> {currentQuestion.explanation}
                </div>
              )}
              {currentQuestion.fun_fact && (
                <div className="text-sm text-yellow-200 bg-white/10 p-3 rounded-lg">
                  💡 <strong>Fun Fact:</strong> {currentQuestion.fun_fact}
                </div>
              )}
            </div>
          )}

          {/* Timer */}
          <div className="mt-8 flex items-center justify-center gap-3 text-white/70">
            <Clock className="w-6 h-6" />
            <span className="text-2xl font-mono">{phaseTimeRemaining}s</span>
          </div>
        </Card>
      </div>
    );
  }

  // PHASE 5: Intermission (6s)
  if (currentPhase === 'intermission') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-12 text-center bg-white/5 backdrop-blur-lg border-white/10">
          <div className="text-7xl mb-6 animate-pulse">⏸️</div>
          <h1 className="text-5xl font-bold text-white mb-6">Get Ready!</h1>
          <p className="text-2xl text-white/70 mb-8">
            Next question coming up...
          </p>
          <div className="text-6xl font-mono font-bold text-qb-cyan">
            {phaseTimeRemaining}
          </div>
        </Card>
      </div>
    );
  }

  // Default
  return (
    <div className="min-h-screen bg-qb-dark flex items-center justify-center">
      <p className="text-white text-2xl">Waiting...</p>
    </div>
  );
};
