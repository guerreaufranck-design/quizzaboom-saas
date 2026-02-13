import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { supabase } from '../services/supabase/client';
import { Card } from '../components/ui/Card';
import { Clock, Trophy, Star } from 'lucide-react';
import type { Player } from '../types/quiz';
import { useQuizAudio } from '../hooks/useQuizAudio';
import { AnimatedLogo } from '../components/AnimatedLogo';

/**
 * Adaptive text sizing: returns a Tailwind class based on string length.
 * Ensures long questions/themes/promos don't overflow the TV viewport.
 */
const getAdaptiveTextSize = (
  text: string,
  sizes: { sm: string; md: string; lg: string; xl: string }
): string => {
  const len = text.length;
  if (len > 100) return sizes.sm;
  if (len > 60) return sizes.md;
  if (len > 30) return sizes.lg;
  return sizes.xl;
};

/**
 * Adaptive text size for answer options — based on the longest option in the set.
 */
const getAdaptiveOptionSize = (options: string[]): string => {
  const maxLen = Math.max(...options.map(o => o.length));
  if (maxLen > 80) return 'text-base';
  if (maxLen > 50) return 'text-lg';
  if (maxLen > 30) return 'text-xl';
  return 'text-2xl';
};

export const TVDisplay: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentPhase,
    phaseTimeRemaining,
    currentQuestion,
    currentThemeTitle,
    allQuestions,
    listenToPhaseChanges,
    loadQuestions,
    breakPromoMessage,
    breakNumber,
    totalBreaks,
  } = useStrategicQuizStore();
  const { stopAll, onPhaseChange } = useQuizAudio();

  const [sessionCode, setSessionCode] = useState<string>('');
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const initTVDisplay = async () => {
      const params = new URLSearchParams(window.location.search);
      const tvCode = params.get('code') || params.get('tv');

      console.log('📺 TV Display initializing with code:', tvCode);

      if (!tvCode) {
        console.error('❌ No TV code in URL');
        return;
      }

      setSessionCode(tvCode);

      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('session_code', tvCode)
        .single();

      if (sessionError || !session) {
        console.error('❌ Session not found:', sessionError);
        return;
      }

      console.log('✅ Session loaded:', session.id);

      const { data: quiz, error: quizError } = await supabase
        .from('ai_generated_quizzes')
        .select('*')
        .eq('id', session.quiz_id)
        .single();

      if (quizError || !quiz) {
        console.error('❌ Quiz not found:', quizError);
        return;
      }

      console.log('✅ Quiz loaded:', quiz.title);

      await loadQuestions(quiz.id);
      console.log('✅ Questions loaded');

      listenToPhaseChanges(tvCode);
      console.log('✅ Listening to phase changes');

      loadTopPlayers(session.id);
      console.log('✅ Players loaded');

      setIsReady(true);
    };

    initTVDisplay();
  }, []);

  useEffect(() => {
    // Hide instructions when timer starts (theme_announcement duration is 11s)
    if (currentPhase === 'theme_announcement' && phaseTimeRemaining < 11 && showInstructions) {
      setShowInstructions(false);
    }
  }, [currentPhase, phaseTimeRemaining]);

  // Trigger tick-tock audio per phase
  useEffect(() => {
    if (currentPhase !== 'theme_announcement' || !showInstructions) {
      onPhaseChange(currentPhase, phaseTimeRemaining);
    }
  }, [currentPhase]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const loadTopPlayers = async (sessionId: string) => {
    const { data: players } = await supabase
      .from('session_players')
      .select('*')
      .eq('session_id', sessionId)
      .order('total_score', { ascending: false })
      .limit(10);

    if (players) {
      setTopPlayers(players as Player[]);
    }
  };

  // Refresh leaderboard during results, intermission, commercial_break, and quiz_complete phases
  useEffect(() => {
    if ((currentPhase === 'results' || currentPhase === 'intermission' || currentPhase === 'commercial_break' || currentPhase === 'quiz_complete') && sessionCode) {
      // Fetch immediately on phase entry
      (async () => {
        const { data: session } = await supabase
          .from('quiz_sessions')
          .select('id')
          .eq('session_code', sessionCode)
          .single();
        if (session) loadTopPlayers(session.id);
      })();

      const interval = setInterval(async () => {
        const { data: session } = await supabase
          .from('quiz_sessions')
          .select('id')
          .eq('session_code', sessionCode)
          .single();

        if (session) {
          loadTopPlayers(session.id);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentPhase, sessionCode]);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 0: Instructions Screen — compact, fits 1080p
  // ═══════════════════════════════════════════════════════════════
  if (showInstructions || !isReady || allQuestions.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-br from-qb-purple via-qb-dark to-qb-cyan p-3 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Header — no logo, saves ~120px */}
          <div className="text-center mb-1">
            <h1 className="text-3xl font-bold text-white">{t('tv.howToPlay')}</h1>
            <p className="text-lg text-yellow-300 font-bold">{t('tv.followSteps')}</p>
          </div>

          {/* Steps - Ultra compact for 720p */}
          <div className="space-y-1.5 flex-1 min-h-0">
            {/* Step 1: Join */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-2.5 border border-white/30">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📱</div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">{t('tv.step1Title')}</h2>
                  <p className="text-base text-white/90">
                    {t('tv.step1DescQR')} <span className="text-yellow-300 font-bold">{t('tv.step1DescCode')}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Email */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-2.5 border border-yellow-300 shadow-lg shadow-yellow-500/50 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="text-2xl animate-bounce">📧</div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{t('tv.step2Title')}</h2>
                  <p className="text-base text-gray-900 font-bold">
                    {t('tv.step2Desc')}
                    <span className="ml-2">{t('tv.step2Ranking')}</span>
                    <span className="ml-2">{t('tv.step2Statistics')}</span>
                    <span className="ml-2">{t('tv.step2Certificate')}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Jokers */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-2.5 border border-purple-400">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">{t('tv.step3Title')}</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-white/90">
                      {t('tv.step3During')}
                    </p>
                    <div className="flex gap-1.5">
                      <div className="bg-blue-500/30 rounded px-1.5 py-0.5 text-center">
                        <span className="text-base">🛡️</span>
                        <span className="text-xs text-white ml-1">{t('tv.jokerProtection')}</span>
                      </div>
                      <div className="bg-red-500/30 rounded px-1.5 py-0.5 text-center">
                        <span className="text-base">🚫</span>
                        <span className="text-xs text-white ml-1">{t('tv.jokerBlock')}</span>
                      </div>
                      <div className="bg-yellow-500/30 rounded px-1.5 py-0.5 text-center">
                        <span className="text-base">💰</span>
                        <span className="text-xs text-white ml-1">{t('tv.jokerSteal')}</span>
                      </div>
                      <div className="bg-green-500/30 rounded px-1.5 py-0.5 text-center">
                        <span className="text-base">⭐</span>
                        <span className="text-xs text-white ml-1">{t('tv.jokerDouble')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Phases */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-2.5 border border-cyan-400">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⏱️</div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">{t('tv.step4Title')}</h2>
                  <div className="grid grid-cols-2 gap-1 text-sm text-white/90">
                    <div className="bg-purple-500/20 px-2 py-0.5 rounded">{t('tv.step4PhaseTheme')}</div>
                    <div className="bg-blue-500/20 px-2 py-0.5 rounded">{t('tv.step4PhaseQuestion')}</div>
                    <div className="bg-cyan-500/20 px-2 py-0.5 rounded">{t('tv.step4PhaseAnswer')}</div>
                    <div className="bg-green-500/20 px-2 py-0.5 rounded">{t('tv.step4PhaseResults')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-center mt-1.5">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-2.5">
              <p className="text-xl font-bold text-white">
                {t('tv.waitingForHost')}
              </p>
              <p className="text-base text-white/90 font-mono">
                {t('tv.sessionLabel')} <span className="font-bold">{sessionCode}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // COMMERCIAL BREAK: Promo screen — constrained for viewport
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'commercial_break') {
    const breakMinutes = Math.floor(phaseTimeRemaining / 60);
    const breakSeconds = phaseTimeRemaining % 60;
    const breakTimeDisplay = `${breakMinutes}:${breakSeconds.toString().padStart(2, '0')}`;

    const promoTextClass = breakPromoMessage
      ? getAdaptiveTextSize(breakPromoMessage, { xl: 'text-5xl', lg: 'text-4xl', md: 'text-3xl', sm: 'text-2xl' })
      : '';

    return (
      <div className="h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-4 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center justify-between h-full relative z-10">
          {/* Top: Logo — constrained */}
          <div className="text-center w-full max-h-20 overflow-hidden">
            <AnimatedLogo banner className="mx-auto max-w-3xl" />
          </div>

          {/* Middle: Promo + countdown */}
          <div className="flex-1 flex flex-col items-center justify-center w-full space-y-4 min-h-0">
            {breakNumber > 0 && totalBreaks > 0 && (
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl px-6 py-2 border border-white/20">
                <p className="text-2xl text-white font-bold uppercase tracking-wider">
                  {t('tv.breakPauseNumber', { current: breakNumber, total: totalBreaks })}
                </p>
              </div>
            )}

            {breakPromoMessage ? (
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border-4 border-yellow-300/60 shadow-2xl shadow-yellow-500/20 w-full max-w-4xl">
                <p className={`font-bold text-yellow-300 text-center leading-tight ${promoTextClass}`}>
                  {breakPromoMessage}
                </p>
              </div>
            ) : (
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/20 w-full max-w-4xl">
                <p className="text-5xl font-bold text-white text-center">
                  {t('tv.breakPause')}
                </p>
                <p className="text-2xl text-white/70 text-center mt-2">
                  {t('tv.quizResumeShortly')}
                </p>
              </div>
            )}

            {/* Countdown */}
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-10 py-4 border-2 border-white/20">
              <div className="flex items-center gap-4">
                <Clock className="w-10 h-10 text-white animate-pulse" />
                <span className="text-7xl font-mono font-bold text-white">{breakTimeDisplay}</span>
              </div>
            </div>
          </div>

          {/* Bottom: Branding */}
          <div className="text-center w-full">
            <div className="inline-block bg-black/40 backdrop-blur-xl rounded-2xl px-8 py-2 border border-white/20">
              <p className="text-lg text-white font-bold">
                {t('tv.poweredBy')} <span className="text-yellow-300">QuizzaBoom</span> · contact@quizzaboom.app
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ COMPLETE: Top 5 final leaderboard — fits viewport
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'quiz_complete') {
    return (
      <div className="h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-4 overflow-hidden relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-6xl mx-auto h-full flex flex-col relative z-10">
          {/* Thank you header — compact */}
          <div className="text-center mb-2">
            <h1 className="text-5xl font-bold text-white uppercase tracking-wider">
              {t('tv.thankYou')}
            </h1>
            <p className="text-xl text-white/90 font-medium">
              {t('tv.thankYouMessage')}
            </p>
          </div>

          {/* Final Leaderboard — top 5 only */}
          {topPlayers.length > 0 && (
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 border-2 border-yellow-400/50 flex-1 min-h-0">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                <Trophy className="w-7 h-7 text-yellow-300" />
                {t('tv.finalRanking')}
                <Trophy className="w-7 h-7 text-yellow-300" />
              </h2>
              <div className="space-y-1.5">
                {topPlayers.slice(0, 5).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      index === 0
                        ? 'bg-yellow-500/40 border-2 border-yellow-300 scale-[1.02] shadow-lg shadow-yellow-500/30'
                        : index === 1
                        ? 'bg-gray-400/20 border border-gray-300'
                        : index === 2
                        ? 'bg-orange-700/30 border border-orange-500'
                        : 'bg-white/10 border border-white/20'
                    }`}
                  >
                    <div className="text-2xl font-bold text-white/80 w-12 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="text-2xl">{player.avatar_emoji}</div>
                    <div className="flex-1">
                      <div className="text-xl font-bold text-white">
                        {player.player_name}
                      </div>
                      <div className="text-sm text-white/70">
                        {t('tv.playerStats', { correct: player.correct_answers, total: player.questions_answered })}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-yellow-300">
                      {player.total_score}
                      {index === 0 && <Star className="inline w-6 h-6 ml-2 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer — compact */}
          <div className="text-center mt-2">
            <div className="inline-block bg-black/30 backdrop-blur-xl rounded-xl px-6 py-2 border border-white/20">
              <p className="text-lg text-white font-bold">
                {t('tv.poweredBy')} <span className="text-yellow-300">QuizzaBoom</span> · quizzaboom.app
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: Theme Announcement — adaptive theme name
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'theme_announcement') {
    const themeName = currentThemeTitle || currentQuestion?.stage_id || t('tv.defaultTheme');
    const themeTextClass = getAdaptiveTextSize(themeName, { xl: 'text-6xl', lg: 'text-5xl', md: 'text-4xl', sm: 'text-3xl' });

    return (
      <div className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center max-w-6xl w-full flex flex-col items-center justify-center h-full">
          <div className="text-7xl mb-4 animate-bounce">🎯</div>
          <h1 className="text-6xl font-bold text-white mb-4 uppercase tracking-wider">
            {t('tv.nextTheme')}
          </h1>
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 mb-6 w-full">
            <p className={`font-bold text-yellow-300 ${themeTextClass}`}>
              {themeName}
            </p>
          </div>
          <div className="mb-4 text-3xl text-white/90 bg-white/10 rounded-2xl p-4 inline-block">
            {t('tv.useJokersNow')}
          </div>
          <div className="flex items-center justify-center gap-4 text-white">
            <Clock className="w-12 h-12 animate-pulse" />
            <span className="text-7xl font-mono font-bold">{phaseTimeRemaining}</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: Question Display — adaptive question text
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'question_display') {
    const questionText = currentQuestion?.question_text || t('common.loading');
    const questionTextClass = getAdaptiveTextSize(questionText, { xl: 'text-6xl', lg: 'text-5xl', md: 'text-4xl', sm: 'text-3xl' });

    return (
      <div className="h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 flex items-center justify-center p-8 overflow-hidden">
        <div className="max-w-6xl w-full text-center flex flex-col items-center justify-center h-full">
          <div className="text-6xl mb-4">📖</div>
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 mb-6 w-full">
            <h2 className={`font-bold text-white leading-tight ${questionTextClass}`}>
              {questionText}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-4 text-white">
            <Clock className="w-12 h-12 animate-pulse" />
            <span className="text-7xl font-mono font-bold">{phaseTimeRemaining}</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: Answer Selection — adaptive question + compact grid
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'answer_selection') {
    const questionText = currentQuestion?.question_text || '';
    const answerQuestionClass = getAdaptiveTextSize(questionText, { xl: 'text-4xl', lg: 'text-3xl', md: 'text-2xl', sm: 'text-xl' });
    const options = currentQuestion?.options || [];
    const optionTextClass = getAdaptiveOptionSize(options);
    const maxOptionLen = Math.max(...options.map(o => o.length), 0);
    const gridCols = maxOptionLen > 60 ? 'grid-cols-1' : 'grid-cols-2';

    return (
      <div className="h-screen bg-qb-dark p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col justify-between">
          <div className="text-center">
            <div className="inline-flex items-center gap-4 px-8 py-3 bg-qb-cyan/20 rounded-3xl">
              <Clock className="w-10 h-10 text-qb-cyan animate-pulse" />
              <span className="text-6xl font-mono font-bold text-white">
                {phaseTimeRemaining}
              </span>
            </div>
          </div>

          <Card className="p-6 bg-gradient-to-br from-qb-purple/30 to-qb-cyan/30 border-white/20 flex-1 min-h-0 my-4">
            <h2 className={`font-bold text-white text-center mb-4 ${answerQuestionClass}`}>
              {currentQuestion?.question_text}
            </h2>

            <div className={`grid ${gridCols} gap-3`}>
              {options.map((option, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-qb-darker border-2 border-white/20 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-white">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                  </div>
                  <span className={`${optionTextClass} text-white font-medium flex-1`}>
                    {option}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: Results — compact
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'results') {
    const correctAnswer = currentQuestion?.correct_answer || '';
    const correctAnswerClass = getAdaptiveTextSize(correctAnswer, { xl: 'text-4xl', lg: 'text-3xl', md: 'text-2xl', sm: 'text-xl' });

    return (
      <div className="h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col items-center justify-center">
          <div className="text-6xl mb-3 animate-bounce">✅</div>
          <h1 className="text-5xl font-bold text-white mb-6">{t('tv.correctAnswer')}</h1>
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 mb-6">
            <p className={`${correctAnswerClass} font-bold text-white`}>
              {correctAnswer}
            </p>
          </div>

          <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/10 rounded-3xl">
            <Clock className="w-10 h-10 text-white" />
            <span className="text-5xl font-mono font-bold text-white">
              {phaseTimeRemaining}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: Intermission — Top 3 Leaderboard
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'intermission') {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 p-6 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-between">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-4">
              <Trophy className="w-10 h-10 text-yellow-300" />
              {t('tv.leaderboard')}
              <Trophy className="w-10 h-10 text-yellow-300" />
            </h1>
          </div>

          {topPlayers.length > 0 ? (
            <div className="space-y-3 flex-1 min-h-0 my-4">
              {topPlayers.slice(0, 3).map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl ${
                    index === 0
                      ? 'bg-yellow-500/30 border-4 border-yellow-400 scale-105'
                      : index === 1
                      ? 'bg-gray-400/20 border-2 border-gray-300'
                      : 'bg-orange-700/20 border-2 border-orange-600'
                  }`}
                >
                  <div className="text-4xl font-bold text-white/80 w-16 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="text-3xl">{player.avatar_emoji}</div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-white">
                      {player.player_name}
                    </div>
                    <div className="text-lg text-white/70">
                      {t('tv.playerStats', { correct: player.correct_answers, total: player.questions_answered })}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-300">
                    {player.total_score}
                    {index === 0 && <Star className="inline w-8 h-8 ml-3 text-yellow-400" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 animate-pulse">⏸️</div>
              <p className="text-4xl text-white/70">{t('tv.getReady')}</p>
            </div>
          )}

          <div className="text-center flex items-center justify-center gap-4">
            <AnimatedLogo size="sm" />
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-qb-cyan/20 rounded-2xl">
              <p className="text-2xl text-white/80">{t('tv.nextQuestionIn')}</p>
              <span className="text-4xl font-mono font-bold text-qb-cyan">
                {phaseTimeRemaining}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Default
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="h-screen bg-qb-dark flex items-center justify-center overflow-hidden">
      <div className="text-center">
        <div className="text-7xl mb-6">📺</div>
        <h1 className="text-5xl font-bold text-white mb-4">{t('tv.displayMode')}</h1>
        <p className="text-2xl text-white/70 mb-6">{t('tv.sessionLabel')} {sessionCode}</p>
        <p className="text-xl text-white/50">{t('tv.displayModeWaiting')}</p>
      </div>
    </div>
  );
};
