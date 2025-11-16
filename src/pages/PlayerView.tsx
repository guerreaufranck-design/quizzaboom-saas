import React, { useState } from 'react';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AnswerOption } from '../components/ui/AnswerOption';
import { Shield, Ban, Coins, Star } from 'lucide-react';

export const PlayerView: React.FC = () => {
  const { currentPlayer } = useQuizStore();
  const {
    currentPhase,
    currentTheme,
    playerInventory,
    activeEffects,
    executeJokerAction,
  } = useStrategicQuizStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const currentQuestion = {
    question_text: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"],
    correct_answer: "Paris",
  };

  const handleJokerAction = async (jokerType: 'protection' | 'block' | 'steal' | 'double_points') => {
    if (!playerInventory) return;
    
    if (jokerType === 'protection' || jokerType === 'double_points') {
      try {
        await executeJokerAction(jokerType);
      } catch (error) {
        console.error('Failed to execute joker:', error);
      }
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered) return;
    if (activeEffects.blocks[currentPlayer?.id || '']) return;
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
  };

  if (currentPhase === 'announcement') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-12 text-center bg-white/10 backdrop-blur-lg border-white/20">
          <div className="text-8xl mb-6">📢</div>
          <h1 className="text-5xl font-bold text-white mb-6">NEXT QUESTION</h1>
          <div className="text-3xl font-bold text-white/90 mb-8">
            Theme: {currentTheme || "General Knowledge"}
          </div>
          <p className="text-xl text-white/70 mt-6">
            Prepare your strategy...
          </p>
        </Card>
      </div>
    );
  }

  if (currentPhase === 'jokers') {
    const isProtected = activeEffects.protections[currentPlayer?.id || ''];
    const hasDoublePoints = activeEffects.doublePoints[currentPlayer?.id || ''];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <Card className="p-8 text-center bg-white/10 backdrop-blur-lg border-white/20">
            <div className="text-6xl mb-4">⚡</div>
            <h1 className="text-4xl font-bold text-white mb-4">JOKER PHASE</h1>
          </Card>

          {(isProtected || hasDoublePoints) && (
            <Card className="p-6 bg-green-500/20 border-green-500/50">
              <h3 className="text-xl font-bold text-white mb-3">Active Effects:</h3>
              <div className="flex gap-4 justify-center">
                {isProtected && (
                  <div className="flex items-center gap-2 text-white">
                    <Shield className="w-6 h-6" />
                    <span className="font-bold">Protected</span>
                  </div>
                )}
                {hasDoublePoints && (
                  <div className="flex items-center gap-2 text-white">
                    <Star className="w-6 h-6" />
                    <span className="font-bold">Double Points Active</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              size="xl"
              onClick={() => handleJokerAction('protection')}
              disabled={!playerInventory || playerInventory.protection === 0}
              className="h-32 flex-col bg-blue-600 hover:bg-blue-700"
            >
              <Shield className="w-12 h-12 mb-2" />
              <span className="text-xl font-bold">Protection</span>
              <span className="text-sm">
                {playerInventory?.protection || 0} uses left
              </span>
            </Button>

            <Button
              size="xl"
              onClick={() => handleJokerAction('block')}
              disabled={!playerInventory || playerInventory.block === 0}
              className="h-32 flex-col bg-red-600 hover:bg-red-700"
            >
              <Ban className="w-12 h-12 mb-2" />
              <span className="text-xl font-bold">Block</span>
              <span className="text-sm">
                {playerInventory?.block || 0} uses left
              </span>
            </Button>

            <Button
              size="xl"
              onClick={() => handleJokerAction('steal')}
              disabled={!playerInventory || playerInventory.steal === 0}
              className="h-32 flex-col bg-yellow-600 hover:bg-yellow-700"
            >
              <Coins className="w-12 h-12 mb-2" />
              <span className="text-xl font-bold">Steal</span>
              <span className="text-sm">
                {playerInventory?.steal || 0} uses left
              </span>
            </Button>

            <Button
              size="xl"
              onClick={() => handleJokerAction('double_points')}
              disabled={!playerInventory || playerInventory.double_points === 0}
              className="h-32 flex-col bg-purple-600 hover:bg-purple-700"
            >
              <Star className="w-12 h-12 mb-2" />
              <span className="text-xl font-bold">Double Points</span>
              <span className="text-sm">
                {playerInventory?.double_points || 0} uses left
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === 'question') {
    const isBlocked = activeEffects.blocks[currentPlayer?.id || ''];

    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <Card gradient className="p-8">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              {currentQuestion.question_text}
            </h2>

            {isBlocked && (
              <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl text-center">
                <Ban className="w-12 h-12 mx-auto mb-2 text-red-500" />
                <p className="text-xl font-bold text-red-500">
                  You've been BLOCKED! Cannot answer this question.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
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

            <div className="mt-6 flex gap-4 justify-center">
              {activeEffects.protections[currentPlayer?.id || ''] && (
                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500 rounded-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-white font-bold">Protected</span>
                </div>
              )}
              {activeEffects.doublePoints[currentPlayer?.id || ''] && (
                <div className="px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  <span className="text-white font-bold">Double Points</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (currentPhase === 'results') {
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const points = isCorrect ? 100 : 0;
    const finalPoints = activeEffects.doublePoints[currentPlayer?.id || ''] ? points * 2 : points;

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isCorrect 
          ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500' 
          : 'bg-gradient-to-br from-red-500 via-pink-500 to-purple-500'
      }`}>
        <Card className="max-w-2xl w-full p-12 text-center bg-white/10 backdrop-blur-lg border-white/20">
          <div className="text-8xl mb-6">
            {isCorrect ? '✅' : '❌'}
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            {isCorrect ? 'CORRECT!' : 'WRONG!'}
          </h1>
          
          <div className="mb-8">
            <p className="text-2xl text-white/80 mb-2">Points Earned:</p>
            <p className="text-6xl font-bold text-white">+{finalPoints}</p>
            {activeEffects.doublePoints[currentPlayer?.id || ''] && (
              <p className="text-xl text-yellow-300 mt-2">
                ⭐ Double Points Active! (×2)
              </p>
            )}
          </div>

          <div className="p-6 bg-white/10 rounded-xl mb-6">
            <p className="text-lg text-white/90">
              <span className="font-bold">Correct Answer:</span> {currentQuestion.correct_answer}
            </p>
            <p className="text-sm text-white/70 mt-2">
              Fun fact: Paris is known as the "City of Light"!
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark flex items-center justify-center">
      <p className="text-white text-2xl">Waiting for next phase...</p>
    </div>
  );
};
