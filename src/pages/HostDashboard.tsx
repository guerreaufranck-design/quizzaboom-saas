import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuizStore } from '../stores/useQuizStore';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  Play,
  Pause,
  SkipForward,
  Users,
  TrendingUp,
  Trophy,
  Eye,
  Monitor,
  RefreshCw,
  Mail,
  CheckCircle,
  Square,
  Volume2,
  VolumeX,
  Coffee,
  Home,
} from 'lucide-react';
import { useQuizAudio } from '../hooks/useQuizAudio';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useCountdown } from '../hooks/useCountdown';
import type { GamePhase } from '../types/gamePhases';
import { PHASE_DURATIONS, PHASE_ORDER } from '../types/gamePhases';
import type { Question, CommercialBreakSchedule } from '../types/quiz';
import { supabase } from '../services/supabase/client';

export const HostDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currentQuiz, currentSession, players, sessionCode, loadPlayers, endSession } = useQuizStore();
  const { allQuestions, loadQuestions, broadcastPhaseChange } = useStrategicQuizStore();

  const [currentPhaseState, setCurrentPhaseState] = useState<GamePhase>('theme_announcement');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phaseEndTime, setPhaseEndTime] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [emailsSending, setEmailsSending] = useState(false);
  const [emailsSent, setEmailsSent] = useState(false);
  const { stopAll, onPhaseChange, toggleMute, isMuted } = useQuizAudio();
  const navigate = useAppNavigate();

  const displaySeconds = useCountdown(phaseEndTime, () => {
    if (isPlaying) handlePhaseComplete();
  });

  const currentQuestion: Question | null = allQuestions[currentQuestionIndex] || null;

  // Auto-send result emails when quiz completes
  useEffect(() => {
    if (quizCompleted && !emailsSent && !emailsSending && currentSession && currentQuiz) {
      const playersWithEmailList = players.filter(p => p.email);
      if (playersWithEmailList.length > 0) {
        console.log('📧 Auto-sending results to', playersWithEmailList.length, 'players');
        handleSendResults();
      }
    }
  }, [quizCompleted]);

  // Get break schedule from session settings
  const sessionSettings = (currentSession?.settings as Record<string, unknown>) || {};
  const breakSchedule = sessionSettings.breakSchedule as CommercialBreakSchedule | undefined;
  const promoMessage = sessionSettings.promoMessage as string | undefined;

  useEffect(() => {
    if (currentQuiz?.id) {
      console.log('📚 Loading questions for quiz:', currentQuiz.id);
      loadQuestions(currentQuiz.id);
    }
  }, [currentQuiz?.id]);

  useEffect(() => {
    if (currentSession?.id) {
      const interval = setInterval(() => {
        loadPlayers(currentSession.id);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSession?.id]);

  // Timer is now handled by useCountdown hook above (timestamp-based)

  // Check if a commercial break should happen after the given question index
  const getBreakAfterQuestion = (questionIndex: number) => {
    if (!breakSchedule?.breaks) return null;
    return breakSchedule.breaks.find(b => b.afterQuestionIndex === questionIndex) || null;
  };

  const handlePhaseComplete = () => {
    // If we're currently in a commercial break, move to next question
    if (currentPhaseState === 'commercial_break') {
      if (currentQuestionIndex < allQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        changePhase('theme_announcement', nextIndex);
      } else {
        broadcastQuizComplete();
      }
      return;
    }

    const currentIndex = PHASE_ORDER.indexOf(currentPhaseState);

    if (currentIndex < PHASE_ORDER.length - 1) {
      const nextPhase = PHASE_ORDER[currentIndex + 1];
      changePhase(nextPhase, currentQuestionIndex);
    } else {
      // End of phase cycle (after intermission)
      // Check if a commercial break should be inserted
      const scheduledBreak = getBreakAfterQuestion(currentQuestionIndex);
      if (scheduledBreak) {
        const breakIndex = breakSchedule!.breaks.indexOf(scheduledBreak);
        changePhaseWithBreak(scheduledBreak.durationSeconds, scheduledBreak.promoMessage, breakIndex + 1, breakSchedule!.breaks.length);
        return;
      }

      if (currentQuestionIndex < allQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        changePhase('theme_announcement', nextIndex);
      } else {
        broadcastQuizComplete();
      }
    }
  };

  const broadcastQuizComplete = () => {
    if (sessionCode) {
      const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);
      broadcastPhaseChange(sessionCode, {
        phase: 'quiz_complete' as GamePhase,
        questionIndex: currentQuestionIndex,
        stageNumber: Math.floor(currentQuestionIndex / 5),
        timeRemaining: 0,
        phaseEndTime: 0,
        currentQuestion: null,
        themeTitle: 'Quiz Complete',
        topPlayers: sortedPlayers.slice(0, 10).map((p, idx) => ({
          player_name: p.player_name,
          avatar_emoji: p.avatar_emoji,
          total_score: p.total_score,
          correct_answers: p.correct_answers,
          rank: idx + 1,
        })),
      });
    }
    setPhaseEndTime(null);
    setIsPlaying(false);
    setQuizCompleted(true);
    stopAll();
  };

  const changePhaseWithBreak = (durationSeconds: number, breakPromoMessage: string | undefined, breakNumber: number, totalBreaks: number) => {
    const endTime = Date.now() + durationSeconds * 1000;

    setCurrentPhaseState('commercial_break');
    setPhaseEndTime(endTime);
    setPausedRemaining(null);

    const phaseData = {
      phase: 'commercial_break' as GamePhase,
      questionIndex: currentQuestionIndex,
      stageNumber: Math.floor(currentQuestionIndex / 5),
      timeRemaining: durationSeconds,
      phaseEndTime: endTime,
      currentQuestion: null,
      themeTitle: 'Commercial Break',
      promoMessage: breakPromoMessage || promoMessage,
      breakNumber,
      totalBreaks,
    };

    console.log(`📺 Commercial Break ${breakNumber}/${totalBreaks} — ${durationSeconds}s`);

    if (sessionCode) {
      broadcastPhaseChange(sessionCode, phaseData);
    }

    if (currentSession?.id) {
      supabase.from('quiz_sessions')
        .update({
          settings: {
            ...(typeof currentSession.settings === 'object' && currentSession.settings ? currentSession.settings : {}),
            currentPhase: phaseData,
          },
        })
        .eq('id', currentSession.id)
        .then(({ error }) => {
          if (error) console.error('Failed to persist break phase to DB:', error);
        });
    }
  };

  const changePhase = (newPhase: GamePhase, questionIndex: number) => {
    const stageNumber = Math.floor(questionIndex / 5);
    const question = allQuestions[questionIndex];

    const phaseDuration = PHASE_DURATIONS[newPhase];
    const endTime = Date.now() + phaseDuration * 1000;

    setCurrentPhaseState(newPhase);
    setPhaseEndTime(endTime);
    setPausedRemaining(null);

    const phaseData = {
      phase: newPhase,
      questionIndex: questionIndex,
      stageNumber,
      timeRemaining: phaseDuration,
      phaseEndTime: endTime,
      currentQuestion: question || null,
      themeTitle: question?.stage_id || t('host.defaultTheme'),
    };

    console.log('📤 Broadcasting phase change:', {
      phase: newPhase,
      questionIndex,
      theme: phaseData.themeTitle,
    });

    if (sessionCode) {
      broadcastPhaseChange(sessionCode, phaseData);
    }

    onPhaseChange(newPhase, phaseDuration);

    if (currentSession?.id) {
      supabase.from('quiz_sessions')
        .update({
          settings: {
            ...(typeof currentSession.settings === 'object' && currentSession.settings ? currentSession.settings : {}),
            currentPhase: phaseData,
          },
          current_question: questionIndex,
        })
        .eq('id', currentSession.id)
        .then(({ error }) => {
          if (error) console.error('Failed to persist phase to DB:', error);
        });
    }
  };

  const handleStartPause = () => {
    if (isPlaying) {
      // === PAUSE ===
      // Snapshot remaining ms, null-out phaseEndTime so useCountdown stops
      const remaining = phaseEndTime ? Math.max(0, phaseEndTime - Date.now()) : 0;
      setPausedRemaining(remaining);
      setPhaseEndTime(null);
      setIsPlaying(false);
    } else {
      // === RESUME / START ===
      if (currentPhaseState === 'theme_announcement' && currentQuestionIndex === 0 && pausedRemaining === null) {
        // First start of the quiz
        setIsPlaying(true);
        changePhase('theme_announcement', 0);
      } else if (pausedRemaining !== null && pausedRemaining > 0) {
        // Resume from pause
        const newEndTime = Date.now() + pausedRemaining;
        setPhaseEndTime(newEndTime);
        setPausedRemaining(null);
        setIsPlaying(true);

        // Re-broadcast the phase with new phaseEndTime so TV/players resync
        if (sessionCode) {
          const question = allQuestions[currentQuestionIndex];
          broadcastPhaseChange(sessionCode, {
            phase: currentPhaseState,
            questionIndex: currentQuestionIndex,
            stageNumber: Math.floor(currentQuestionIndex / 5),
            timeRemaining: Math.ceil(pausedRemaining / 1000),
            phaseEndTime: newEndTime,
            currentQuestion: question || null,
            themeTitle: question?.stage_id || t('host.defaultTheme'),
          });
        }
      } else {
        // Edge case: resume but nothing paused — just unpause
        setIsPlaying(true);
      }
    }
  };

  const handleSkipPhase = () => {
    // Set phaseEndTime to now → useCountdown will reach 0 → handlePhaseComplete fires
    setPhaseEndTime(Date.now());
  };

  const handleManualPhaseChange = (phase: GamePhase) => {
    if (isPlaying) {
      alert(t('host.pauseFirst'));
      return;
    }
    changePhase(phase, currentQuestionIndex);
  };

  const getPhaseColor = (phase: GamePhase) => {
    switch (phase) {
      case 'theme_announcement': return 'from-indigo-500 to-purple-500';
      case 'question_display': return 'from-blue-500 to-cyan-500';
      case 'answer_selection': return 'from-cyan-500 to-teal-500';
      case 'results': return 'from-green-500 to-emerald-500';
      case 'intermission': return 'from-gray-600 to-gray-800';
      case 'commercial_break': return 'from-yellow-500 to-orange-500';
      case 'quiz_complete': return 'from-yellow-500 to-orange-500';
    }
  };

  const getPhaseIcon = (phase: GamePhase) => {
    switch (phase) {
      case 'theme_announcement': return '🎯';
      case 'question_display': return '📖';
      case 'answer_selection': return '✍️';
      case 'results': return '📊';
      case 'intermission': return '⏸️';
      case 'commercial_break': return '☕';
      case 'quiz_complete': return '🏆';
    }
  };

  const getPhaseLabel = (phase: GamePhase) => {
    switch (phase) {
      case 'theme_announcement': return t('host.phaseThemeJokers');
      case 'question_display': return t('host.phaseQuestion');
      case 'answer_selection': return t('host.phaseAnswers');
      case 'results': return t('host.phaseResults');
      case 'intermission': return t('host.phaseLeaderboard');
      case 'commercial_break': return t('host.phaseBreak');
      case 'quiz_complete': return t('host.phaseComplete');
    }
  };

  const playersWithEmail = players.filter(p => p.email);

  const handleSendResults = async () => {
    if (!currentSession || !currentQuiz) return;
    setEmailsSending(true);

    try {
      const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);
      const emailPlayers = sortedPlayers
        .filter(p => p.email)
        .map((p, idx) => ({
          playerName: p.player_name,
          email: p.email!,
          score: p.total_score,
          rank: idx + 1,
          totalPlayers: players.length,
          correctAnswers: p.correct_answers,
          totalQuestions: allQuestions.length,
          accuracy: p.accuracy_percentage,
          bestStreak: p.best_streak,
        }));

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz_results',
          sessionId: currentSession.id,
          quizTitle: currentQuiz.title,
          language: currentQuiz.language || 'en',
          players: emailPlayers,
        }),
      });

      setEmailsSent(true);
    } catch (error) {
      console.error('Failed to send results emails:', error);
    } finally {
      setEmailsSending(false);
    }
  };

  if (!currentQuiz || !currentSession) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-2xl">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <Card className="p-12 text-center max-w-2xl">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-3xl font-bold text-white mb-4">{t('common.loading')}</h2>
          <p className="text-white/70">{t('host.generatingWithAI')}</p>
        </Card>
      </div>
    );
  }

  if (quizCompleted) {
    const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);
    return (
      <div className="min-h-screen bg-qb-dark p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-12 text-center bg-gradient-to-br from-qb-purple/30 to-qb-cyan/30">
            <div className="text-8xl mb-4">🏆</div>
            <h1 className="text-5xl font-bold text-white mb-4">{t('host.quizComplete')}</h1>
            <p className="text-2xl text-white/70">{currentQuiz.title}</p>
          </Card>

          <Card gradient className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              {t('host.finalLeaderboard')}
            </h2>
            <div className="space-y-3">
              {sortedPlayers.slice(0, 10).map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    index === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500' :
                    index === 1 ? 'bg-gray-300/10 border border-gray-400/30' :
                    index === 2 ? 'bg-amber-700/10 border border-amber-700/30' :
                    'bg-white/5'
                  }`}
                >
                  <div className="text-3xl font-bold text-white w-10 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                  </div>
                  <div className="text-3xl">{player.avatar_emoji}</div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-white">{player.player_name}</div>
                    <div className="text-sm text-white/60">
                      {t('host.playerStats', { correct: player.correct_answers, accuracy: player.accuracy_percentage })}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-qb-cyan">{player.total_score}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Auto email status */}
          <Card gradient className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-white/70" />
                <span className="text-white/70">
                  {t('host.playersWithEmail', { count: playersWithEmail.length })}
                </span>
              </div>
              {emailsSent ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">{t('host.sent')}</span>
                </div>
              ) : emailsSending ? (
                <div className="flex items-center gap-2 text-yellow-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="font-bold">{t('common.loading')}</span>
                </div>
              ) : (
                <span className="text-white/50 text-sm">
                  {playersWithEmail.length === 0 ? t('host.noEmailsToSend') : t('host.emailsPending')}
                </span>
              )}
            </div>
          </Card>

          {/* Return to Dashboard */}
          <div className="text-center">
            <Button
              gradient
              size="xl"
              icon={<Home />}
              onClick={() => navigate('dashboard')}
            >
              {t('host.backToDashboard')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatBreakTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-qb-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{currentQuiz.title}</h1>
            <p className="text-white/70">{t('host.hostDashboard')} - {t('host.session')}: {sessionCode}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              icon={<Monitor />}
              onClick={() => window.open(`${window.location.origin}/tv?code=${sessionCode}`, '_blank')}
            >
              {t('host.openTV')}
            </Button>
            <Button
              variant="ghost"
              icon={<Eye />}
              onClick={() => window.open(`${window.location.origin}/join?code=${sessionCode}`, '_blank')}
            >
              {t('host.previewPlayer')}
            </Button>
            <Button
              variant="ghost"
              icon={<Square />}
              onClick={() => {
                if (confirm(t('host.stopConfirmation'))) {
                  endSession();
                }
              }}
              className="text-red-400 hover:text-red-300"
            >
              {t('host.stopQuiz')}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className={`p-8 bg-gradient-to-br ${getPhaseColor(currentPhaseState)}`}>
              <div className="text-center space-y-4">
                <div className="text-8xl animate-pulse">{getPhaseIcon(currentPhaseState)}</div>
                <h2 className="text-4xl font-bold text-white uppercase">
                  {getPhaseLabel(currentPhaseState)}
                </h2>
                <div className="text-7xl font-mono font-bold text-white">
                  {(() => {
                    const seconds = pausedRemaining !== null ? Math.ceil(pausedRemaining / 1000) : displaySeconds;
                    return currentPhaseState === 'commercial_break'
                      ? formatBreakTime(seconds)
                      : `${seconds}s`;
                  })()}
                </div>
                <div className="text-xl text-white/90">
                  {t('host.questionProgress', { current: currentQuestionIndex + 1, total: allQuestions.length })}
                </div>
                {currentQuestion && currentPhaseState !== 'commercial_break' && (
                  <div className="text-2xl text-yellow-300 font-bold">
                    {t('host.themePrefix', { theme: currentQuestion.stage_id })}
                  </div>
                )}
                {currentPhaseState === 'commercial_break' && promoMessage && (
                  <div className="text-xl text-yellow-300 font-bold mt-2">
                    {promoMessage}
                  </div>
                )}
                <div className="inline-flex px-4 py-2 bg-white/20 rounded-full text-white font-bold">
                  {isPlaying ? `▶️ ${t('host.playing')}` : `⏸️ ${t('host.paused')}`}
                </div>
              </div>
            </Card>

            <Card gradient className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Button
                  size="xl"
                  onClick={handleStartPause}
                  icon={isPlaying ? <Pause /> : <Play />}
                  gradient={isPlaying}
                  variant={isPlaying ? 'primary' : 'secondary'}
                >
                  {isPlaying ? t('host.pauseQuiz') : t('host.startQuiz')}
                </Button>
                <Button
                  size="xl"
                  onClick={handleSkipPhase}
                  icon={currentPhaseState === 'commercial_break' ? <Coffee /> : <SkipForward />}
                  variant="ghost"
                  disabled={!isPlaying}
                >
                  {currentPhaseState === 'commercial_break'
                    ? t('create.endBreakEarly')
                    : t('host.skipPhase')
                  }
                </Button>
                <Button
                  size="xl"
                  onClick={toggleMute}
                  icon={isMuted ? <VolumeX /> : <Volume2 />}
                  variant={isMuted ? 'ghost' : 'secondary'}
                >
                  {isMuted ? t('host.mute') : t('host.sound')}
                </Button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {PHASE_ORDER.map((phase) => (
                  <Button
                    key={phase}
                    onClick={() => handleManualPhaseChange(phase)}
                    variant={currentPhaseState === phase ? 'primary' : 'ghost'}
                    disabled={isPlaying}
                    className="text-xs py-2"
                  >
                    {getPhaseLabel(phase)}
                  </Button>
                ))}
              </div>
            </Card>

            {breakSchedule && breakSchedule.breaks.length > 0 && (
              <Card className="p-4 bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">
                    {t('create.commercialBreaks')} ({breakSchedule.breaks.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {breakSchedule.breaks.map((brk, idx) => {
                    const isCompleted = currentQuestionIndex > brk.afterQuestionIndex;
                    const isCurrent = currentPhaseState === 'commercial_break' && currentQuestionIndex === brk.afterQuestionIndex;
                    return (
                      <div
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isCurrent
                            ? 'bg-yellow-500 text-yellow-900 animate-pulse'
                            : isCompleted
                            ? 'bg-yellow-500/20 text-yellow-400/50 line-through'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {t('host.breakSchedule', { question: brk.afterQuestionIndex + 1, minutes: Math.floor(brk.durationSeconds / 60) })}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <Card gradient className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{t('host.currentQuestion')}</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-qb-purple rounded-full text-sm font-bold">
                    {currentQuestion?.stage_id || 'N/A'}
                  </span>
                  <span className="px-3 py-1 bg-qb-cyan rounded-full text-sm font-bold">
                    {currentQuestion?.points || 100} pts
                  </span>
                </div>
              </div>

              {currentQuestion ? (
                <div className="bg-qb-darker p-6 rounded-xl space-y-4">
                  <p className="text-2xl text-white font-medium">
                    {currentQuestion.question_text}
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options?.map((option, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg flex items-center gap-3 ${
                          option === currentQuestion.correct_answer
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <span className="text-xl font-bold text-white">
                          {['A', 'B', 'C', 'D'][idx]}.
                        </span>
                        <span className="text-white flex-1">{option}</span>
                        {option === currentQuestion.correct_answer && (
                          <span className="text-green-400 font-bold">{t('host.correctAnswer')}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {currentQuestion.explanation && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-white/80">
                        <strong className="text-blue-400">{t('host.explanationLabel')}</strong> {currentQuestion.explanation}
                      </p>
                    </div>
                  )}

                  {currentQuestion.fun_fact && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-white/80">
                        <strong className="text-yellow-400">{t('host.funFactLabel')}</strong> {currentQuestion.fun_fact}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-white/50">{t('host.noQuestionData')}</div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">{t('host.quizProgress')}</h3>
              <div>
                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>{t('host.questionsProgressLabel')}</span>
                  <span>{currentQuestionIndex + 1} / {allQuestions.length}</span>
                </div>
                <div className="h-3 bg-qb-darker rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-qb-cyan to-qb-purple transition-all"
                    style={{ width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t('host.liveStats')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-white">
                  <span>{t('host.totalPlayers')}:</span>
                  <span className="font-bold text-qb-cyan">{players.length}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>{t('host.active')}:</span>
                  <span className="font-bold text-green-400">
                    {players.filter(p => p.is_connected).length}
                  </span>
                </div>
              </div>
            </Card>

            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                {t('host.leaderboard')}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {players.length === 0 ? (
                  <div className="text-center py-8 text-white/50">{t('host.noPlayersYet')}</div>
                ) : (
                  players
                    .sort((a, b) => b.total_score - a.total_score)
                    .slice(0, 10)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          index === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-qb-darker'
                        }`}
                      >
                        <div className="text-2xl">{index + 1}</div>
                        <div className="text-2xl">{player.avatar_emoji}</div>
                        <div className="flex-1 text-white truncate">{player.player_name}</div>
                        <div className="text-xl font-bold text-qb-cyan">{player.total_score}</div>
                      </div>
                    ))
                )}
              </div>
            </Card>

            <Card gradient className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('host.players')} ({players.length})
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RefreshCw />}
                  onClick={() => currentSession?.id && loadPlayers(currentSession.id)}
                >
                  {t('host.refresh')}
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 p-2 bg-qb-darker rounded-lg">
                    <div className="text-xl">{player.avatar_emoji}</div>
                    <div className="flex-1 text-white text-sm truncate">{player.player_name}</div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: player.is_connected ? '#10B981' : '#EF4444' }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
