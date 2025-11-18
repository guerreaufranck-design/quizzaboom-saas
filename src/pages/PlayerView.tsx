import React, { useEffect, useRef, useState } from 'react';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shield, Ban, Coins, Star, Clock, X, Trophy } from 'lucide-react';
import eruda from 'eruda';

export const PlayerView: React.FC = () => {
  const { currentPlayer, sessionCode, currentQuiz, players, loadPlayers, currentSession } = useQuizStore();
  const {
    currentPhase,
    phaseTimeRemaining,
    currentQuestion,
    playerInventory,
    activeEffects,
    selectedAnswer,
    hasAnswered,
    executeJokerAction,
    submitAnswer,
    loadQuestions,
    listenToPhaseChanges,
    showTargetSelector,
    pendingJokerType,
    closeTargetSelector,
  } = useStrategicQuizStore();

  const wakeLockRef = useRef<any>(null);
  const [playerRank, setPlayerRank] = useState(0);
  const [frozenScore, setFrozenScore] = useState(0);
  const lastPhaseRef = useRef<string>('');

  useEffect(() => {
    eruda.init();
  }, []);

  useEffect(() => {
    const keepAwake = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('🔋 Wake Lock activated');
          
          if (wakeLockRef.current) {
            wakeLockRef.current.addEventListener('release', () => {
              console.log('🔋 Re-requesting wake lock');
              setTimeout(() => keepAwake(), 100);
            });
          }
        }
      } catch (err) {}
    };
    
    keepAwake();
    
    const handleVisibility = () => {
      if (!document.hidden && !wakeLockRef.current) {
        keepAwake();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(() => console.log('🔔 Keep-alive'), 15000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  useEffect(() => {
    if (currentQuiz?.id) loadQuestions(currentQuiz.id);
    if (sessionCode) listenToPhaseChanges(sessionCode);
  }, [currentQuiz?.id, sessionCode]);

  useEffect(() => {
    if (currentSession?.id) {
      loadPlayers(currentSession.id);
      const interval = setInterval(() => {
        loadPlayers(currentSession.id);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentSession?.id]);

  useEffect(() => {
    if (currentPlayer && players.length > 0) {
      const sorted = [...players].sort((a, b) => b.total_score - a.total_score);
      const rank = sorted.findIndex(p => p.id === currentPlayer.id) + 1;
      setPlayerRank(rank);
    }
  }, [players, currentPlayer]);

  useEffect(() => {
    if (currentPhase === 'answer_selection' && lastPhaseRef.current !== 'answer_selection') {
      console.log('🔒 Freezing score at:', currentPlayer?.total_score);
      setFrozenScore(currentPlayer?.total_score || 0);
    }
    
    if (currentPhase === 'theme_announcement' && lastPhaseRef.current !== 'theme_announcement') {
      console.log('🔓 Updating score to:', currentPlayer?.total_score);
      setFrozenScore(currentPlayer?.total_score || 0);
    }
    
    lastPhaseRef.current = currentPhase;
  }, [currentPhase, currentPlayer?.total_score]);

  useEffect(() => {
    if (currentPlayer && frozenScore === 0) {
      setFrozenScore(currentPlayer.total_score || 0);
    }
  }, [currentPlayer?.total_score, frozenScore]);

  const handleJokerAction = async (jokerType: 'protection' | 'block' | 'steal' | 'double_points') => {
    try {
      await executeJokerAction(jokerType);
      alert(`✅ ${jokerType.toUpperCase()} activated!`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAnswerSelect = async (letter: 'A' | 'B' | 'C' | 'D') => {
    const optionIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
    const answer = currentQuestion?.options?.[optionIndex];
    if (answer) {
      console.log('📤 Submitting answer:', answer);
      await submitAnswer(answer);
    }
  };

  const TargetSelectorModal = () => {
    if (!showTargetSelector || !pendingJokerType) return null;
    const opponents = players.filter(p => p.id !== currentPlayer?.id);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <Card className="max-w-lg w-full p-6 bg-qb-darker border-2 border-qb-cyan">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">
              {pendingJokerType === 'block' ? '🚫 Block Player' : '💰 Steal from Player'}
            </h3>
            <button onClick={closeTargetSelector} className="text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {opponents.map((player) => (
              <Button
                key={player.id}
                fullWidth
                size="lg"
                onClick={() => executeJokerAction(pendingJokerType!, player.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{player.avatar_emoji}</span>
                  <span className="font-bold">{player.player_name}</span>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const isProtected = activeEffects.protections[currentPlayer?.id || ''];
  const hasDoublePoints = activeEffects.doublePoints[currentPlayer?.id || ''];
  const isBlocked = activeEffects.blocks[currentPlayer?.id || ''];
  
  const jokersEnabled = currentPhase === 'theme_announcement';
  const answersEnabled = currentPhase === 'answer_selection' && !isBlocked && !hasAnswered;

  if (!currentPlayer || !sessionCode || !currentQuiz) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-pulse">⏳</div>
          <h2 className="text-3xl font-bold text-white mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark">
      <TargetSelectorModal />
      
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="p-4 bg-gradient-to-br from-qb-purple via-qb-magenta to-qb-cyan">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{currentPlayer.avatar_emoji}</div>
              <div>
                <div className="text-white font-bold text-xl">{currentPlayer.player_name}</div>
                <div className="text-qb-cyan text-xs">Session: {sessionCode}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-3xl font-bold text-yellow-400">#{playerRank || '-'}</span>
              </div>
              <div className="text-4xl font-bold text-white">{frozenScore}</div>
              <div className="text-xs text-white/60">points</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-qb-dark to-qb-darker border border-white/20">
          <div className="text-xs text-white/70 mb-1 uppercase tracking-wider">
            {currentPhase === 'theme_announcement' && '🃏 Use Your Jokers!'}
            {currentPhase === 'question_display' && '📖 Read Question'}
            {currentPhase === 'answer_selection' && '✍️ Answer Now!'}
            {currentPhase === 'results' && '📊 Results'}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-6 h-6 text-white animate-pulse" />
            <span className="text-5xl font-mono font-bold text-white">{phaseTimeRemaining}s</span>
          </div>
        </Card>

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

        <Card className="p-4 bg-white/10 backdrop-blur-lg border-white/20">
          <h3 className="text-white font-bold mb-3 text-center text-sm">
            Jokers {jokersEnabled ? '✅ Choose Now!' : '🔒 Wait for joker phase'}
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

        <Card className="p-4 bg-white/10 backdrop-blur-lg border-white/20">
          <h3 className="text-white font-bold mb-3 text-center text-sm">
            Answers {answersEnabled ? '✅ Select Now!' : '🔒 Wait for answer time'}
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
            <div className="mt-4 p-3 bg-blue-500/20 border-2 border-blue-500 rounded-lg text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-lg font-bold text-blue-400">Answer Submitted!</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
