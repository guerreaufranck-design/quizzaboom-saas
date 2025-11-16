import React, { useEffect, useState } from 'react';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useQuizStore } from '../stores/useQuizStore';
import { supabase } from '../services/supabase/client';
import { Card } from '../components/ui/Card';
import { Clock, Trophy, Star } from 'lucide-react';
import type { Player } from '../types/quiz';

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

  const { currentQuiz, setCurrentView } = useQuizStore();

  const [sessionCode, setSessionCode] = useState<string>('');
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initTVDisplay = async () => {
      const params = new URLSearchParams(window.location.search);
      const tvCode = params.get('tv');
      
      console.log('📺 TV Display initializing with code:', tvCode);
      
      if (!tvCode) {
        console.error('❌ No TV code in URL');
        return;
      }

      setSessionCode(tvCode);

      // 1. Charger la session
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

      // 2. Charger le quiz
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

      // 3. Charger les questions
      await loadQuestions(quiz.id);
      console.log('✅ Questions loaded');

      // 4. S'abonner aux changements de phase
      listenToPhaseChanges(tvCode);
      console.log('✅ Listening to phase changes');

      // 5. Charger les joueurs
      loadTopPlayers(session.id);
      console.log('✅ Players loaded');

      setIsReady(true);
    };

    initTVDisplay();
  }, []);

  const loadTopPlayers = async (sessionId: string) => {
    const { data: players } = await supabase
      .from('session_players')
      .select('*')
      .eq('session_id', sessionId)
      .order('total_score', { ascending: false })
      .limit(5);

    if (players) {
      setTopPlayers(players as Player[]);
    }
  };

  useEffect(() => {
    if (currentPhase === 'results' && sessionCode) {
      const interval = setInterval(async () => {
        const { data: session } = await supabase
          .from('quiz_sessions')
          .select('id')
          .eq('session_code', sessionCode)
          .single();

        if (session) {
          loadTopPlayers(session.id);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentPhase, sessionCode]);

  // Loading state
  if (!isReady || allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-qb-purple via-qb-cyan to-qb-magenta flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl mb-8 animate-bounce">📺</div>
          <h1 className="text-7xl font-bold text-white mb-4">TV Display</h1>
          <p className="text-4xl text-white/70 mb-8">Loading quiz data...</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
          {/* Timer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-6 px-12 py-6 bg-qb-cyan/20 rounded-3xl">
              <Clock className="w-12 h-12 text-qb-cyan animate-pulse" />
              <span className="text-8xl font-mono font-bold text-white">
                {phaseTimeRemaining}
              </span>
            </div>
          </div>

          {/* Question */}
          <Card className="p-12 bg-gradient-to-br from-qb-purple/30 to-qb-cyan/30 border-white/20">
            <h2 className="text-6xl font-bold text-white text-center mb-12">
              {currentQuestion?.question_text}
            </h2>

            {/* Answer Grid */}
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
          {/* Correct Answer */}
          <div className="text-center">
            <div className="text-9xl mb-8 animate-bounce">✅</div>
            <h1 className="text-7xl font-bold text-white mb-12">CORRECT ANSWER</h1>
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-12">
              <p className="text-6xl font-bold text-white">
                {currentQuestion?.correct_answer}
              </p>
            </div>
          </div>

          {/* Top 5 Leaderboard */}
          {topPlayers.length > 0 && (
            <Card className="p-12 bg-white/10 backdrop-blur-xl border-white/20">
              <h2 className="text-5xl font-bold text-white mb-8 flex items-center justify-center gap-4">
                <Trophy className="w-12 h-12 text-yellow-300" />
                TOP 5 PLAYERS
              </h2>
              <div className="space-y-6">
                {topPlayers.slice(0, 5).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-6 p-6 rounded-2xl ${
                      index === 0
                        ? 'bg-yellow-500/30 border-4 border-yellow-400 scale-110'
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
            </Card>
          )}

          {/* Timer */}
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

  // PHASE 5: Intermission
  if (currentPhase === 'intermission') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="text-9xl mb-12 animate-pulse">⏸️</div>
          <h1 className="text-8xl font-bold text-white mb-8">GET READY!</h1>
          <p className="text-5xl text-white/70 mb-12">
            Next question coming up...
          </p>
          <div className="text-9xl font-mono font-bold text-qb-cyan">
            {phaseTimeRemaining}
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
