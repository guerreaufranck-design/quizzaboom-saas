import React, { useEffect } from 'react';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AnswerOption } from '../components/ui/AnswerOption';
import { Shield, Ban, Coins, Star, Clock } from 'lucide-react';

export const PlayerView: React.FC = () => {
  const { currentPlayer, sessionCode, currentQuiz } = useQuizStore();
  const {
    currentPhase,
    phaseTimeRemaining,
    currentQuestion,
    currentStage,
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
    // Load questions
    if (currentQuiz?.id) {
      loadQuestions(currentQuiz.id);
    }

    // Listen to phase changes
    if (sessionCode) {
      listenToPhaseChanges(sessionCode);
    }
  }, [currentQuiz?.id, sessionCode]);

  const handleJokerAction = async (jokerType: 'protection' | 'block' | 'steal' | 'double_points') => {
    if (!playerInventory) return;
    
    try {
      await executeJokerAction(jokerType);
    } catch (error) {
      console.error('Failed to execute joker:', error);
      alert(error);
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    await submitAnswer(answer);
  };

  // Phase 1: Announcement
  if (currentPhase === 'announcement') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-12 text-center bg-white/10 backdrop-blur-lg border-white/20">
          <div className="text-8xl mb-6 animate-bounce">📢</div>
          <h1 className="text-5xl font-bold text-white mb-6">NEXT QUESTION</h1>
          <div className="text-3xl font-bold text-white/90 mb-8">
            Stage {currentStage + 1}: {currentQuestion?.stage_id || 'Loading...'}
          </div>
          <div className="flex items-center justify-center gap-3 text-white/80 mb-6">
            <Clock className="w-8 h-8" />
            <span className="text-4xl font-mono font-bold">{phaseTimeRemaining}s</span>
          </div>
          <p className="text-xl text-white/70">
            Prepare your strategy...
          </p>
        </Card>
      </div>
    );
  }

  // Phase 2: Jokers
  if (currentPhase === 'jokers') {
    const isProtected = activeEffects.protections[currentPlayer?.id || ''];
    const hasDoublePoints = activeEffects.doublePoints[currentPlayer?.id || ''];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4 flex items-center justify-center">
        <div className="max-w-4xl w-full space-y-6">
          <Card className="p-8 text-center bg-white/10 backdrop-blur-lg border-white/20">
            <div className="text-6xl mb-4 animate-pulse">⚡</div>
            <h1 className="text-4xl font-bold text-white mb-4">JOKER PHASE</h1>
            <div className="flex items-center justify-center gap-3 text-white">
              <Clock className="w-6 h-6" />
              <span className="text-3xl font-mono font-bold">{phaseTimeRemaining}s</span>
            </div>
          </Card>

          {/* Active Effects */}
          {(isProtected || hasDoublePoints) && (
            <Card className="p-6 bg-green-500/20 border-2 border-green-500">
              <h3 className="text-xl font-bold text-white mb-3 text-center">🎯 Active Effects:</h3>
              <div className="flex gap-4 justify-center flex-wrap">
                {isProtected && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/30 rounded-lg border border-blue-400">
                    <Shield className="w-6 h-6 text-white" />
                    <span className="font-bold text-white">Protected</span>
                  </div>
                )}
                {hasDoublePoints && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/30 rounded-lg border border-purple-400">
                    <Star className="w-6 h-6 text-white" />
                    <span className="font-bold text-white">Double Points</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Joker Buttons Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              size="xl"
              onClick={() => handleJokerAction('protection')}
              disabled={!playerInventory || playerInventory.protection === 0 || isProtected}
              className="h-40 flex-col bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Shield className="w-16 h-16 mb-3" />
              <span className="text-2xl font-bold">Protection</span>
              <span className="text-sm mt-2">
                Immunity from all attacks
              </span>
              <span className="text-lg mt-2 font-bold">
                {playerInventory?.protection || 0} / 2 uses
              </span>
            </Button>

            <Button
              size="xl"
              onClick={() => handleJokerAction('block')}
              disabled={!playerInventory || playerInventory.block === 0}
              className="h-40 flex-col bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <Ban className="w-16 h-16 mb-3" />
              <span className="text-2xl font-bold">Block</span>
              <span className="text-sm mt-2">
                Prevent opponent from answering
              </span>
              <span className="text-lg mt-2 font-bold">
                {playerInventory?.block || 0} / 10 uses
              </span>
            </Button>

            <Button
              size="xl"
              onClick={() => handleJokerAction('steal')}
              disabled={!playerInventory || playerInventory.steal === 0}
              className="h-40 flex-col bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            >
              <Coins className="w-16 h-16 mb-3" />
              <span className="text-2xl font-bold">Steal</span>
              <span className="text-sm mt-2">
                Take 100% of opponent's points
              </span>
              <span className="text-lg mt-2 font-bold">
                {playerInventory?.steal || 0} / 10 uses
              </span>
            </Button>

            <Button
              size="xl"
              onClick={() => handleJokerAction('double_points')}
              disabled={!playerInventory || playerInventory.double_points === 0 || hasDoublePoints}
              className="h-40 flex-col bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              <Star className="w-16 h-16 mb-3" />
              <span className="text-2xl font-bold">Double Points</span>
              <span className="text-sm mt-2">
                Multiply your score by 2
              </span>
              <span className="text-lg mt-2 font-bold">
                {playerInventory?.double_points || 0} / 5 uses
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 3: Question
  if (currentPhase === 'question') {
    const isBlocked = activeEffects.blocks[currentPlayer?.id || ''];

    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-qb-dark flex items-center justify-center">
          <p className="text-white text-2xl">Loading question...</p>
        </div>
      );
    }

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

          {/* Question Card */}
          <Card gradient className="p-8">
            <div className="text-center mb-8">
              <div className="text-sm text-white/70 mb-2">
                Question {currentStage + 1} • {currentQuestion.points || 100} points
              </div>
              <h2 className="text-3xl font-bold text-white">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Blocked Warning */}
            {isBlocked && (
              <div className="mb-6 p-6 bg-red-500/20 border-2 border-red-500 rounded-xl text-center animate-pulse">
                <Ban className="w-16 h-16 mx-auto mb-3 text-red-500" />
                <p className="text-2xl font-bold text-red-500">
                  🚫 YOU'VE BEEN BLOCKED!
                </p>
                <p className="text-white/80 mt-2">
                  Cannot answer this question
                </p>
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion.options?.map((option, index) => (
                <AnswerOption
                  key={index}
                  letter={['A', 'B', 'C', 'D'][index] as 'A' | 'B' | 'C' | 'D'}
                  text={option}
                  selected={selectedAnswer === option}
                  disabled={isBlocked || hasAnswered}
                  onClick={() => handleAnswerSelect(option)}
                  correct={hasAnswered && option === currentQuestion.correct_answer}
                  wrong={hasAnswered && selectedAnswer === option && option !== currentQuestion.correct_answer}
                />
              ))}
            </div>

            {/* Active Effects Badges */}
            <div className="mt-6 flex gap-4 justify-center flex-wrap">
              {activeEffects.protections[currentPlayer?.id || ''] && (
                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500 rounded-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-white font-bold">Protected</span>
                </div>
              )}
              {activeEffects.doublePoints[currentPlayer?.id || ''] && (
                <div className="px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  <span className="text-white font-bold">Double Points Active!</span>
                </div>
              )}
            </div>

            {/* Answer Confirmation */}
            {hasAnswered && !isBlocked && (
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-center">
                <p className="text-green-400 font-bold text-xl">
                  ✅ Answer Submitted!
                </p>
                <p className="text-white/70 text-sm mt-1">
                  Wait for results...
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Phase 4: Results
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
          
          {/* Points Display */}
          <div className="mb-8 p-6 bg-white/10 rounded-2xl">
            <p className="text-2xl text-white/80 mb-2">Points Earned:</p>
            <p className="text-7xl font-bold text-white">
              +{finalPoints}
            </p>
            {isDoubled && isCorrect && (
              <p className="text-2xl text-yellow-300 mt-3 font-bold animate-pulse">
                ⭐ DOUBLE POINTS! (×2)
              </p>
            )}
          </div>

          {/* Explanation */}
          {currentQuestion && (
            <div className="p-6 bg-white/10 rounded-xl space-y-4">
              <div>
                <p className="text-lg text-white/90">
                  <span className="font-bold text-white">Correct Answer:</span>{' '}
                  {currentQuestion.correct_answer}
                </p>
              </div>
              {currentQuestion.explanation && (
                <div className="text-white/80 text-sm">
                  {currentQuestion.explanation}
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

  // Default/Loading
  return (
    <div className="min-h-screen bg-qb-dark flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-spin">⏳</div>
        <p className="text-white text-2xl">Waiting for next phase...</p>
      </div>
    </div>
  );
};
