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
import type { Question } from '../types/quiz';

type Phase = 'announcement' | 'jokers' | 'question' | 'results';

export const HostDashboard: React.FC = () => {
  const { currentQuiz, currentSession, players, sessionCode, loadPlayers } = useQuizStore();
  const { allQuestions, loadQuestions, broadcastPhaseChange } = useStrategicQuizStore();

  const [currentPhaseState, setCurrentPhaseState] = useState<Phase>('announcement');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(12);

  const phaseDurations: Record<Phase, number> = {
    announcement: 12,
    jokers: 12,
    question: 30,
    results: 5,
  };

  const currentQuestion: Question | null = allQuestions[currentQuestionIndex] || null;

  // Load questions on mount
  useEffect(() => {
    if (currentQuiz?.id) {
      console.log('📚 Loading questions for quiz:', currentQuiz.id);
      loadQuestions(currentQuiz.id);
    }
  }, [currentQuiz?.id]);

  // Auto-refresh players
  useEffect(() => {
    if (currentSession?.id) {
      const interval = setInterval(() => {
        loadPlayers(currentSession.id);
      }, 5000); // Refresh every 5s

      return () => clearInterval(interval);
    }
  }, [currentSession?.id]);

  // Phase timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && phaseTimeRemaining > 0) {
      interval = setInterval(() => {
        setPhaseTimeRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, phaseTimeRemaining, currentPhaseState, currentQuestionIndex]);

  const handlePhaseComplete = () => {
    const phaseOrder: Phase[] = ['announcement', 'jokers', 'question', 'results'];
    const currentIndex = phaseOrder.indexOf(currentPhaseState);
    
    if (currentIndex < phaseOrder.length - 1) {
      // Next phase in sequence
      const nextPhase = phaseOrder[currentIndex + 1];
      changePhase(nextPhase);
    } else {
      // End of cycle, move to next question
      if (currentQuestionIndex < allQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        changePhase('announcement');
      } else {
        // Quiz finished
        setIsPlaying(false);
        alert('🎉 Quiz completed! All questions answered.');
      }
    }
  };

  const changePhase = (newPhase: Phase) => {
    const stageNumber = Math.floor(currentQuestionIndex / 5); // 5 questions per stage (adjust as needed)
    
    setCurrentPhaseState(newPhase);
    setPhaseTimeRemaining(phaseDurations[newPhase]);

    // Broadcast to all players
    const phaseData = {
      phase: newPhase,
      questionIndex: currentQuestionIndex,
      stageNumber,
      timeRemaining: phaseDurations[newPhase],
      currentQuestion: allQuestions[currentQuestionIndex] || null,
    };

    console.log('📤 Broadcasting phase change:', phaseData);
    broadcastPhaseChange(phaseData);
  };

  const handleStartPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && currentPhaseState === 'announcement' && currentQuestionIndex === 0) {
      // First start - broadcast initial state
      changePhase('announcement');
    }
  };

  const handleSkipPhase = () => {
    setPhaseTimeRemaining(1);
  };

  const handleManualPhaseChange = (phase: Phase) => {
    if (isPlaying) {
      alert('Pause the quiz first to manually change phases');
      return;
    }
    changePhase(phase);
  };

  const getPhaseColor = (phase: Phase) => {
    switch (phase) {
      case 'announcement': return 'from-yellow-500 to-orange-500';
      case 'jokers': return 'from-purple-500 to-pink-500';
      case 'question': return 'from-blue-500 to-cyan-500';
      case 'results': return 'from-green-500 to-emerald-500';
    }
  };

  const getPhaseIcon = (phase: Phase) => {
    switch (phase) {
      case 'announcement': return '📢';
      case 'jokers': return '⚡';
      case 'question': return '❓';
      case 'results': return '📊';
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
          <p className="text-white/70">Please wait while we load the quiz questions from AI generation.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{currentQuiz.title}</h1>
            <p className="text-white/70">Host Dashboard - Session: {sessionCode}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" icon={<Monitor />}>
              TV Display
            </Button>
            <Button variant="ghost" icon={<Eye />}>
              Preview Player
            </Button>
          </div>
        </div>

        {/* Main Control Panel */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Phase Control */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Phase Display */}
            <Card className={`p-8 bg-gradient-to-br ${getPhaseColor(currentPhaseState)}`}>
              <div className="text-center space-y-4">
                <div className="text-8xl animate-pulse">{getPhaseIcon(currentPhaseState)}</div>
                <h2 className="text-4xl font-bold text-white uppercase">
                  {currentPhaseState} Phase
                </h2>
                <div className="text-7xl font-mono font-bold text-white">
                  {phaseTimeRemaining}s
                </div>
                <div className="text-xl text-white/90">
                  Question {currentQuestionIndex + 1} of {allQuestions.length}
                </div>
                <div className="inline-flex px-4 py-2 bg-white/20 rounded-full text-white font-bold">
                  {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
                </div>
              </div>
            </Card>

            {/* Playback Controls */}
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

              {/* Manual Phase Selector */}
              <div className="grid grid-cols-4 gap-2">
                {(['announcement', 'jokers', 'question', 'results'] as Phase[]).map((phase) => (
                  <Button
                    key={phase}
                    onClick={() => handleManualPhaseChange(phase)}
                    variant={currentPhaseState === phase ? 'primary' : 'ghost'}
                    disabled={isPlaying}
                    className="capitalize text-xs"
                  >
                    {phase}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Current Question Display */}
            <Card gradient className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Current Question</h3>
                <span className="px-3 py-1 bg-qb-cyan rounded-full text-sm font-bold text-qb-darker">
                  {currentQuestion?.points || 100} pts
                </span>
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
                <div className="text-center py-8 text-white/50">
                  No question data available
                </div>
              )}
            </Card>
          </div>

          {/* Right - Stats & Players */}
          <div className="space-y-6">
            {/* Quiz Progress */}
            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quiz Progress</h3>
              <div className="space-y-4">
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
              </div>
            </Card>

            {/* Live Stats */}
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
                <div className="flex justify-between text-white">
                  <span>Avg Score:</span>
                  <span className="font-bold text-qb-yellow">
                    {Math.round(players.reduce((sum, p) => sum + p.total_score, 0) / players.length || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Top Score:</span>
                  <span className="font-bold text-qb-magenta">
                    {Math.max(...players.map(p => p.total_score), 0)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Leaderboard */}
            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Live Leaderboard
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {players.length === 0 ? (
                  <div className="text-center py-8 text-white/50">
                    No players yet
                  </div>
                ) : (
                  players
                    .sort((a, b) => b.total_score - a.total_score)
                    .slice(0, 10)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          index === 0
                            ? 'bg-yellow-500/20 border-2 border-yellow-500 scale-105'
                            : index === 1
                            ? 'bg-gray-400/20 border border-gray-400'
                            : index === 2
                            ? 'bg-orange-700/20 border border-orange-700'
                            : 'bg-qb-darker'
                        }`}
                      >
                        <div className="text-2xl font-bold text-white/50 w-8">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div className="text-2xl">{player.avatar_emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate">
                            {player.player_name}
                          </div>
                          <div className="text-xs text-white/50">
                            {player.correct_answers}/{player.questions_answered} correct
                            {player.accuracy_percentage > 0 && (
                              <> • {Math.round(player.accuracy_percentage)}% accuracy</>
                            )}
                          </div>
                        </div>
                        <div className="text-xl font-bold text-qb-cyan">
                          {player.total_score}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </Card>

            {/* All Players List */}
            <Card gradient className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Players ({players.length})
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
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 bg-qb-darker rounded-lg"
                  >
                    <div className="text-xl">{player.avatar_emoji}</div>
                    <div className="flex-1 text-white text-sm truncate">
                      {player.player_name}
                    </div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: player.is_connected ? '#10B981' : '#EF4444',
                      }}
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
