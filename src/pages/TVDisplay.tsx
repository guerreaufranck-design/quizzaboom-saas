import React, { useEffect, useState } from 'react';
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

export const TVDisplay: React.FC = () => {
  const {
    currentPhase,
    phaseTimeRemaining,
    currentQuestion,
    currentThemeTitle,
    allQuestions,
    listenToPhaseChanges,
    loadQuestions,
  } = useStrategicQuizStore();
  const { stopAll, onPhaseChange } = useQuizAudio();

  const [sessionCode, setSessionCode] = useState<string>('');
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [breakPromoMessage, setBreakPromoMessage] = useState<string>('');
  const [breakNumber, setBreakNumber] = useState(0);
  const [totalBreaks, setTotalBreaks] = useState(0);

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

  // Listen for commercial break data from phase broadcasts
  useEffect(() => {
    if (!sessionCode) return;

    const channelName = `quiz_session_${sessionCode}`;
    const breakChannel = supabase.channel(`${channelName}_break_listener`);

    breakChannel
      .on('broadcast', { event: 'phase_change' }, (payload: { payload: { phase: string; promoMessage?: string; breakNumber?: number; totalBreaks?: number } }) => {
        const data = payload.payload;
        if (data.phase === 'commercial_break') {
          setBreakPromoMessage(data.promoMessage || '');
          setBreakNumber(data.breakNumber || 0);
          setTotalBreaks(data.totalBreaks || 0);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(breakChannel);
    };
  }, [sessionCode]);

  useEffect(() => {
    // Hide instructions when timer starts (theme_announcement duration is 7s)
    if (currentPhase === 'theme_announcement' && phaseTimeRemaining < 7 && showInstructions) {
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
      <div className="h-screen bg-gradient-to-br from-qb-purple via-qb-dark to-qb-cyan p-6 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-3">
            <AnimatedLogo size="md" className="mx-auto mb-2" />
            <h1 className="text-5xl font-bold text-white mb-1">HOW TO PLAY</h1>
            <p className="text-2xl text-yellow-300 font-bold">Follow these 4 steps!</p>
          </div>

          {/* Steps - Compact */}
          <div className="space-y-3 flex-1 min-h-0">
            {/* Step 1: Join */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/30">
              <div className="flex items-center gap-4">
                <div className="text-4xl">📱</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">1. JOIN THE GAME</h2>
                  <p className="text-xl text-white/90">
                    Scan the <span className="text-yellow-300 font-bold">QR code</span> or enter session code
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Email */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 border-4 border-yellow-300 shadow-2xl shadow-yellow-500/50 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="text-4xl animate-bounce">📧</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">2. ENTER YOUR EMAIL!</h2>
                  <p className="text-xl text-gray-900 font-bold">
                    🎁 Receive your PERSONALIZED RESULTS
                  </p>
                  <div className="flex gap-4 text-lg text-gray-900">
                    <span>✅ Ranking</span>
                    <span>✅ Statistics</span>
                    <span>✅ Certificate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Jokers */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-purple-400">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎯</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">3. USE JOKERS</h2>
                  <p className="text-xl text-white/90 mb-1">
                    Activate during <span className="text-purple-300 font-bold">THEME phase</span> (7s):
                  </p>
                  <div className="flex gap-2">
                    <div className="bg-blue-500/30 rounded-lg px-2 py-1 text-center">
                      <div className="text-2xl">🛡️</div>
                      <div className="text-xs text-white">Protection</div>
                    </div>
                    <div className="bg-red-500/30 rounded-lg px-2 py-1 text-center">
                      <div className="text-2xl">🚫</div>
                      <div className="text-xs text-white">Block</div>
                    </div>
                    <div className="bg-yellow-500/30 rounded-lg px-2 py-1 text-center">
                      <div className="text-2xl">💰</div>
                      <div className="text-xs text-white">Steal</div>
                    </div>
                    <div className="bg-green-500/30 rounded-lg px-2 py-1 text-center">
                      <div className="text-2xl">⭐</div>
                      <div className="text-xs text-white">Double</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Phases */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-cyan-400">
              <div className="flex items-center gap-4">
                <div className="text-4xl">⏱️</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">4. GAME FLOW</h2>
                  <div className="grid grid-cols-2 gap-2 text-lg text-white/90">
                    <div className="bg-purple-500/20 p-1.5 rounded">🎯 Theme (7s) → Jokers</div>
                    <div className="bg-blue-500/20 p-1.5 rounded">📖 Question (10s) → Read</div>
                    <div className="bg-cyan-500/20 p-1.5 rounded">✍️ Answer (17s) → Choose</div>
                    <div className="bg-green-500/20 p-1.5 rounded">📊 Results (10s) → Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-center mt-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4">
              <p className="text-3xl font-bold text-white mb-1">
                🚀 Waiting for host to start...
              </p>
              <p className="text-xl text-white/90 font-mono">
                Session: <span className="font-bold">{sessionCode}</span>
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
      <div className="h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-6 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center justify-between h-full relative z-10">
          {/* Top: Logo — constrained height */}
          <div className="text-center w-full max-h-24 overflow-hidden mb-4">
            <AnimatedLogo banner className="mx-auto max-w-3xl" />
          </div>

          {/* Middle: Promo + countdown */}
          <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6 min-h-0">
            {breakNumber > 0 && totalBreaks > 0 && (
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl px-6 py-2 border border-white/20">
                <p className="text-2xl text-white font-bold uppercase tracking-wider">
                  ☕ PAUSE {breakNumber}/{totalBreaks}
                </p>
              </div>
            )}

            {breakPromoMessage ? (
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border-4 border-yellow-300/60 shadow-2xl shadow-yellow-500/20 w-full max-w-4xl">
                <p className={`font-bold text-yellow-300 text-center leading-tight ${promoTextClass}`}>
                  {breakPromoMessage}
                </p>
              </div>
            ) : (
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/20 w-full max-w-4xl">
                <p className="text-5xl font-bold text-white text-center">
                  ☕ PAUSE
                </p>
                <p className="text-2xl text-white/70 text-center mt-3">
                  The quiz will resume shortly!
                </p>
              </div>
            )}

            {/* Countdown */}
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-12 py-6 border-2 border-white/20">
              <div className="flex items-center gap-4">
                <Clock className="w-10 h-10 text-white animate-pulse" />
                <span className="text-7xl font-mono font-bold text-white">{breakTimeDisplay}</span>
              </div>
            </div>
          </div>

          {/* Bottom: Branding */}
          <div className="text-center w-full mt-4">
            <div className="inline-block bg-black/40 backdrop-blur-xl rounded-2xl px-8 py-3 border border-white/20">
              <p className="text-xl text-white font-bold">
                Powered by <span className="text-yellow-300">QuizzaBoom</span>
              </p>
              <p className="text-lg text-white/80 mt-1 font-medium">
                contact@quizzaboom.app
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
      <div className="h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-6 overflow-hidden relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-6xl mx-auto h-full flex flex-col relative z-10">
          {/* Thank you header */}
          <div className="text-center mb-4">
            <div className="text-6xl mb-2 animate-bounce">🎉</div>
            <h1 className="text-6xl font-bold text-white mb-2 uppercase tracking-wider">
              THANK YOU!
            </h1>
            <p className="text-2xl text-white/90 font-medium">
              Thank you so much for your participation!
            </p>
          </div>

          {/* Final Leaderboard — top 5 only */}
          {topPlayers.length > 0 && (
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 border-2 border-yellow-400/50 flex-1 min-h-0">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-300" />
                FINAL RANKING
                <Trophy className="w-8 h-8 text-yellow-300" />
              </h2>
              <div className="space-y-2">
                {topPlayers.slice(0, 5).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${
                      index === 0
                        ? 'bg-yellow-500/40 border-4 border-yellow-300 scale-105 shadow-lg shadow-yellow-500/30'
                        : index === 1
                        ? 'bg-gray-400/20 border-2 border-gray-300'
                        : index === 2
                        ? 'bg-orange-700/30 border-2 border-orange-500'
                        : 'bg-white/10 border border-white/20'
                    }`}
                  >
                    <div className="text-3xl font-bold text-white/80 w-16 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="text-3xl">{player.avatar_emoji}</div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-white">
                        {player.player_name}
                      </div>
                      <div className="text-base text-white/70">
                        {player.correct_answers}/{player.questions_answered} correct
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-yellow-300">
                      {player.total_score}
                      {index === 0 && <Star className="inline w-8 h-8 ml-2 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-4">
            <div className="inline-block bg-black/30 backdrop-blur-xl rounded-2xl px-8 py-3 border border-white/20">
              <AnimatedLogo size="sm" className="mx-auto mb-1" />
              <p className="text-xl text-white font-bold">
                Powered by <span className="text-yellow-300">QuizzaBoom</span>
              </p>
              <p className="text-base text-white/60">quizzaboom.app</p>
              <p className="text-base text-white/50">contact@quizzaboom.app</p>
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
    const themeName = currentThemeTitle || currentQuestion?.stage_id || 'General Knowledge';
    const themeTextClass = getAdaptiveTextSize(themeName, { xl: 'text-6xl', lg: 'text-5xl', md: 'text-4xl', sm: 'text-3xl' });

    return (
      <div className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center max-w-6xl w-full flex flex-col items-center justify-center h-full">
          <div className="text-7xl mb-4 animate-bounce">🎯</div>
          <h1 className="text-6xl font-bold text-white mb-4 uppercase tracking-wider">
            NEXT THEME
          </h1>
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 mb-6 w-full">
            <p className={`font-bold text-yellow-300 ${themeTextClass}`}>
              {themeName}
            </p>
          </div>
          <div className="mb-4 text-3xl text-white/90 bg-white/10 rounded-2xl p-4 inline-block">
            ⚡ Use your JOKERS now! ⚡
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
    const questionText = currentQuestion?.question_text || 'Loading...';
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
            <h2 className={`font-bold text-white text-center mb-6 ${answerQuestionClass}`}>
              {currentQuestion?.question_text}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion?.options?.map((option, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-qb-darker border-2 border-white/20 flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-3xl font-bold text-white">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                  </div>
                  <span className="text-2xl text-white font-medium flex-1">
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
    return (
      <div className="h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col items-center justify-center">
          <div className="text-6xl mb-3 animate-bounce">✅</div>
          <h1 className="text-5xl font-bold text-white mb-6">CORRECT ANSWER</h1>
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 mb-6">
            <p className="text-4xl font-bold text-white">
              {currentQuestion?.correct_answer}
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
              LEADERBOARD
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
                      {player.correct_answers}/{player.questions_answered} correct
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
              <p className="text-4xl text-white/70">GET READY!</p>
            </div>
          )}

          <div className="text-center flex items-center justify-center gap-4">
            <AnimatedLogo size="sm" />
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-qb-cyan/20 rounded-2xl">
              <p className="text-2xl text-white/80">Next question in</p>
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
        <h1 className="text-5xl font-bold text-white mb-4">TV Display Mode</h1>
        <p className="text-2xl text-white/70 mb-6">Session: {sessionCode}</p>
        <p className="text-xl text-white/50">Waiting for quiz to start...</p>
      </div>
    </div>
  );
};
