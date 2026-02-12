import React, { useEffect, useState } from 'react';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { supabase } from '../services/supabase/client';
import { Card } from '../components/ui/Card';
import { Clock, Trophy, Star } from 'lucide-react';
import type { Player } from '../types/quiz';
import { useQuizAudio } from '../hooks/useQuizAudio';
import { AnimatedLogo } from '../components/AnimatedLogo';

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
    // Hide instructions only when timer actually starts counting down
    if (currentPhase === 'theme_announcement' && phaseTimeRemaining < 5 && showInstructions) {
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

  // Refresh leaderboard during results, intermission, and quiz_complete phases
  useEffect(() => {
    if ((currentPhase === 'results' || currentPhase === 'intermission' || currentPhase === 'quiz_complete') && sessionCode) {
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

    // PHASE 0: Instructions Screen (vertical layout, fits on screen)
  if (showInstructions || !isReady || allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-qb-purple via-qb-dark to-qb-cyan p-8 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col justify-between">
          {/* Header */}
          <div className="text-center mb-6">
            <AnimatedLogo size="lg" className="mx-auto mb-4" />
            <h1 className="text-6xl font-bold text-white mb-2">HOW TO PLAY</h1>
            <p className="text-3xl text-yellow-300 font-bold">Follow these 4 steps!</p>
          </div>

          {/* Steps - Vertical */}
          <div className="space-y-4 flex-1">
            {/* Step 1: Join */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/30">
              <div className="flex items-center gap-6">
                <div className="text-6xl">📱</div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-white mb-2">1. JOIN THE GAME</h2>
                  <p className="text-2xl text-white/90">
                    Scan the <span className="text-yellow-300 font-bold">QR code</span> or enter session code
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Email - MAXIMUM VISIBILITY */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 border-4 border-yellow-300 shadow-2xl shadow-yellow-500/50 animate-pulse">
              <div className="flex items-center gap-6">
                <div className="text-6xl animate-bounce">📧</div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">2. ENTER YOUR EMAIL!</h2>
                  <p className="text-2xl text-gray-900 font-bold mb-2">
                    🎁 Receive your PERSONALIZED RESULTS:
                  </p>
                  <div className="flex gap-4 text-xl text-gray-900">
                    <span>✅ Final Ranking</span>
                    <span>✅ Statistics</span>
                    <span>✅ Certificate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Jokers */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-purple-400">
              <div className="flex items-center gap-6">
                <div className="text-6xl">🎯</div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-white mb-2">3. USE JOKERS</h2>
                  <p className="text-2xl text-white/90 mb-2">
                    Activate during <span className="text-purple-300 font-bold">THEME phase</span> (8s):
                  </p>
                  <div className="flex gap-2">
                    <div className="bg-blue-500/30 rounded-lg px-3 py-2 text-center">
                      <div className="text-3xl">🛡️</div>
                      <div className="text-sm text-white">Protection</div>
                    </div>
                    <div className="bg-red-500/30 rounded-lg px-3 py-2 text-center">
                      <div className="text-3xl">🚫</div>
                      <div className="text-sm text-white">Block</div>
                    </div>
                    <div className="bg-yellow-500/30 rounded-lg px-3 py-2 text-center">
                      <div className="text-3xl">💰</div>
                      <div className="text-sm text-white">Steal</div>
                    </div>
                    <div className="bg-green-500/30 rounded-lg px-3 py-2 text-center">
                      <div className="text-3xl">⭐</div>
                      <div className="text-sm text-white">Double</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Phases */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-cyan-400">
              <div className="flex items-center gap-6">
                <div className="text-6xl">⏱️</div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-white mb-2">4. GAME FLOW</h2>
                  <div className="grid grid-cols-2 gap-2 text-lg text-white/90">
                    <div className="bg-purple-500/20 p-2 rounded">🎯 Theme (5s) → Jokers</div>
                    <div className="bg-blue-500/20 p-2 rounded">📖 Question (8s) → Read</div>
                    <div className="bg-cyan-500/20 p-2 rounded">✍️ Answer (15s) → Choose</div>
                    <div className="bg-green-500/20 p-2 rounded">📊 Results (8s) → Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-center mt-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6">
              <p className="text-4xl font-bold text-white mb-1">
                🚀 Waiting for host to start...
              </p>
              <p className="text-2xl text-white/90 font-mono">
                Session: <span className="font-bold">{sessionCode}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ COMPLETE: Thank you screen with final leaderboard
  if (currentPhase === 'quiz_complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-12 overflow-hidden relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Thank you header */}
          <div className="text-center">
            <div className="text-9xl mb-6 animate-bounce">🎉</div>
            <h1 className="text-8xl font-bold text-white mb-4 uppercase tracking-wider">
              THANK YOU!
            </h1>
            <p className="text-4xl text-white/90 font-medium">
              Thank you so much for your participation!
            </p>
          </div>

          {/* Final Leaderboard */}
          {topPlayers.length > 0 && (
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-10 border-2 border-yellow-400/50">
              <h2 className="text-5xl font-bold text-white mb-8 flex items-center justify-center gap-4">
                <Trophy className="w-14 h-14 text-yellow-300" />
                FINAL RANKING
                <Trophy className="w-14 h-14 text-yellow-300" />
              </h2>
              <div className="space-y-4">
                {topPlayers.slice(0, 10).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-6 p-5 rounded-2xl transition-all ${
                      index === 0
                        ? 'bg-yellow-500/40 border-4 border-yellow-300 scale-105 shadow-lg shadow-yellow-500/30'
                        : index === 1
                        ? 'bg-gray-400/20 border-2 border-gray-300'
                        : index === 2
                        ? 'bg-orange-700/30 border-2 border-orange-500'
                        : 'bg-white/10 border border-white/20'
                    }`}
                  >
                    <div className="text-5xl font-bold text-white/80 w-20 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="text-5xl">{player.avatar_emoji}</div>
                    <div className="flex-1">
                      <div className="text-3xl font-bold text-white">
                        {player.player_name}
                      </div>
                      <div className="text-xl text-white/70">
                        {player.correct_answers}/{player.questions_answered} correct
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-yellow-300">
                      {player.total_score}
                      {index === 0 && <Star className="inline w-10 h-10 ml-3 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <div className="inline-block bg-black/30 backdrop-blur-xl rounded-2xl px-12 py-6 border border-white/20">
              <AnimatedLogo size="md" className="mx-auto mb-3" />
              <p className="text-2xl text-white font-bold">
                Powered by <span className="text-yellow-300">QuizzaBoom</span>
              </p>
              <p className="text-lg text-white/60 mt-1">quizzaboom.app</p>
              <p className="text-lg text-white/50 mt-1">contact@quizzaboom.app</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 1: Theme Announcement
  if (currentPhase === 'theme_announcement') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-12">
        <div className="text-center max-w-6xl w-full">
          <div className="text-9xl mb-12 animate-bounce">🎯</div>
          <h1 className="text-8xl font-bold text-white mb-8 uppercase tracking-wider">
            NEXT THEME
          </h1>
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-16 mb-12">
            <p className="text-7xl font-bold text-yellow-300">
              {currentThemeTitle || currentQuestion?.stage_id || 'General Knowledge'}
            </p>
          </div>
          <div className="mb-8 text-4xl text-white/90 bg-white/10 rounded-2xl p-6 inline-block">
            ⚡ Use your JOKERS now! ⚡
          </div>
          <div className="flex items-center justify-center gap-6 text-white">
            <Clock className="w-16 h-16 animate-pulse" />
            <span className="text-9xl font-mono font-bold">{phaseTimeRemaining}</span>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 2: Question Display
  if (currentPhase === 'question_display') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 flex items-center justify-center p-12">
        <div className="max-w-6xl w-full text-center">
          <div className="text-9xl mb-12">📖</div>
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-16 mb-12">
            <h2 className="text-7xl font-bold text-white leading-tight">
              {currentQuestion?.question_text || 'Loading...'}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-6 text-white">
            <Clock className="w-16 h-16 animate-pulse" />
            <span className="text-9xl font-mono font-bold">{phaseTimeRemaining}</span>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 3: Answer Selection
  if (currentPhase === 'answer_selection') {
    return (
      <div className="min-h-screen bg-qb-dark p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-6 px-12 py-6 bg-qb-cyan/20 rounded-3xl">
              <Clock className="w-12 h-12 text-qb-cyan animate-pulse" />
              <span className="text-8xl font-mono font-bold text-white">
                {phaseTimeRemaining}
              </span>
            </div>
          </div>

          <Card className="p-12 bg-gradient-to-br from-qb-purple/30 to-qb-cyan/30 border-white/20">
            <h2 className="text-6xl font-bold text-white text-center mb-12">
              {currentQuestion?.question_text}
            </h2>

            <div className="grid grid-cols-2 gap-8">
              {currentQuestion?.options?.map((option, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-2xl bg-qb-darker border-2 border-white/20 flex items-center gap-6"
                >
                  <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-5xl font-bold text-white">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                  </div>
                  <span className="text-4xl text-white font-medium flex-1">
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

  // PHASE 4: Results
  if (currentPhase === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center">
            <div className="text-9xl mb-8 animate-bounce">✅</div>
            <h1 className="text-7xl font-bold text-white mb-12">CORRECT ANSWER</h1>
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-12">
              <p className="text-6xl font-bold text-white">
                {currentQuestion?.correct_answer}
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-6 px-12 py-6 bg-white/10 rounded-3xl">
              <Clock className="w-12 h-12 text-white" />
              <span className="text-7xl font-mono font-bold text-white">
                {phaseTimeRemaining}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 5: Intermission — Top 5 Leaderboard Update
  if (currentPhase === 'intermission') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-7xl font-bold text-white mb-4 flex items-center justify-center gap-6">
              <Trophy className="w-16 h-16 text-yellow-300" />
              LEADERBOARD
              <Trophy className="w-16 h-16 text-yellow-300" />
            </h1>
          </div>

          {topPlayers.length > 0 ? (
            <div className="space-y-5">
              {topPlayers.slice(0, 5).map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-6 p-6 rounded-2xl ${
                    index === 0
                      ? 'bg-yellow-500/30 border-4 border-yellow-400 scale-105'
                      : index === 1
                      ? 'bg-gray-400/20 border-2 border-gray-300'
                      : index === 2
                      ? 'bg-orange-700/20 border-2 border-orange-600'
                      : 'bg-white/10'
                  }`}
                >
                  <div className="text-6xl font-bold text-white/80 w-24 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="text-5xl">{player.avatar_emoji}</div>
                  <div className="flex-1">
                    <div className="text-4xl font-bold text-white">
                      {player.player_name}
                    </div>
                    <div className="text-2xl text-white/70">
                      {player.correct_answers}/{player.questions_answered} correct
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-yellow-300">
                    {player.total_score}
                    {index === 0 && <Star className="inline w-12 h-12 ml-4 text-yellow-400" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-9xl mb-8 animate-pulse">⏸️</div>
              <p className="text-5xl text-white/70">GET READY!</p>
            </div>
          )}

          <div className="text-center flex items-center justify-center gap-6">
            <AnimatedLogo size="sm" />
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-qb-cyan/20 rounded-2xl">
              <p className="text-3xl text-white/80">Next question in</p>
              <span className="text-6xl font-mono font-bold text-qb-cyan">
                {phaseTimeRemaining}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default
  return (
    <div className="min-h-screen bg-qb-dark flex items-center justify-center">
      <div className="text-center">
        <div className="text-9xl mb-8">📺</div>
        <h1 className="text-6xl font-bold text-white mb-4">TV Display Mode</h1>
        <p className="text-3xl text-white/70 mb-8">Session: {sessionCode}</p>
        <p className="text-2xl text-white/50">Waiting for quiz to start...</p>
      </div>
    </div>
  );
};
