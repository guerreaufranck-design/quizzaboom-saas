import React, { useEffect, useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import type { GamePhase } from '../types/gamePhases';
import { PHASE_DURATIONS, PHASE_ORDER } from '../types/gamePhases';
import type { Question } from '../types/quiz';
import { supabase } from '../services/supabase/client';
import { supabase } from '../services/supabase/client';

export const HostDashboard: React.FC = () => {
  const { currentQuiz, currentSession, players, sessionCode, loadPlayers } = useQuizStore();
  const { allQuestions, loadQuestions, broadcastPhaseChange } = useStrategicQuizStore();

  const [currentPhaseState, setCurrentPhaseState] = useState<GamePhase>('theme_announcement');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(8);

  const currentQuestion: Question | null = allQuestions[currentQuestionIndex] || null;

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && phaseTimeRemaining > 0) {
      interval = setInterval(() => {
        setPhaseTimeRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          const newTime = prev - 1;
          
          if (sessionCode) {
            supabase.channel(`quiz_session_${sessionCode}`).send({
              type: 'broadcast',
              event: 'timer_update',
              payload: { timeRemaining: newTime }
            });
          }
          
          if (sessionCode) {
            supabase.channel(`quiz_session_${sessionCode}`).send({
              type: 'broadcast',
              event: 'timer_update',
              payload: { timeRemaining: newTime }
            });
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, phaseTimeRemaining, currentPhaseState, currentQuestionIndex, sessionCode]);

  const handlePhaseComplete = () => {
    const currentIndex = PHASE_ORDER.indexOf(currentPhaseState);
    
    if (currentIndex < PHASE_ORDER.length - 1) {
      const nextPhase = PHASE_ORDER[currentIndex + 1];
      changePhase(nextPhase, currentQuestionIndex);
    } else {
      if (currentQuestionIndex < allQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        changePhase('theme_announcement', nextIndex);
      } else {
        setIsPlaying(false);
        alert('🎉 Quiz completed!');
      }
    }
  };

  const changePhase = (newPhase: GamePhase, questionIndex: number) => {
    const stageNumber = Math.floor(questionIndex / 5);
    const question = allQuestions[questionIndex];
    
    setCurrentPhaseState(newPhase);
    setPhaseTimeRemaining(PHASE_DURATIONS[newPhase]);

    const phaseData = {
      phase: newPhase,
      questionIndex: questionIndex,
      stageNumber,
      timeRemaining: PHASE_DURATIONS[newPhase],
      currentQuestion: question || null,
      themeTitle: question?.stage_id || 'General Knowledge',
    };

    console.log('📤 Broadcasting phase change:', {
      phase: newPhase,
      questionIndex,
      theme: phaseData.themeTitle,
    });
    
    if (sessionCode) {
      broadcastPhaseChange(sessionCode, phaseData);
    }
  };

  const handleStartPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && currentPhaseState === 'theme_announcement' && currentQuestionIndex === 0) {
      changePhase('theme_announcement', 0);
    }
  };

  const handleSkipPhase = () => {
    setPhaseTimeRemaining(1);
  };

  const handleManualPhaseChange = (phase: GamePhase) => {
    if (isPlaying) {
      alert('⏸️ Pause the quiz first');
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
    }
  };

  const getPhaseIcon = (phase: GamePhase) => {
    switch (phase) {
      case 'theme_announcement': return '🎯';
      case 'question_display': return '📖';
      case 'answer_selection': return '✍️';
      case 'results': return '📊';
      case 'intermission': return '⏸️';
    }
  };

  const getPhaseLabel = (phase: GamePhase) => {
    switch (phase) {
      case 'theme_announcement': return 'Theme + Jokers';
      case 'question_display': return 'Question';
      case 'answer_selection': return 'Answers';
      case 'results': return 'Results';
      case 'intermission': return 'Break';
    }
  };

  if (!currentQuiz || !currentSession) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-2xl">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <Card className="p-12 text-center max-w-2xl">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-3xl font-bold text-white mb-4">Loading Questions...</h2>
          <p className="text-white/70">Generating quiz with AI...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{currentQuiz.title}</h1>
            <p className="text-white/70">Host Dashboard - Session: {sessionCode}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              icon={<Monitor />}
              onClick={() => window.open(`${window.location.origin}?tv=${sessionCode}`, '_blank')}
            >
              Open TV Display
            </Button>
            <Button variant="ghost" icon={<Eye />}>
              Preview Player
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
                  {phaseTimeRemaining}s
                </div>
                <div className="text-xl text-white/90">
                  Question {currentQuestionIndex + 1} / {allQuestions.length}
                </div>
                {currentQuestion && (
                  <div className="text-2xl text-yellow-300 font-bold">
                    Theme: {currentQuestion.stage_id}
                  </div>
                )}
                <div className="inline-flex px-4 py-2 bg-white/20 rounded-full text-white font-bold">
                  {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
                </div>
              </div>
            </Card>

            <Card gradient className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Button
                  size="xl"
                  onClick={handleStartPause}
                  icon={isPlaying ? <Pause /> : <Play />}
                  gradient={isPlaying}
                  variant={isPlaying ? 'primary' : 'secondary'}
                >
                  {isPlaying ? 'Pause Quiz' : 'Start Quiz'}
                </Button>
                <Button
                  size="xl"
                  onClick={handleSkipPhase}
                  icon={<SkipForward />}
                  variant="ghost"
                  disabled={!isPlaying}
                >
                  Skip Phase
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

            <Card gradient className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Current Question</h3>
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
                          <span className="text-green-400 font-bold">✓ CORRECT</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {currentQuestion.explanation && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-white/80">
                        <strong className="text-blue-400">Explanation:</strong> {currentQuestion.explanation}
                      </p>
                    </div>
                  )}

                  {currentQuestion.fun_fact && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-white/80">
                        <strong className="text-yellow-400">💡 Fun Fact:</strong> {currentQuestion.fun_fact}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-white/50">No question data</div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quiz Progress</h3>
              <div>
                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>Questions</span>
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
                Live Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-white">
                  <span>Total Players:</span>
                  <span className="font-bold text-qb-cyan">{players.length}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Active:</span>
                  <span className="font-bold text-green-400">
                    {players.filter(p => p.is_connected).length}
                  </span>
                </div>
              </div>
            </Card>

            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Leaderboard
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {players.length === 0 ? (
                  <div className="text-center py-8 text-white/50">No players yet</div>
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
                  Players ({players.length})
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RefreshCw />}
                  onClick={() => currentSession?.id && loadPlayers(currentSession.id)}
                >
                  Refresh
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
