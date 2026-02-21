import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { supabase } from '../services/supabase/client';
import { QRCodeDisplay } from '../components/ui/QRCodeDisplay';
import { Clock, Trophy, Star, Lightbulb, Users, Award } from 'lucide-react';
import type { Player } from '../types/quiz';
import { calculateTeamScores, getMVP } from '../utils/teamScores';
import { calculateBadges } from '../utils/badges';
import { useQuizAudio } from '../hooks/useQuizAudio';
import { useCountdown } from '../hooks/useCountdown';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { CommentaryPopupChain } from '../components/CommentaryPopupChain';
import { TutorialSlides } from '../components/TutorialSlides';
import { AutoFitText } from '../components/AutoFitText';

/**
 * Adaptive text sizing: returns a Tailwind class based on string length.
 * Ensures long questions/themes/promos don't overflow the TV viewport.
 */
const getAdaptiveTextSize = (
  text: string,
  sizes: { sm: string; md: string; lg: string; xl: string }
): string => {
  const len = text.length;
  if (len > 150) return sizes.sm;
  if (len > 100) return sizes.md;
  if (len > 50) return sizes.lg;
  return sizes.xl;
};

/**
 * Distinct color schemes for answer options A/B/C/D — cartoon pub quiz style.
 */
const OPTION_COLORS = [
  { bg: 'from-red-500 to-orange-500', border: 'border-red-400', label: 'bg-red-700', letter: 'A' },
  { bg: 'from-blue-500 to-indigo-500', border: 'border-blue-400', label: 'bg-blue-700', letter: 'B' },
  { bg: 'from-green-500 to-emerald-500', border: 'border-green-400', label: 'bg-green-700', letter: 'C' },
  { bg: 'from-purple-500 to-pink-500', border: 'border-purple-400', label: 'bg-purple-700', letter: 'D' },
];

/** CSS animations for cartoon TV display */
const TV_ANIMATIONS = `
  @keyframes pop-in { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes slide-up { 0% { transform: translateY(30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
  @keyframes timer-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
  .anim-pop { animation: pop-in 0.5s ease-out forwards; }
  .anim-slide { animation: slide-up 0.4s ease-out forwards; }
  .anim-timer { animation: timer-pulse 1s ease-in-out infinite; }
`;

export const TVDisplay: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentPhase,
    phaseTimeRemaining,
    phaseEndTime,
    currentQuestion,
    currentThemeTitle,
    currentQuestionIndex,
    allQuestions,
    listenToPhaseChanges,
    loadQuestions,
    breakPromoMessage,
    breakNumber,
    totalBreaks,
    answeredCount,
    commentaryPopups,
    tutorialSlides,
  } = useStrategicQuizStore();
  const { stopAll, onPhaseChange } = useQuizAudio();
  const displaySeconds = useCountdown(phaseEndTime);

  const [sessionCode, setSessionCode] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [questionImgVisible, setQuestionImgVisible] = useState(true);
  const [answerImgVisible, setAnswerImgVisible] = useState(true);
  const preloadedRef = useRef(false);

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

      // Detect team mode
      const settings = (session.settings as Record<string, unknown>) || {};
      if (session.team_mode || settings.teamMode) {
        setIsTeamMode(true);
      }

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

      // Set i18n language to match quiz language (TV may be on different device)
      if (quiz.language && ['en', 'fr', 'de', 'es'].includes(quiz.language)) {
        const { default: i18n } = await import('../i18n');
        if (i18n.language !== quiz.language) {
          await i18n.changeLanguage(quiz.language);
          console.log('🌐 TV language set to:', quiz.language);
        }
      }

      await loadQuestions(quiz.id);
      console.log('✅ Questions loaded');

      listenToPhaseChanges(tvCode);
      console.log('✅ Listening to phase changes');

      setSessionId(session.id);
      loadTopPlayers(session.id);
      console.log('✅ Players loaded');

      setIsReady(true);
    };

    initTVDisplay();
  }, []);

  // Preload all question images when questions are loaded
  useEffect(() => {
    if (allQuestions.length > 0 && !preloadedRef.current) {
      preloadedRef.current = true;
      allQuestions.forEach(q => {
        if (q.image_url) {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => new Set(prev).add(q.image_url!));
          };
          img.onerror = () => {
            // Mark as loaded (will be hidden by onError handler in render)
            setLoadedImages(prev => new Set(prev).add(q.image_url!));
          };
          img.src = q.image_url;
        }
      });
    }
  }, [allQuestions]);

  // Reset image visibility when question changes
  useEffect(() => {
    setQuestionImgVisible(true);
    setAnswerImgVisible(true);
  }, [currentQuestion?.question_text]);

  useEffect(() => {
    // Hide instructions as soon as the host starts the quiz (any active phase received)
    if (showInstructions && phaseEndTime && phaseEndTime > 0) {
      setShowInstructions(false);
    }
  }, [currentPhase, phaseEndTime]);

  // Lobby poll: while waiting (showInstructions=true), poll DB every 3s to detect quiz start
  // This catches the case where the Realtime broadcast is missed (e.g. tutorial phase)
  useEffect(() => {
    if (!showInstructions || !sessionId) return;

    let active = true;
    const pollForStart = async () => {
      try {
        const { data: session } = await supabase
          .from('quiz_sessions')
          .select('settings')
          .eq('id', sessionId)
          .single();

        if (!active || !session?.settings) return;

        const settings = session.settings as Record<string, unknown>;
        const dbPhase = settings.currentPhase as Record<string, unknown> | undefined;

        if (dbPhase?.phase && dbPhase.phaseEndTime) {
          console.log('📺 Lobby poll: host started quiz, phase:', dbPhase.phase);
          useStrategicQuizStore.getState().setPhaseData(dbPhase as never);
          setShowInstructions(false);
        }
      } catch (err) {
        console.error('Lobby poll error:', err);
      }
    };

    const interval = setInterval(pollForStart, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [showInstructions, sessionId]);

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

  const loadTopPlayers = async (sid: string) => {
    const { data: playersData } = await supabase
      .from('session_players')
      .select('*')
      .eq('session_id', sid)
      .order('total_score', { ascending: false });

    if (playersData) {
      setTopPlayers(playersData as Player[]);
    }
  };

  // Refresh leaderboard during results, intermission, commercial_break, and quiz_complete phases
  useEffect(() => {
    if ((currentPhase === 'results' || currentPhase === 'intermission' || currentPhase === 'commercial_break' || currentPhase === 'quiz_complete') && sessionId) {
      // Fetch immediately on phase entry
      loadTopPlayers(sessionId);

      const interval = setInterval(() => {
        loadTopPlayers(sessionId);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [currentPhase, sessionId]);

  // Fallback: if timer expired but phase didn't change (broadcast missed), poll DB for current phase
  useEffect(() => {
    // Only activate when timer has reached 0 and we have a session
    if (displaySeconds > 0 || !sessionId || !currentPhase) return;
    // Don't poll during waiting/instructions or quiz_complete
    if (currentPhase === 'quiz_complete' || !phaseEndTime) return;

    let active = true;
    const pollPhaseFromDB = async () => {
      try {
        const { data: session } = await supabase
          .from('quiz_sessions')
          .select('settings')
          .eq('id', sessionId)
          .single();

        if (!active || !session?.settings) return;

        const settings = session.settings as Record<string, unknown>;
        const dbPhase = settings.currentPhase as Record<string, unknown> | undefined;

        if (dbPhase?.phase && dbPhase.phaseEndTime) {
          const dbEndTime = dbPhase.phaseEndTime as number;
          const localEndTime = phaseEndTime || 0;
          // Only sync if DB phase is newer (higher phaseEndTime)
          if (dbEndTime > localEndTime && dbPhase.phase !== currentPhase) {
            console.log('🔄 TV fallback: NEWER phase detected, syncing from DB:', dbPhase.phase);
            useStrategicQuizStore.getState().setPhaseData(dbPhase as never);
          }
        }
      } catch (err) {
        console.error('TV fallback poll error:', err);
      }
    };

    // Start polling after a 2s grace period (give broadcast time to arrive)
    const timeout = setTimeout(() => {
      if (!active) return;
      pollPhaseFromDB();
      // Then poll every 3s until phase changes
      const interval = setInterval(pollPhaseFromDB, 3000);
      const cleanup = () => clearInterval(interval);
      if (!active) cleanup();
      else {
        // Store cleanup for when effect re-runs
        cleanupRef.current = cleanup;
      }
    }, 2000);

    const cleanupRef = { current: () => {} };

    return () => {
      active = false;
      clearTimeout(timeout);
      cleanupRef.current();
    };
  }, [displaySeconds, sessionId, currentPhase, phaseEndTime]);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 0: QR Code + Email Warning — looping display
  // Only show if no active phase has been received yet
  // ═══════════════════════════════════════════════════════════════
  // Show lobby when: still in instructions mode AND host hasn't started (no phaseEndTime received)
  const hostHasStarted = phaseEndTime !== null && phaseEndTime > 0;
  if (!isReady || (showInstructions && !hostHasStarted)) {
    const joinUrl = `${window.location.origin}/join?code=${sessionCode}`;

    return (
      <div className="h-screen bg-gradient-to-br from-qb-purple via-qb-dark to-qb-cyan p-6 overflow-hidden">
        {/* Animated CSS for TV */}
        <style>{`
          @keyframes tv-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.4); }
            50% { transform: scale(1.02); box-shadow: 0 0 60px 15px rgba(250, 204, 21, 0.3); }
          }
          @keyframes tv-bounce {
            0%, 100% { transform: translateY(0); }
            25% { transform: translateY(-15px); }
            75% { transform: translateY(8px); }
          }
          @keyframes tv-glow {
            0%, 100% { text-shadow: 0 0 30px rgba(250, 204, 21, 0.5); }
            50% { text-shadow: 0 0 60px rgba(250, 204, 21, 0.9), 0 0 90px rgba(250, 204, 21, 0.5); }
          }
        `}</style>

        <div className="max-w-7xl mx-auto h-full flex flex-col justify-center">
          {/* Main layout: QR left + Email warning right */}
          <div className="flex gap-8 items-center flex-1 min-h-0">
            {/* LEFT: QR Code — big and prominent */}
            <div className="flex flex-col items-center justify-center w-[400px] shrink-0">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border-4 border-yellow-300/60 flex flex-col items-center">
                <p className="text-3xl font-black text-yellow-300 mb-4">{t('tv.scanToJoin')}</p>
                <QRCodeDisplay value={joinUrl} size={280} className="rounded-2xl" />
                <div className="mt-4 text-center">
                  <p className="text-xl text-white/70">quizzaboom.app/join</p>
                  <p className="text-5xl font-mono font-black text-yellow-300 tracking-widest mt-2">{sessionCode}</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Email Warning — the main message */}
            <div className="flex-1 flex flex-col justify-center gap-6">
              {/* Email warning card */}
              <div
                className="rounded-3xl bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 p-8 border-4 border-yellow-300"
                style={{ animation: 'tv-pulse 2.5s ease-in-out infinite' }}
              >
                <div className="text-center">
                  <div className="inline-block text-8xl mb-4" style={{ animation: 'tv-bounce 1.5s ease-in-out infinite' }}>
                    📧
                  </div>
                  <h2
                    className="text-6xl font-black text-gray-900 mb-4"
                    style={{ animation: 'tv-glow 2s ease-in-out infinite' }}
                  >
                    {t('tv.emailWarningTitle')}
                  </h2>
                  <p className="text-3xl font-bold text-gray-800 mb-6">
                    {t('tv.emailWarningDesc')}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 mb-4">
                    <div className="bg-white/30 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-3">
                      <span className="text-4xl">🏆</span>
                      <span className="font-bold text-gray-900 text-2xl">{t('tv.emailBenefitRanking')}</span>
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-3">
                      <span className="text-4xl">📊</span>
                      <span className="font-bold text-gray-900 text-2xl">{t('tv.emailBenefitStats')}</span>
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-3">
                      <span className="text-4xl">🎯</span>
                      <span className="font-bold text-gray-900 text-2xl">{t('tv.emailBenefitDetails')}</span>
                    </div>
                  </div>
                  <p className="text-xl text-gray-700 italic">
                    {t('tv.emailSafetyNote')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: waiting bar */}
          <div className="text-center mt-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3">
              <p className="text-2xl font-bold text-white">
                {t('tv.waitingForHost')}
              </p>
              <p className="text-lg text-white/90 font-mono">
                {t('tv.sessionLabel')} <span className="font-bold text-2xl">{sessionCode}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TUTORIAL: Pre-quiz tutorial slides
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'tutorial' && tutorialSlides.length > 0) {
    return <TutorialSlides slides={tutorialSlides} variant="tv" />;
  }

  // ═══════════════════════════════════════════════════════════════
  // COMMERCIAL BREAK: Promo screen — text logo + scrolling marquee
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'commercial_break') {
    const breakMinutes = Math.floor(displaySeconds / 60);
    const breakSeconds = displaySeconds % 60;
    const breakTimeDisplay = `${breakMinutes}:${breakSeconds.toString().padStart(2, '0')}`;

    // Build the scrolling text — repeat it for seamless loop
    const marqueeText = breakPromoMessage || t('tv.breakPause');
    const marqueeRepeat = `${marqueeText}     ✦     ${marqueeText}     ✦     ${marqueeText}     ✦     `;

    return (
      <div className="h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-4 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Marquee CSS animation */}
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            animation: marquee-scroll 15s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="max-w-5xl mx-auto flex flex-col items-center justify-between h-full relative z-10">
          {/* Top: Text logo — clean, no video */}
          <div className="text-center w-full pt-4">
            <h1 className="text-5xl font-black bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent drop-shadow-lg tracking-tight">
              QuizzaBoom
            </h1>
          </div>

          {/* Middle: Promo marquee + countdown */}
          <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6 min-h-0">
            {breakNumber > 0 && totalBreaks > 0 && (
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl px-6 py-2 border border-white/20">
                <p className="text-2xl text-white font-bold uppercase tracking-wider">
                  {t('tv.breakPauseNumber', { current: breakNumber, total: totalBreaks })}
                </p>
              </div>
            )}

            {/* Scrolling promo message marquee */}
            {breakPromoMessage ? (
              <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-black/40 backdrop-blur-xl border-4 border-yellow-300/60 shadow-2xl shadow-yellow-500/20 py-6">
                <div className="marquee-track whitespace-nowrap">
                  <span className="text-5xl md:text-6xl font-black text-yellow-300 px-4">
                    {marqueeRepeat}
                  </span>
                </div>
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

          {/* Bottom: Branding + mini QR for late joiners */}
          <div className="flex items-center justify-between w-full pb-2">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
              <QRCodeDisplay value={`${window.location.origin}/join?code=${sessionCode}`} size={50} className="rounded" />
              <div className="text-left">
                <p className="text-xs text-white/50">{t('tv.joinAnytime')}</p>
                <p className="text-base font-mono font-bold text-yellow-300 tracking-wider">{sessionCode}</p>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl px-8 py-2 border border-white/20">
              <p className="text-lg text-white font-bold">
                {t('tv.poweredBy')} <span className="text-yellow-300">QuizzaBoom</span> · quizzaboom.app
              </p>
            </div>
            <div className="w-[130px]" /> {/* Spacer for symmetry */}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ COMPLETE: Top 5 final leaderboard — fits viewport
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'quiz_complete') {
    const teamScores = isTeamMode ? calculateTeamScores(topPlayers) : [];
    const mvp = isTeamMode ? getMVP(topPlayers) : null;
    const badges = calculateBadges(topPlayers);

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

          {/* Team Mode: Team Leaderboard + MVP */}
          {isTeamMode && teamScores.length > 0 ? (
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 border-2 border-yellow-400/50 flex-1 min-h-0">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                <Trophy className="w-7 h-7 text-yellow-300" />
                {t('tv.teamLeaderboard')}
                <Trophy className="w-7 h-7 text-yellow-300" />
              </h2>
              <div className="space-y-1.5">
                {teamScores.map((team, index) => (
                  <div
                    key={team.teamName}
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
                    <div className="text-2xl"><Users className="w-6 h-6 text-white" /></div>
                    <div className="flex-1">
                      <div className="text-xl font-bold text-white">{team.teamName}</div>
                      <div className="text-sm text-white/70">
                        {team.playerCount} {t('lobby.teamMembers', { count: team.playerCount })} &middot; {team.correctAnswers} {t('tv.correctAnswersShort', 'correct')}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-yellow-300">
                      {t('tv.teamScore', { score: team.totalScore })}
                      {index === 0 && <Star className="inline w-6 h-6 ml-2 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />}
                    </div>
                  </div>
                ))}
              </div>

              {/* MVP */}
              {mvp && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/30 border-2 border-purple-400 mt-3">
                  <div className="text-2xl">⭐</div>
                  <div className="text-2xl">{mvp.avatar_emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-purple-300">{t('tv.mvpPlayer')}</div>
                    <div className="text-xl font-bold text-white">{mvp.player_name}</div>
                  </div>
                  <div className="text-xl font-bold text-purple-300">{mvp.total_score} pts</div>
                </div>
              )}
            </div>
          ) : topPlayers.length > 0 ? (
            /* Individual Leaderboard — auto-scrolling for all players */
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 border-2 border-yellow-400/50 flex-1 min-h-0 overflow-hidden">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                <Trophy className="w-7 h-7 text-yellow-300" />
                {t('tv.finalRanking')}
                <Trophy className="w-7 h-7 text-yellow-300" />
              </h2>
              <style>{`
                @keyframes scrollLeaderboard {
                  0% { transform: translateY(0); }
                  5% { transform: translateY(0); }
                  95% { transform: translateY(var(--scroll-distance)); }
                  100% { transform: translateY(var(--scroll-distance)); }
                }
              `}</style>
              <div className="overflow-hidden h-full relative">
                <div
                  className="space-y-1.5"
                  style={topPlayers.length > 8 ? {
                    ['--scroll-distance' as string]: `calc(-${(topPlayers.length - 8) * 56}px)`,
                    animation: `scrollLeaderboard ${Math.max(15, topPlayers.length * 1.5)}s linear infinite`,
                  } : {}}
                >
                  {topPlayers.map((player, index) => (
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
            </div>
          ) : null}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-3 border border-purple-400/30 mt-2">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-purple-300" />
                {t('tv.badgeTitle')}
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {badges.map((badge) => (
                  <div key={badge.key} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/20">
                    <span className="text-xl">{badge.emoji}</span>
                    <div>
                      <div className="text-xs text-purple-300 font-bold">{t(`badges.${badge.key}`)}</div>
                      <div className="text-sm text-white font-medium">{badge.playerEmoji} {badge.playerName}</div>
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
    const themeTextClass = getAdaptiveTextSize(themeName, { xl: 'text-8xl', lg: 'text-7xl', md: 'text-6xl', sm: 'text-5xl' });

    return (
      <div className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center max-w-6xl w-full flex flex-col items-center justify-center h-full">
          <div className="text-8xl mb-4 animate-bounce">🎯</div>
          <h1 className="text-7xl font-bold text-white mb-4 uppercase tracking-wider">
            {t('tv.nextTheme')}
          </h1>
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 mb-6 w-full">
            <p className={`font-bold text-yellow-300 ${themeTextClass}`}>
              {themeName}
            </p>
          </div>
          <div className="mb-4 text-4xl text-white/90 bg-white/10 rounded-2xl p-4 inline-block">
            {t('tv.useJokersNow')}
          </div>
          <div className="flex items-center justify-center gap-4 text-white">
            <Clock className="w-12 h-12 animate-pulse" />
            <span className="text-7xl font-mono font-bold">{displaySeconds}</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: Question Display — cartoon style with image + question + countdown
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'question_display') {
    const questionText = currentQuestion?.question_text || t('common.loading');
    const hasImage = !!currentQuestion?.image_url;
    const showQuestionImage = hasImage && questionImgVisible;

    return (
      <div className="h-screen bg-gradient-to-br from-indigo-700 via-purple-600 to-fuchsia-600 p-4 overflow-hidden relative">
        <style>{TV_ANIMATIONS}</style>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-400/15 rounded-full blur-2xl" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-cyan-400/10 rounded-full blur-3xl" />
        </div>

        <div className="h-full flex flex-col relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between shrink-0 mb-2">
            <div className="flex items-center gap-3">
              <div className="anim-pop bg-yellow-400 rounded-2xl px-5 py-1.5 shadow-lg shadow-yellow-500/30">
                <span className="font-cartoon text-2xl font-bold text-gray-900">
                  Question {currentQuestionIndex + 1}/{allQuestions.length}
                </span>
              </div>
              {currentThemeTitle && (
                <div className="anim-pop bg-white/15 backdrop-blur-xl rounded-2xl px-4 py-1.5 border border-white/20">
                  <span className="text-xl font-bold text-yellow-300">{currentThemeTitle}</span>
                </div>
              )}
            </div>
            <div className="anim-timer bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-1.5 border-2 border-white/30">
              <div className="flex items-center gap-2">
                <Clock className="w-7 h-7 text-yellow-300" />
                <span className="font-cartoon text-4xl font-bold text-white">{displaySeconds}</span>
              </div>
            </div>
          </div>

          {/* Image on top (40%) + Question below (60%) — always keep image */}
          {showQuestionImage ? (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              <div className="flex items-center justify-center anim-pop" style={{ height: '40%' }}>
                <img
                  src={currentQuestion!.image_url}
                  alt=""
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl ring-4 ring-white/20"
                  onError={() => setQuestionImgVisible(false)}
                />
              </div>
              <div className="flex-1 min-h-0 anim-slide bg-white/15 backdrop-blur-xl rounded-[2rem] p-4 border-2 border-white/20 shadow-2xl overflow-hidden">
                <AutoFitText text={questionText} className="font-medium text-white" maxFontSize={120} />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 anim-pop bg-white/15 backdrop-blur-xl rounded-[2rem] p-6 border-2 border-white/20 shadow-2xl overflow-hidden">
              <AutoFitText text={questionText} className="font-medium text-white" maxFontSize={150} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: Answer Selection — cartoon style with colored option pills
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'answer_selection') {
    const questionText = currentQuestion?.question_text || '';
    const hasImage = !!currentQuestion?.image_url;
    const showImage = hasImage && answerImgVisible;
    const options = currentQuestion?.options || [];
    const isUrgent = displaySeconds <= 5;

    return (
      <div className={`h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-3 overflow-hidden relative ${
        isUrgent ? 'ring-4 ring-red-500/50 ring-inset' : ''
      }`}>
        <style>{TV_ANIMATIONS}</style>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="h-full flex flex-col relative z-10">
          {/* Top bar — compact */}
          <div className="flex items-center justify-between shrink-0 mb-1">
            <div className="flex items-center gap-2">
              <div className="anim-pop bg-yellow-400 rounded-xl px-4 py-1 shadow-lg">
                <span className="font-cartoon text-xl font-bold text-gray-900">
                  Q{currentQuestionIndex + 1}/{allQuestions.length}
                </span>
              </div>
              {currentThemeTitle && (
                <div className="bg-white/10 rounded-xl px-3 py-1 border border-white/15">
                  <span className="text-base font-bold text-yellow-300">{currentThemeTitle}</span>
                </div>
              )}
            </div>
            <div className={`bg-white/15 backdrop-blur-xl rounded-xl px-5 py-1 border-2 ${
              isUrgent ? 'border-red-400 anim-timer' : 'border-white/20'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-6 h-6 ${isUrgent ? 'text-red-400' : 'text-qb-cyan'}`} />
                <span className={`font-cartoon text-3xl font-bold ${isUrgent ? 'text-red-300' : 'text-white'}`}>{displaySeconds}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-xl">
              <Users className="w-4 h-4 text-qb-yellow" />
              <span className="text-white font-bold text-sm">
                {answeredCount}/{topPlayers.length}
              </span>
            </div>
          </div>

          {/* Main content area — fills remaining viewport height */}
          <div className={`flex-1 min-h-0 flex ${showImage ? 'gap-3' : 'flex-col gap-1.5'}`}>
            {showImage && (
              <div className="w-[35%] shrink-0 flex items-center justify-center anim-pop">
                <img
                  src={currentQuestion!.image_url}
                  alt=""
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl ring-4 ring-white/20"
                  onError={() => setAnswerImgVisible(false)}
                />
              </div>
            )}

            {/* Question + answers column — when image is shown, this is the right side */}
            {showImage ? (
              <div className="flex-1 flex flex-col gap-1.5 min-h-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-1 overflow-hidden shrink-0" style={{ height: '20%' }}>
                  <AutoFitText text={questionText} className="font-medium text-white" maxFontSize={50} />
                </div>
                <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
                  {options.map((option, idx) => {
                    const color = OPTION_COLORS[idx] || OPTION_COLORS[0];
                    return (
                      <div key={idx} className={`rounded-2xl bg-gradient-to-br ${color.bg} border-2 ${color.border} flex flex-col shadow-lg anim-slide overflow-hidden`} style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: 'backwards' }}>
                        <div className={`w-12 h-12 rounded-xl ${color.label} flex items-center justify-center shrink-0 shadow-inner m-2`}>
                          <span className="font-cartoon text-3xl font-semibold text-white">{color.letter}</span>
                        </div>
                        <div className="flex-1 min-h-0 px-3 pb-2">
                          <AutoFitText text={option} className="font-cartoon font-medium text-white drop-shadow-md" maxFontSize={50} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Question — exactly 20% of height, overflow hidden */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-1 overflow-hidden shrink-0" style={{ height: '20%' }}>
                  <AutoFitText text={questionText} className="font-medium text-white" maxFontSize={70} />
                </div>
                {/* 4 answer cards — take all remaining space */}
                <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
                  {options.map((option, idx) => {
                    const color = OPTION_COLORS[idx] || OPTION_COLORS[0];
                    return (
                      <div key={idx} className={`rounded-2xl bg-gradient-to-br ${color.bg} border-2 ${color.border} flex flex-col shadow-lg anim-slide overflow-hidden`} style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: 'backwards' }}>
                        <div className={`w-12 h-12 rounded-xl ${color.label} flex items-center justify-center shrink-0 shadow-inner m-2`}>
                          <span className="font-cartoon text-3xl font-semibold text-white">{color.letter}</span>
                        </div>
                        <div className="flex-1 min-h-0 px-3 pb-2">
                          <AutoFitText text={option} className="font-cartoon font-medium text-white drop-shadow-md" maxFontSize={80} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: Results — compact
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === 'results') {
    const correctAnswer = currentQuestion?.correct_answer || '';
    const correctAnswerClass = getAdaptiveTextSize(correctAnswer, { xl: 'text-8xl', lg: 'text-7xl', md: 'text-6xl', sm: 'text-5xl' });
    const hasImage = !!currentQuestion?.image_url;

    return (
      <div className="h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 overflow-hidden relative">
        {hasImage && loadedImages.has(currentQuestion!.image_url!) && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={currentQuestion!.image_url}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        <div className="max-w-7xl mx-auto h-full flex flex-col items-center relative z-10">
          {/* Top: correct answer header — shrink-0 */}
          <div className="text-center shrink-0 pt-2">
            <div className="text-6xl mb-2 animate-bounce">✅</div>
            <h1 className="text-5xl font-bold text-white mb-3">{t('tv.correctAnswer')}</h1>
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-10 py-6 mb-3 inline-block">
              <p className={`${correctAnswerClass} font-bold text-white`}>
                {correctAnswer}
              </p>
            </div>
          </div>

          {/* Middle: commentary + fun fact — flex-1, overflow hidden */}
          <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center overflow-hidden">
            {/* Commentary popups (show on top when present) */}
            {commentaryPopups.length > 0 && (
              <div className="mb-3 max-w-4xl w-full shrink-0">
                <CommentaryPopupChain popups={commentaryPopups} variant="tv" />
              </div>
            )}

            {/* Fun fact — scales text down to fit available space */}
            {currentQuestion?.fun_fact && (
              <div className="bg-yellow-500/10 backdrop-blur-xl border-2 border-yellow-400/50 rounded-2xl p-6 max-w-5xl w-full flex-1 min-h-0 overflow-hidden">
                <div className="flex items-center gap-3 mb-2 shrink-0">
                  <Lightbulb className="w-10 h-10 text-yellow-300" />
                  <span className="text-yellow-300 font-bold text-3xl">{t('tv.funFact')}</span>
                </div>
                <div className="flex-1 min-h-0 h-full">
                  <AutoFitText text={currentQuestion.fun_fact} className="font-medium text-white/95" maxFontSize={60} minFontSize={16} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom: timer — shrink-0 */}
          <div className="inline-flex items-center gap-4 px-8 py-3 bg-white/10 rounded-3xl shrink-0 mb-2">
            <Clock className="w-8 h-8 text-white" />
            <span className="text-4xl font-mono font-bold text-white">
              {displaySeconds}
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
    const teamScores = isTeamMode ? calculateTeamScores(topPlayers) : [];
    const mvp = isTeamMode ? getMVP(topPlayers) : null;

    return (
      <div className="h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 p-6 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-between">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-2 flex items-center justify-center gap-4">
              <Trophy className="w-12 h-12 text-yellow-300" />
              {isTeamMode ? t('tv.teamLeaderboard') : t('tv.leaderboard')}
              <Trophy className="w-12 h-12 text-yellow-300" />
            </h1>
          </div>

          {isTeamMode && teamScores.length > 0 ? (
            <div className="space-y-3 flex-1 min-h-0 my-4">
              {teamScores.slice(0, 4).map((team, index) => (
                <div
                  key={team.teamName}
                  className={`flex items-center gap-4 p-4 rounded-2xl ${
                    index === 0
                      ? 'bg-yellow-500/30 border-4 border-yellow-400 scale-105'
                      : index === 1
                      ? 'bg-gray-400/20 border-2 border-gray-300'
                      : index === 2
                      ? 'bg-orange-700/20 border-2 border-orange-600'
                      : 'bg-white/10 border-2 border-white/20'
                  }`}
                >
                  <div className="text-4xl font-bold text-white/80 w-16 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="text-3xl"><Users className="w-8 h-8 text-white" /></div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-white">{team.teamName}</div>
                    <div className="text-lg text-white/70">
                      {team.playerCount} {t('lobby.teamMembers', { count: team.playerCount })}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-300">
                    {t('tv.teamScore', { score: team.totalScore })}
                    {index === 0 && <Star className="inline w-8 h-8 ml-3 text-yellow-400" />}
                  </div>
                </div>
              ))}

              {mvp && (
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-purple-500/20 border-2 border-purple-400 mt-2">
                  <div className="text-3xl">⭐</div>
                  <div className="text-2xl">{mvp.avatar_emoji}</div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-purple-300">{t('tv.mvpPlayer')}</div>
                    <div className="text-xl font-bold text-white">{mvp.player_name}</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-300">{mvp.total_score}</div>
                </div>
              )}
            </div>
          ) : topPlayers.length > 0 ? (
            <div className="space-y-3 flex-1 min-h-0 my-4">
              {topPlayers.slice(0, 8).map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl ${
                    index === 0
                      ? 'bg-yellow-500/30 border-4 border-yellow-400 scale-105'
                      : index === 1
                      ? 'bg-gray-400/20 border-2 border-gray-300'
                      : index === 2
                      ? 'bg-orange-700/20 border-2 border-orange-600'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <div className="text-5xl font-bold text-white/80 w-16 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="text-4xl">{player.avatar_emoji}</div>
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-white">
                      {player.player_name}
                    </div>
                    <div className="text-xl text-white/70">
                      {t('tv.playerStats', { correct: player.correct_answers, total: player.questions_answered })}
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-yellow-300">
                    {player.total_score}
                    {index === 0 && <Star className="inline w-10 h-10 ml-3 text-yellow-400" />}
                  </div>
                </div>
              ))}
              {topPlayers.length > 8 && (
                <div className="mt-3 text-center">
                  <p className="text-white/70 text-2xl">
                    {t('tv.andMorePlayers', { count: topPlayers.length - 8, defaultValue: `... et ${topPlayers.length - 8} autres joueur(s) en compétition !` })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 animate-pulse">⏸️</div>
              <p className="text-4xl text-white/70">{t('tv.getReady')}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Mini QR code for late joiners */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
              <QRCodeDisplay value={`${window.location.origin}/join?code=${sessionCode}`} size={60} className="rounded" />
              <div className="text-left">
                <p className="text-xs text-white/60">{t('tv.joinAnytime')}</p>
                <p className="text-lg font-mono font-bold text-yellow-300 tracking-wider">{sessionCode}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <AnimatedLogo size="sm" />
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-qb-cyan/20 rounded-2xl">
                <p className="text-2xl text-white/80">{t('tv.nextQuestionIn')}</p>
                <span className="text-4xl font-mono font-bold text-qb-cyan">
                  {displaySeconds}
                </span>
              </div>
            </div>

            <div className="w-[140px]" /> {/* Spacer for symmetry */}
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
