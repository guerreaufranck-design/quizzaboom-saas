import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shield, Ban, Coins, Star, Clock, X, Trophy } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { supabase } from '../services/supabase/client';

export const PlayerView: React.FC = () => {
  const { t } = useTranslation();
  const { currentPlayer, sessionCode, currentQuiz, players, loadPlayers, currentSession } = useQuizStore();
  const {
    currentPhase,
    phaseEndTime,
    currentQuestion,
    playerInventory,
    activeEffects,
    selectedAnswer,
    hasAnswered,
    executeJokerAction,
    submitAnswer,
    loadQuestions,
    listenToPhaseChanges,
    reconnectToSession,
    getChannelState,
    setPhaseData,
    showTargetSelector,
    pendingJokerType,
    closeTargetSelector,
  } = useStrategicQuizStore();
  const displaySeconds = useCountdown(phaseEndTime);
  const { playCorrect, playIncorrect } = useSoundEffects();

  const wakeLockRef = useRef<any>(null);
  const [playerRank, setPlayerRank] = useState(0);
  const [frozenScore, setFrozenScore] = useState(0);
  const lastPhaseRef = useRef<string>('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ===== RECONNECTION ROBUSTE =====
  // 3 mécanismes complémentaires : polling DB + visibility/pageshow/focus + health check Realtime

  const pollPhaseFromDB = async () => {
    if (!currentSession?.id) return;

    try {
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .select('settings, status')
        .eq('id', currentSession.id)
        .single();

      if (error || !session) return;

      // Quiz ended
      if (session.status === 'finished' || session.status === 'completed') return;

      const settings = session.settings as Record<string, unknown>;
      const dbPhase = settings?.currentPhase as { phase: string; questionIndex: number; stageNumber: number; timeRemaining: number; phaseEndTime?: number; currentQuestion: unknown; themeTitle?: string } | undefined;

      if (dbPhase) {
        const { currentPhase: localPhase, currentQuestionIndex: localQIdx } = useStrategicQuizStore.getState();

        // Phase or question has changed → sync
        if (dbPhase.phase !== localPhase || dbPhase.questionIndex !== localQIdx) {
          console.log('🔄 Poll detected phase change:', localPhase, '→', dbPhase.phase, 'Q:', localQIdx, '→', dbPhase.questionIndex);
          setPhaseData(dbPhase as any);
        }
      }

      // Health check: if Realtime channel is dead, reconnect
      const channelState = getChannelState();
      if (channelState === 'closed' || channelState === 'errored' || channelState === null) {
        console.log('🔌 Realtime channel dead (state:', channelState, ') — reconnecting...');
        if (sessionCode) {
          reconnectToSession(currentSession.id, sessionCode);
        }
      }
    } catch (err) {
      console.error('Poll error:', err);
    }
  };

  const handleReconnect = () => {
    if (currentSession?.id && sessionCode) {
      console.log('🔄 Reconnecting (visibility/pageshow/focus)...');
      reconnectToSession(currentSession.id, sessionCode);
    }
  };

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
      } catch (err) {
        console.log('⚠️ Wake Lock error:', err);
      }
    };

    keepAwake();

    // === 3 événements de reconnexion (couvrent tous les navigateurs/OS) ===

    // 1. visibilitychange (Chrome Android, desktop)
    const handleVisibility = () => {
      if (!document.hidden) {
        if (!wakeLockRef.current) keepAwake();
        handleReconnect();
      }
    };

    // 2. pageshow (iOS Safari — fire quand la page revient du bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('📱 pageshow (bfcache) — reconnecting...');
        if (!wakeLockRef.current) keepAwake();
        handleReconnect();
      }
    };

    // 3. focus (onglet reprend le focus)
    const handleFocus = () => {
      if (!wakeLockRef.current) keepAwake();
      handleReconnect();
    };

    // Touch/click wake lock re-acquire
    const handleInteraction = () => {
      if (!wakeLockRef.current) {
        keepAwake();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction);

    // === Polling périodique de la phase depuis la DB (filet de sécurité) ===
    pollIntervalRef.current = setInterval(pollPhaseFromDB, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch (err) {}
      }
    };
  }, [currentSession?.id, sessionCode]);

  useEffect(() => {
    if (currentQuiz?.id) loadQuestions(currentQuiz.id);
    if (sessionCode) listenToPhaseChanges(sessionCode);
    // Fetch current phase from DB immediately on mount (don't wait for first 3s poll)
    pollPhaseFromDB();
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

    // Play sound on results phase (correct/incorrect feedback)
    if (currentPhase === 'results' && lastPhaseRef.current !== 'results') {
      if (hasAnswered && currentQuestion) {
        const correctAnswer = currentQuestion.correct_answer;
        const wasCorrect = selectedAnswer === correctAnswer;
        if (wasCorrect) {
          playCorrect();
        } else {
          playIncorrect();
        }
      }
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
      alert(t('player.jokerActivated', { type: jokerType }));
    } catch (error) {
      alert(error instanceof Error ? error.message : t('player.actionFailed'));
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
              {pendingJokerType === 'block' ? t('player.blockPlayer') : t('player.stealFromPlayer')}
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

  // Filter jokers based on session settings
  const sessionSettings = (currentSession?.settings as Record<string, unknown>) || {};
  const sessionEnabledJokers = (sessionSettings.enabledJokers as Record<string, boolean>) || {
    protection: true, block: true, steal: true, double_points: true,
  };

  if (!currentPlayer || !sessionCode || !currentQuiz) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-pulse">⏳</div>
          <h2 className="text-3xl font-bold text-white mb-4">{t('common.loading')}</h2>
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
                <div className="text-qb-cyan text-xs">{t('player.sessionLabel', { code: sessionCode })}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-3xl font-bold text-yellow-400">#{playerRank || '-'}</span>
              </div>
              <div className="text-4xl font-bold text-white">{frozenScore}</div>
              <div className="text-xs text-white/60">{t('player.points')}</div>
            </div>
          </div>
        </Card>

        {currentPhase === 'commercial_break' ? (
          <Card className="p-6 text-center bg-gradient-to-br from-yellow-500 to-orange-500 border-2 border-yellow-300">
            <div className="text-4xl mb-2">☕</div>
            <div className="text-xl font-bold text-white mb-1">{t('player.pause')}</div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-white animate-pulse" />
              <span className="text-5xl font-mono font-bold text-white">
                {Math.floor(displaySeconds / 60)}:{(displaySeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <p className="text-sm text-white/80 mt-2">{t('player.quizResumeShortly')}</p>
          </Card>
        ) : (
          <Card className="p-3 text-center bg-gradient-to-br from-qb-dark to-qb-darker border border-white/20">
            <div className="text-xs text-white/70 mb-1 uppercase tracking-wider">
              {currentPhase === 'theme_announcement' && t('player.phaseUseJokers')}
              {currentPhase === 'question_display' && t('player.phaseReadQuestion')}
              {currentPhase === 'answer_selection' && t('player.phaseAnswerNow')}
              {currentPhase === 'results' && t('player.phaseResults')}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-white animate-pulse" />
              <span className="text-5xl font-mono font-bold text-white">{displaySeconds}s</span>
            </div>
          </Card>
        )}

        {(isProtected || hasDoublePoints || isBlocked) && (
          <Card className="p-3 bg-white/10">
            <div className="flex gap-2 justify-center flex-wrap">
              {isProtected && (
                <div className="px-3 py-1 bg-blue-500/40 rounded-lg flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4" />
                  <span className="font-bold">{t('player.effectProtected')}</span>
                </div>
              )}
              {hasDoublePoints && (
                <div className="px-3 py-1 bg-purple-500/40 rounded-lg flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4" />
                  <span className="font-bold">{t('player.effectDoublePoints')}</span>
                </div>
              )}
              {isBlocked && (
                <div className="px-3 py-1 bg-red-500/40 rounded-lg flex items-center gap-2 text-sm">
                  <Ban className="w-4 h-4" />
                  <span className="font-bold">{t('player.effectBlocked')}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-4 bg-white/10 backdrop-blur-lg border-white/20">
          <h3 className="text-white font-bold mb-3 text-center text-sm">
            {t('player.jokersTitle')} {jokersEnabled ? t('player.jokerChooseNow') : t('player.jokerWaitPhase')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sessionEnabledJokers.protection && (
              <Button
                size="lg"
                onClick={() => handleJokerAction('protection')}
                disabled={!jokersEnabled || playerInventory.protection === 0 || isProtected}
                className="h-24 flex-col bg-blue-600 hover:bg-blue-700 disabled:opacity-30"
              >
                <Shield className="w-8 h-8 mb-1" />
                <span className="font-bold text-sm">{t('player.jokerProtection')}</span>
                <span className="text-xs">{playerInventory.protection === 0 ? t('player.jokerUsed') : t('player.jokerReady')}</span>
              </Button>
            )}

            {sessionEnabledJokers.double_points && (
              <Button
                size="lg"
                onClick={() => handleJokerAction('double_points')}
                disabled={!jokersEnabled || playerInventory.double_points === 0 || hasDoublePoints}
                className="h-24 flex-col bg-purple-600 hover:bg-purple-700 disabled:opacity-30"
              >
                <Star className="w-8 h-8 mb-1" />
                <span className="font-bold text-sm">{t('player.jokerDouble')}</span>
                <span className="text-xs">{playerInventory.double_points === 0 ? t('player.jokerUsed') : t('player.jokerReady')}</span>
              </Button>
            )}

            {sessionEnabledJokers.block && (
              <Button
                size="lg"
                onClick={() => handleJokerAction('block')}
                disabled={!jokersEnabled || playerInventory.block === 0}
                className="h-24 flex-col bg-red-600 hover:bg-red-700 disabled:opacity-30"
              >
                <Ban className="w-8 h-8 mb-1" />
                <span className="font-bold text-sm">{t('player.jokerBlock')}</span>
                <span className="text-xs">{playerInventory.block === 0 ? t('player.jokerUsed') : t('player.jokerReady')}</span>
              </Button>
            )}

            {sessionEnabledJokers.steal && (
              <Button
                size="lg"
                onClick={() => handleJokerAction('steal')}
                disabled={!jokersEnabled || playerInventory.steal === 0}
                className="h-24 flex-col bg-yellow-600 hover:bg-yellow-700 disabled:opacity-30"
              >
                <Coins className="w-8 h-8 mb-1" />
                <span className="font-bold text-sm">{t('player.jokerSteal')}</span>
                <span className="text-xs">{playerInventory.steal === 0 ? t('player.jokerUsed') : t('player.jokerReady')}</span>
              </Button>
            )}
          </div>
        </Card>

        {(currentPhase === 'question_display' || currentPhase === 'answer_selection') && currentQuestion?.image_url && (
          <Card className="p-2 bg-white/10 backdrop-blur-lg border-white/20">
            <img
              src={currentQuestion.image_url}
              alt=""
              className="w-full h-32 object-cover rounded-xl"
            />
          </Card>
        )}

        <Card className="p-4 bg-white/10 backdrop-blur-lg border-white/20">
          <h3 className="text-white font-bold mb-3 text-center text-sm">
            {t('player.answersTitle')} {answersEnabled ? t('player.answersSelectNow') : t('player.answersWaitTime')}
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
              <p className="text-lg font-bold text-blue-400">{t('player.answerSubmitted')}</p>
            </div>
          )}

          {currentPhase === 'results' && currentQuestion?.fun_fact && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-qb-yellow/80 text-sm italic">
                💡 {currentQuestion.fun_fact}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
