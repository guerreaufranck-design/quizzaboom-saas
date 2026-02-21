import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shield, Ban, Coins, Star, Clock, X, Trophy, Flame } from 'lucide-react';
import { AutoFitText } from '../components/AutoFitText';
import { useCountdown } from '../hooks/useCountdown';
import { useQuizAudio } from '../hooks/useQuizAudio';
import { supabase } from '../services/supabase/client';
import { CommentaryPopupChain } from '../components/CommentaryPopupChain';
import { TutorialSlides } from '../components/TutorialSlides';

/** Distinct color schemes for answer options A/B/C/D — matches TV style */
const MOBILE_OPTION_COLORS = [
  { bg: 'from-red-500 to-orange-500', border: 'border-red-400', label: 'bg-red-700', letter: 'A' },
  { bg: 'from-blue-500 to-indigo-500', border: 'border-blue-400', label: 'bg-blue-700', letter: 'B' },
  { bg: 'from-green-500 to-emerald-500', border: 'border-green-400', label: 'bg-green-700', letter: 'C' },
  { bg: 'from-purple-500 to-pink-500', border: 'border-purple-400', label: 'bg-purple-700', letter: 'D' },
];

export const PlayerView: React.FC = () => {
  const { t } = useTranslation();
  const { currentPlayer, sessionCode, currentQuiz, players, loadPlayers, currentSession } = useQuizStore();
  const {
    currentPhase,
    phaseEndTime,
    currentQuestion,
    playerInventory,
    activeEffects,
    preSelectedAnswer,
    selectedAnswer,
    hasAnswered,
    executeJokerAction,
    selectAnswer,
    confirmAnswer,
    loadQuestions,
    listenToPhaseChanges,
    reconnectToSession,
    getChannelState,
    setPhaseData,
    showTargetSelector,
    pendingJokerType,
    closeTargetSelector,
    commentaryPopups,
    initializeInventory,
    tutorialSlides,
    currentThemeTitle,
    phaseTimeRemaining,
  } = useStrategicQuizStore();
  const displaySeconds = useCountdown(phaseEndTime);
  const { playCorrectSound, playWrongSound, playApplause } = useQuizAudio();

  const wakeLockRef = useRef<any>(null);
  const [playerRank, setPlayerRank] = useState(0);
  const [frozenScore, setFrozenScore] = useState(0);
  const [showLateJoinBanner, setShowLateJoinBanner] = useState(false);
  const lastPhaseRef = useRef<string>('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectingRef = useRef(false);
  const inventoryLoadedRef = useRef(false);
  const lastWakeLockAttemptRef = useRef(0);

  // ===== RECONNECTION ROBUSTE =====
  // 3 mécanismes complémentaires : polling DB + visibility/pageshow/focus + health check Realtime

  const pollPhaseFromDB = async (forceSync = false) => {
    if (!currentSession?.id) return;

    try {
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .select('settings, status')
        .eq('id', currentSession.id)
        .single();

      if (error || !session) return;

      // Quiz ended — set phase to quiz_complete so UI updates
      if (session.status === 'finished' || session.status === 'completed') {
        const { currentPhase: localPhase } = useStrategicQuizStore.getState();
        if (localPhase !== 'quiz_complete') {
          console.log('🏁 Quiz ended while disconnected — syncing to quiz_complete');
          setPhaseData({
            phase: 'quiz_complete',
            questionIndex: 0,
            stageNumber: 0,
            timeRemaining: 0,
            phaseEndTime: 0,
            currentQuestion: null,
            themeTitle: 'Quiz Complete',
          } as any);
        }
        return;
      }

      const settings = session.settings as Record<string, unknown>;
      const dbPhase = settings?.currentPhase as { phase: string; questionIndex: number; stageNumber: number; timeRemaining: number; phaseEndTime?: number; currentQuestion: unknown; themeTitle?: string } | undefined;

      if (dbPhase) {
        const { currentPhase: localPhase, currentQuestionIndex: localQIdx, phaseEndTime: localEndTime } = useStrategicQuizStore.getState();

        // Only sync if DB phase is NEWER (higher phaseEndTime or higher questionIndex)
        // This prevents the poll from reverting to an older phase (e.g. theme_announcement)
        // which would reset active joker effects
        const dbEndTime = dbPhase.phaseEndTime || 0;
        const localEnd = localEndTime || 0;
        const isNewer = dbPhase.questionIndex > localQIdx
          || (dbPhase.questionIndex === localQIdx && dbEndTime > localEnd)
          || (dbPhase.phase === 'quiz_complete' && localPhase !== 'quiz_complete');

        // forceSync: after phone wake, always accept DB phase if it differs
        // This fixes the bug where player is stuck on old phase after sleep
        const isDifferentPhase = dbPhase.phase !== localPhase || dbPhase.questionIndex !== localQIdx;

        if ((isNewer || forceSync) && isDifferentPhase) {
          console.log('🔄 Poll detected phase change:', localPhase, '→', dbPhase.phase, 'Q:', localQIdx, '→', dbPhase.questionIndex, forceSync ? '(force sync after wake)' : '');
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

  // Debounced reconnect — prevents multiple simultaneous reconnection attempts
  // Retries after a short delay in case the network isn't ready immediately after wake
  const handleReconnect = () => {
    if (reconnectingRef.current) return;
    if (!currentSession?.id || !sessionCode) return;

    reconnectingRef.current = true;
    console.log('🔄 Reconnecting (visibility/pageshow/focus)...');

    // Reconnect channel + sync phase from DB (forceSync=true after wake)
    reconnectToSession(currentSession.id, sessionCode);
    pollPhaseFromDB(true);

    // Retry after 1.5s — network may not be ready immediately after phone wake
    setTimeout(() => {
      reconnectToSession(currentSession!.id, sessionCode!);
      pollPhaseFromDB(true);
    }, 1500);

    // Reset debounce after 3s
    setTimeout(() => { reconnectingRef.current = false; }, 3000);
  };

  useEffect(() => {
    const keepAwake = async () => {
      // Debounce: max once per 5 seconds
      const now = Date.now();
      if (now - lastWakeLockAttemptRef.current < 5000) return;
      lastWakeLockAttemptRef.current = now;

      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');

          if (wakeLockRef.current) {
            wakeLockRef.current.addEventListener('release', () => {
              wakeLockRef.current = null;
            });
          }
        }
      } catch (err) {
        // Silently fail — Wake Lock not critical
      }
    };

    keepAwake();

    // === 3 événements de reconnexion (couvrent tous les navigateurs/OS) ===

    // 1. visibilitychange (Chrome Android, desktop)
    const handleVisibility = () => {
      if (!document.hidden) {
        keepAwake();
        handleReconnect();
      }
    };

    // 2. pageshow (iOS Safari bfcache + Android navigation back)
    const handlePageShow = () => {
      console.log('📱 pageshow — reconnecting...');
      keepAwake();
      handleReconnect();
    };

    // 3. focus (onglet reprend le focus)
    const handleFocus = () => {
      keepAwake();
      handleReconnect();
    };

    // 4. online (network restored after phone sleep or connectivity drop)
    const handleOnline = () => {
      console.log('🌐 Network back online — reconnecting...');
      handleReconnect();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // === Polling continu de la phase depuis la DB ===
    // Fast poll (3s) quand Realtime est mort, slow poll (5s) quand il est sain
    pollIntervalRef.current = setInterval(() => {
      const channelState = getChannelState();
      const isHealthy = channelState === 'SUBSCRIBED';

      // Always poll — just less frequently when channel is healthy
      // This catches phase changes even if a single broadcast was missed
      pollPhaseFromDB();

      // Adjust interval if needed: if unhealthy, reconnect channel too
      if (!isHealthy && currentSession?.id && sessionCode) {
        reconnectToSession(currentSession.id, sessionCode);
      }
    }, 4000); // 4s — good balance between responsiveness and server load

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      if (wakeLockRef.current) {
        try { wakeLockRef.current.release(); } catch (_) {}
      }
    };
  }, [currentSession?.id, sessionCode]);

  useEffect(() => {
    if (currentQuiz?.id) loadQuestions(currentQuiz.id);
    if (sessionCode) listenToPhaseChanges(sessionCode);
    // Fetch current phase from DB immediately on mount (don't wait for first 3s poll)
    pollPhaseFromDB();
  }, [currentQuiz?.id, sessionCode]);

  // Load joker inventory ONLY when currentPlayer becomes available (ONCE per session)
  // Priority: 1) sessionStorage (instant) 2) DB settings 3) session defaults
  useEffect(() => {
    const loadPlayerInventory = async () => {
      if (!currentPlayer?.id) return;
      if (inventoryLoadedRef.current) return; // Already loaded — skip

      // 1) Try sessionStorage first (instant, survives page refresh)
      try {
        const cached = sessionStorage.getItem('qb_inventory');
        if (cached) {
          const cachedInventory = JSON.parse(cached) as { protection: number; block: number; steal: number; double_points: number };
          console.log('🃏 Loading joker inventory from sessionStorage:', cachedInventory);
          initializeInventory(cachedInventory);
          inventoryLoadedRef.current = true;
          return;
        }
      } catch (_) {}

      // 2) Try DB (server-persisted inventory)
      try {
        const { data } = await supabase
          .from('session_players')
          .select('settings')
          .eq('id', currentPlayer.id)
          .single();

        if (data?.settings) {
          const playerSettings = data.settings as Record<string, unknown>;
          const savedInventory = playerSettings.jokerInventory as { protection: number; block: number; steal: number; double_points: number } | undefined;

          if (savedInventory) {
            console.log('🃏 Loading saved joker inventory from DB:', savedInventory);
            initializeInventory(savedInventory);
            inventoryLoadedRef.current = true;
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load player inventory from DB:', err);
      }

      // 3) Fallback: use session default if nothing saved
      if (currentSession?.settings) {
        const settings = currentSession.settings as Record<string, unknown>;
        const defaultInventory = settings.jokerInventory as { protection: number; block: number; steal: number; double_points: number } | undefined;
        if (defaultInventory) {
          console.log('🃏 Using default joker inventory:', defaultInventory);
          initializeInventory(defaultInventory);
          inventoryLoadedRef.current = true;
          // Persist to player settings via server API (bypasses RLS)
          try {
            const { data: playerData } = await supabase
              .from('session_players')
              .select('settings')
              .eq('id', currentPlayer.id)
              .single();
            const currentSettings = (playerData?.settings as Record<string, unknown>) || {};
            await fetch('/api/update-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playerId: currentPlayer.id,
                updates: {
                  settings: { ...currentSettings, jokerInventory: defaultInventory },
                  updated_at: new Date().toISOString(),
                },
              }),
            });
          } catch (_) {}
        }
      }
    };

    loadPlayerInventory();
  }, [currentPlayer?.id, currentSession?.settings]);

  useEffect(() => {
    if (currentSession?.id) {
      loadPlayers(currentSession.id);
      const interval = setInterval(() => {
        loadPlayers(currentSession.id);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [currentSession?.id]);

  // Detect late-joiner: player has 0 score and quiz is already in a mid-game phase
  const lateJoinDetectedRef = useRef(false);
  useEffect(() => {
    if (lateJoinDetectedRef.current) return;
    if (currentSession?.status === 'playing' && currentPlayer?.total_score === 0 && currentPlayer?.questions_answered === 0) {
      // Check if this is really mid-game (not just started)
      const phase = useStrategicQuizStore.getState().currentPhase;
      if (phase && phase !== 'tutorial' && phase !== '' as any) {
        lateJoinDetectedRef.current = true;
        setShowLateJoinBanner(true);
        // Auto-hide after 8 seconds
        setTimeout(() => setShowLateJoinBanner(false), 8000);
      }
    }
  }, [currentSession?.status, currentPlayer?.total_score, currentPhase]);

  useEffect(() => {
    if (currentPlayer && players.length > 0) {
      const sorted = [...players].sort((a, b) => b.total_score - a.total_score);
      const rank = sorted.findIndex(p => p.id === currentPlayer.id) + 1;
      setPlayerRank(rank);
    }
  }, [players, currentPlayer]);

  useEffect(() => {
    // Freeze score when answer_selection starts (don't show DB update during answering)
    if (currentPhase === 'answer_selection' && lastPhaseRef.current !== 'answer_selection') {
      console.log('🔒 Freezing score at:', currentPlayer?.total_score);
      setFrozenScore(currentPlayer?.total_score || 0);
    }

    // Reveal updated score when results phase starts (after correct answer shown)
    if (currentPhase === 'results' && lastPhaseRef.current !== 'results') {
      // Small delay so player sees the answer reveal first, then score update
      setTimeout(() => {
        console.log('🔓 Revealing score on results:', currentPlayer?.total_score);
        setFrozenScore(currentPlayer?.total_score || 0);
      }, 800);

      // Play sound
      if (hasAnswered && currentQuestion) {
        const correctAnswer = currentQuestion.correct_answer;
        const wasCorrect = selectedAnswer === correctAnswer
          || (!!selectedAnswer && !!correctAnswer && selectedAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase());
        if (wasCorrect) {
          playCorrectSound();
          setTimeout(() => playApplause(), 300);
        } else {
          playWrongSound();
        }
      }
    }

    // Also update on theme_announcement (new question round)
    if (currentPhase === 'theme_announcement' && lastPhaseRef.current !== 'theme_announcement') {
      setFrozenScore(currentPlayer?.total_score || 0);
    }

    lastPhaseRef.current = currentPhase;
  }, [currentPhase, currentPlayer?.total_score]);

  // Initialize frozenScore ONCE on mount (or when player first loads)
  const scoreInitRef = useRef(false);
  useEffect(() => {
    if (currentPlayer && !scoreInitRef.current) {
      scoreInitRef.current = true;
      setFrozenScore(currentPlayer.total_score || 0);
    }
  }, [currentPlayer?.id]);

  const handleJokerAction = async (jokerType: 'protection' | 'block' | 'steal' | 'double_points') => {
    try {
      await executeJokerAction(jokerType);
      alert(t('player.jokerActivated', { type: jokerType }));
    } catch (error) {
      alert(error instanceof Error ? error.message : t('player.actionFailed'));
    }
  };

  const handleAnswerSelect = (letter: 'A' | 'B' | 'C' | 'D') => {
    const optionIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
    const answer = currentQuestion?.options?.[optionIndex];
    if (answer) {
      console.log('🔄 Pre-selecting answer:', answer);
      selectAnswer(answer);
    }
  };

  // Auto-submit answer at 5 seconds remaining
  const autoSubmitRef = useRef(false);
  useEffect(() => {
    if (currentPhase !== 'answer_selection') {
      autoSubmitRef.current = false;
      return;
    }
    if (hasAnswered || autoSubmitRef.current) return;
    if (displaySeconds !== null && displaySeconds <= 5 && preSelectedAnswer) {
      console.log('⏰ Auto-submitting answer at', displaySeconds, 'seconds');
      autoSubmitRef.current = true;
      confirmAnswer();
    }
  }, [displaySeconds, currentPhase, hasAnswered, preSelectedAnswer]);

  const TargetSelectorModal = () => {
    if (!showTargetSelector || !pendingJokerType) return null;
    // Exclude self + already-stolen/blocked players
    const alreadyStolenIds = new Set(Object.keys(activeEffects.steals));
    const alreadyBlockedIds = new Set(Object.keys(activeEffects.blocks));
    const opponents = players.filter(p => {
      if (p.id === currentPlayer?.id) return false;
      if (pendingJokerType === 'steal' && alreadyStolenIds.has(p.id)) return false;
      if (pendingJokerType === 'block' && alreadyBlockedIds.has(p.id)) return false;
      return true;
    });

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
  const canChangeAnswer = answersEnabled && displaySeconds !== null && displaySeconds > 5;

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
    <div className="h-[100dvh] bg-qb-dark flex flex-col overflow-hidden">
      <TargetSelectorModal />

      <div className="max-w-2xl mx-auto p-3 flex flex-col gap-2 flex-1 min-h-0 w-full">
        {/* Header: player info + score + active effects — compact */}
        <Card className="p-3 bg-gradient-to-br from-qb-purple via-qb-magenta to-qb-cyan">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-3xl">{currentPlayer.avatar_emoji}</div>
              <div>
                <div className="text-white font-bold text-lg leading-tight">{currentPlayer.player_name}</div>
                {currentPlayer.team_name && (
                  <div className="inline-block px-2 py-0.5 bg-qb-cyan/20 border border-qb-cyan/40 rounded-full text-qb-cyan text-xs font-bold">
                    {t('player.yourTeam', { team: currentPlayer.team_name })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Active effects badges — inline in header */}
              {isProtected && (
                <div className="px-2 py-1 bg-blue-500/50 rounded-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              )}
              {hasDoublePoints && (
                <div className="px-2 py-1 bg-purple-500/50 rounded-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
              )}
              {isBlocked && (
                <div className="px-2 py-1 bg-red-500/50 rounded-lg">
                  <Ban className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-2xl font-bold text-yellow-400">#{playerRank || '-'}</span>
                </div>
                <div className="text-2xl font-bold text-white leading-tight">{frozenScore}</div>
              </div>
            </div>
          </div>
          {/* Phase indicator — small strip below header */}
          <div className="mt-2 text-center text-xs font-bold text-white/90 uppercase tracking-wider">
            {currentPhase === 'theme_announcement' && t('player.phaseUseJokers')}
            {currentPhase === 'question_display' && t('player.phaseReadQuestion')}
            {currentPhase === 'answer_selection' && t('player.phaseAnswerNow')}
            {currentPhase === 'results' && t('player.phaseResults')}
            {currentPhase === 'commercial_break' && t('player.pause')}
          </div>
        </Card>

        {showLateJoinBanner && (
          <Card className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-400 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <p className="text-white font-bold text-sm">{t('player.lateJoinWelcome')}</p>
                <p className="text-white/90 text-xs">{t('player.lateJoinDesc')}</p>
              </div>
              <button onClick={() => setShowLateJoinBanner(false)} className="text-white/70 hover:text-white ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        )}

        {currentPhase === 'tutorial' && tutorialSlides.length > 0 ? (
          <TutorialSlides slides={tutorialSlides} variant="mobile" />
        ) : currentPhase === 'commercial_break' ? (
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
          <>
            {/* Jokers — only visible during theme_announcement */}
            {currentPhase === 'theme_announcement' && (
              <Card className="p-2 bg-white/10 backdrop-blur-lg border-white/20">
                <div className="grid grid-cols-4 gap-2">
                  {sessionEnabledJokers.protection && (
                    <Button
                      size="sm"
                      onClick={() => handleJokerAction('protection')}
                      disabled={!jokersEnabled || playerInventory.protection === 0 || isProtected}
                      className="h-16 flex-col bg-blue-600 hover:bg-blue-700 disabled:opacity-30 px-1"
                    >
                      <Shield className="w-6 h-6 mb-0.5" />
                      <span className="font-bold text-[10px] leading-tight">{t('player.jokerProtection')}</span>
                      <span className="text-[9px] opacity-80">{playerInventory.protection === 0 ? t('player.jokerUsed') : playerInventory.protection > 1 ? `${playerInventory.protection}x` : t('player.jokerReady')}</span>
                    </Button>
                  )}

                  {sessionEnabledJokers.double_points && (
                    <Button
                      size="sm"
                      onClick={() => handleJokerAction('double_points')}
                      disabled={!jokersEnabled || playerInventory.double_points === 0 || hasDoublePoints}
                      className="h-16 flex-col bg-purple-600 hover:bg-purple-700 disabled:opacity-30 px-1"
                    >
                      <Star className="w-6 h-6 mb-0.5" />
                      <span className="font-bold text-[10px] leading-tight">{t('player.jokerDouble')}</span>
                      <span className="text-[9px] opacity-80">{playerInventory.double_points === 0 ? t('player.jokerUsed') : playerInventory.double_points > 1 ? `${playerInventory.double_points}x` : t('player.jokerReady')}</span>
                    </Button>
                  )}

                  {sessionEnabledJokers.block && (
                    <Button
                      size="sm"
                      onClick={() => handleJokerAction('block')}
                      disabled={!jokersEnabled || playerInventory.block === 0}
                      className="h-16 flex-col bg-red-600 hover:bg-red-700 disabled:opacity-30 px-1"
                    >
                      <Ban className="w-6 h-6 mb-0.5" />
                      <span className="font-bold text-[10px] leading-tight">{t('player.jokerBlock')}</span>
                      <span className="text-[9px] opacity-80">{playerInventory.block === 0 ? t('player.jokerUsed') : playerInventory.block > 1 ? `${playerInventory.block}x` : t('player.jokerReady')}</span>
                    </Button>
                  )}

                  {sessionEnabledJokers.steal && (
                    <Button
                      size="sm"
                      onClick={() => handleJokerAction('steal')}
                      disabled={!jokersEnabled || playerInventory.steal === 0}
                      className="h-16 flex-col bg-yellow-600 hover:bg-yellow-700 disabled:opacity-30 px-1"
                    >
                      <Coins className="w-6 h-6 mb-0.5" />
                      <span className="font-bold text-[10px] leading-tight">{t('player.jokerSteal')}</span>
                      <span className="text-[9px] opacity-80">{playerInventory.steal === 0 ? t('player.jokerUsed') : playerInventory.steal > 1 ? `${playerInventory.steal}x` : t('player.jokerReady')}</span>
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Theme name — shown during theme_announcement below jokers */}
            {currentPhase === 'theme_announcement' && currentThemeTitle && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center shrink-0">
                <p className="text-xs text-white/60 uppercase tracking-wider font-bold mb-0.5">{t('player.phaseUseJokers')}</p>
                <p className="text-lg font-bold text-yellow-300">{currentThemeTitle}</p>
              </div>
            )}

            {/* Countdown timer — shown during theme_announcement for urgency */}
            {currentPhase === 'theme_announcement' && (
              <div className="flex flex-col items-center justify-center shrink-0 py-2">
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
                  displaySeconds <= 3 ? 'animate-pulse' : ''
                }`}>
                  {/* Circular progress ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                    <circle
                      cx="40" cy="40" r="35" fill="none"
                      stroke={displaySeconds <= 3 ? '#ef4444' : displaySeconds <= 5 ? '#f59e0b' : '#22d3ee'}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 35}`}
                      strokeDashoffset={`${2 * Math.PI * 35 * (1 - displaySeconds / Math.max(phaseTimeRemaining, displaySeconds, 1))}`}
                      style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                    />
                  </svg>
                  <span className={`text-3xl font-mono font-black ${
                    displaySeconds <= 3 ? 'text-red-400' : displaySeconds <= 5 ? 'text-amber-400' : 'text-cyan-300'
                  }`}>
                    {displaySeconds}
                  </span>
                </div>
              </div>
            )}

            {/* ── Question Display phase: question + image (read only) ── */}
            {currentPhase === 'question_display' && currentQuestion && (
              <Card className="p-3 bg-white/10 backdrop-blur-lg border-white/20 flex-1 flex flex-col min-h-0">
                {currentQuestion.image_url && (
                  <img
                    src={currentQuestion.image_url}
                    alt=""
                    className="w-full h-40 object-cover rounded-xl mb-3 shrink-0"
                  />
                )}
                <div className="flex-1 min-h-[80px]">
                  <AutoFitText
                    text={currentQuestion.question_text}
                    className="font-bold text-white"
                    maxFontSize={48}
                  />
                </div>
              </Card>
            )}

            {/* ── Answer Selection: question + 4 colored answer cards ── */}
            {currentPhase === 'answer_selection' && currentQuestion && (
              <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
                {/* Question image */}
                {currentQuestion.image_url && (
                  <div className="rounded-xl overflow-hidden shrink-0">
                    <img
                      src={currentQuestion.image_url}
                      alt=""
                      className="w-full h-28 object-cover"
                    />
                  </div>
                )}

                {/* Question text — capped height, can shrink if needed, overflow hidden */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1 overflow-hidden shrink min-h-0" style={{ maxHeight: '20%', minHeight: '40px' }}>
                  <AutoFitText
                    text={currentQuestion.question_text}
                    className="font-bold text-white"
                    maxFontSize={26}
                  />
                </div>

                {/* 4 colored answer cards — 2x2 grid, fills remaining space */}
                <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0 overflow-hidden">
                  {(currentQuestion.options || []).map((option, idx) => {
                    const color = MOBILE_OPTION_COLORS[idx] || MOBILE_OPTION_COLORS[0];
                    const isPreSelected = preSelectedAnswer === option && !hasAnswered;
                    const isFinalAnswer = selectedAnswer === option && hasAnswered;

                    let ringClass = '';
                    let scaleClass = '';
                    const overlayBg = `bg-gradient-to-br ${color.bg}`;
                    const borderClass = `border-2 ${color.border}`;

                    if (isFinalAnswer) {
                      ringClass = 'ring-4 ring-white';
                      scaleClass = 'scale-[1.03]';
                    } else if (isPreSelected) {
                      ringClass = 'ring-4 ring-white/80 ring-dashed';
                      scaleClass = 'scale-[1.03]';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(['A', 'B', 'C', 'D'][idx] as 'A' | 'B' | 'C' | 'D')}
                        disabled={!answersEnabled}
                        className={`${overlayBg} ${borderClass} ${ringClass} ${scaleClass} rounded-xl flex flex-col min-h-0 overflow-hidden transition-all duration-200 active:scale-95 disabled:active:scale-100`}
                      >
                        {/* Letter badge — compact */}
                        <div className={`${color.label} w-5 h-5 rounded-md flex items-center justify-center shrink-0 ml-1.5 mt-1 shadow-inner`}>
                          <span className="text-xs font-bold text-white">{color.letter}</span>
                        </div>
                        {/* Option text — overflow hidden ensures no bleed */}
                        <div className="flex-1 min-h-0 px-1.5 pb-1 overflow-hidden">
                          <AutoFitText
                            text={option}
                            className="font-bold text-white drop-shadow-md"
                            maxFontSize={20}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pre-selected: show confirm button */}
                {preSelectedAnswer && !hasAnswered && (
                  <div className="p-1.5 bg-yellow-500/20 border-2 border-yellow-500 rounded-lg text-center shrink-0">
                    {canChangeAnswer ? (
                      <Button
                        size="md"
                        onClick={() => confirmAnswer()}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 w-full"
                      >
                        {t('player.confirmAnswer')}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                        <p className="text-xs font-bold text-yellow-300">{t('player.answerLocking')}</p>
                      </div>
                    )}
                  </div>
                )}

                {hasAnswered && (
                  <div className="p-1.5 bg-blue-500/20 border-2 border-blue-500 rounded-lg text-center shrink-0">
                    <p className="text-sm font-bold text-blue-400">{t('player.answerSubmitted')}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Results: correct answer reveal + commentary + fun fact ── */}
            {currentPhase === 'results' && currentQuestion && (() => {
              const correctAnswer = currentQuestion.correct_answer || '';
              const normalize = (s?: string | null) => s?.trim().toLowerCase() ?? '';
              const correctIdx = (currentQuestion.options || []).findIndex(
                opt => opt === correctAnswer || normalize(opt) === normalize(correctAnswer)
              );
              const correctLetter = correctIdx >= 0 ? ['A', 'B', 'C', 'D'][correctIdx] : '?';
              const correctColor = correctIdx >= 0 ? MOBILE_OPTION_COLORS[correctIdx] : MOBILE_OPTION_COLORS[2];
              const wasCorrect = selectedAnswer != null && normalize(selectedAnswer) === normalize(correctAnswer);

              return (
                <div className="flex flex-col gap-2 flex-1 min-h-0">
                  {/* Was your answer correct? */}
                  <div className={`p-3 rounded-xl text-center shrink-0 ${
                    wasCorrect
                      ? 'bg-green-500/20 border-2 border-green-400'
                      : 'bg-red-500/20 border-2 border-red-400'
                  }`}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">{wasCorrect ? '✅' : '❌'}</span>
                      <span className={`text-lg font-bold ${wasCorrect ? 'text-green-300' : 'text-red-300'}`}>
                        {wasCorrect ? t('player.correctAnswer') : t('player.wrongAnswer')}
                      </span>
                    </div>
                  </div>

                  {/* Correct answer card — big, prominent with letter badge */}
                  <div className={`bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-green-300 rounded-xl p-4 shrink-0`}>
                    <div className="flex items-center gap-3">
                      <div className={`${correctColor.label} w-10 h-10 rounded-xl flex items-center justify-center shadow-inner shrink-0`}>
                        <span className="text-xl font-bold text-white">{correctLetter}</span>
                      </div>
                      <p className="text-xl font-bold text-white flex-1">{correctAnswer}</p>
                    </div>
                  </div>

                  {/* Streak badge */}
                  {currentPlayer && currentPlayer.current_streak >= 3 && (
                    <div className="p-2 bg-orange-500/20 border-2 border-orange-400 rounded-lg text-center shrink-0 animate-pulse">
                      <div className="flex items-center justify-center gap-2">
                        <Flame className="w-5 h-5 text-orange-400" />
                        <span className="text-lg font-bold text-orange-300">
                          {t('player.streakBadge', { count: currentPlayer.current_streak })}
                        </span>
                        <Flame className="w-5 h-5 text-orange-400" />
                      </div>
                    </div>
                  )}

                  {/* Commentary popups — fills available space */}
                  {commentaryPopups.length > 0 && (
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <CommentaryPopupChain popups={commentaryPopups} variant="player" />
                    </div>
                  )}

                  {/* Fun fact */}
                  {currentQuestion?.fun_fact && (
                    <div className="p-3 bg-yellow-500/10 border-2 border-yellow-500/40 rounded-lg shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 font-bold">💡 {t('player.funFactLabel')}</span>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed">
                        {currentQuestion.fun_fact}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};
