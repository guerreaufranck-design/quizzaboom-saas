import React, { useEffect, useState } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Timer } from '../components/ui/Timer';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Users, 
  TrendingUp,
  Trophy,
  Eye,
  Monitor
} from 'lucide-react';

type Phase = 'announcement' | 'jokers' | 'question' | 'results';

export const HostDashboard: React.FC = () => {
  const { currentQuiz, currentSession, players, sessionCode } = useQuizStore();
  const { setCurrentPhase, broadcastPhaseChange } = useStrategicQuizStore();

  const [currentPhaseState, setCurrentPhaseState] = useState<Phase>('announcement');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(12);

  const phaseDurations = {
    announcement: 12,
    jokers: 12,
    question: 30,
    results: 5,
  };

  const totalQuestions = 15; // Mock for now

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
  }, [isPlaying, phaseTimeRemaining]);

  const handlePhaseComplete = () => {
    // Auto-advance to next phase
    const phaseOrder: Phase[] = ['announcement', 'jokers', 'question', 'results'];
    const currentIndex = phaseOrder.indexOf(currentPhaseState);
    
    if (currentIndex < phaseOrder.length - 1) {
      // Next phase in sequence
      const nextPhase = phaseOrder[currentIndex + 1];
      changePhase(nextPhase);
    } else {
      // End of cycle, move to next question
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        changePhase('announcement');
      } else {
        // Quiz finished
        setIsPlaying(false);
      }
    }
  };

  const changePhase = (newPhase: Phase) => {
    setCurrentPhaseState(newPhase);
    setPhaseTimeRemaining(phaseDurations[newPhase]);
    setCurrentPhase(newPhase);
    
    // Broadcast to all players
    broadcastPhaseChange({
      phase: newPhase,
      questionIndex: currentQuestionIndex,
      timeRemaining: phaseDurations[newPhase],
    });
  };

  const handleStartPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipPhase = () => {
    setPhaseTimeRemaining(0);
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
    return <div>Loading...</div>;
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
              Player View
            </Button>
          </div>
        </div>

        {/* Main Control Panel */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Phase Control */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Phase */}
            <Card className={`p-8 bg-gradient-to-br ${getPhaseColor(currentPhaseState)}`}>
              <div className="text-center space-y-4">
                <div className="text-8xl">{getPhaseIcon(currentPhaseState)}</div>
                <h2 className="text-4xl font-bold text-white uppercase">
                  {currentPhaseState} Phase
                </h2>
                <div className="text-7xl font-mono font-bold text-white">
                  {phaseTimeRemaining}s
                </div>
                <div className="text-xl text-white/90">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
              </div>
            </Card>

            {/* Controls */}
            <Card gradient className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="xl"
                  onClick={handleStartPause}
                  icon={isPlaying ? <Pause /> : <Play />}
                  gradient={isPlaying}
                  variant={isPlaying ? 'primary' : 'secondary'}
                >
                  {isPlaying ? 'Pause' : 'Start'}
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

              {/* Phase Selector */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {(['announcement', 'jokers', 'question', 'results'] as Phase[]).map((phase) => (
                  <Button
                    key={phase}
                    onClick={() => changePhase(phase)}
                    variant={currentPhaseState === phase ? 'primary' : 'ghost'}
                    disabled={isPlaying}
                    className="capitalize"
                  >
                    {phase}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Question Preview */}
            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Current Question</h3>
              <div className="bg-qb-darker p-6 rounded-xl">
                <p className="text-2xl text-white mb-4">
                  What is the capital of France?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['Paris', 'London', 'Berlin', 'Madrid'].map((option, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        option === 'Paris'
                          ? 'bg-green-500/20 border-2 border-green-500'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <span className="text-white font-bold">
                        {['A', 'B', 'C', 'D'][idx]}. {option}
                      </span>
                      {option === 'Paris' && (
                        <span className="text-green-400 ml-2">✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right - Stats & Players */}
          <div className="space-y-6">
            {/* Session Stats */}
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
                  <span>Avg Response:</span>
                  <span className="font-bold text-qb-yellow">4.2s</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Accuracy:</span>
                  <span className="font-bold text-qb-purple">78%</span>
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
                {players
                  .sort((a, b) => b.total_score - a.total_score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        index === 0
                          ? 'bg-yellow-500/20 border border-yellow-500'
                          : 'bg-qb-darker'
                      }`}
                    >
                      <div className="text-2xl font-bold text-white/50 w-8">
                        #{index + 1}
                      </div>
                      <div className="text-2xl">{player.avatar_emoji}</div>
                      <div className="flex-1">
                        <div className="font-bold text-white">
                          {player.player_name}
                        </div>
                        <div className="text-sm text-white/50">
                          {player.correct_answers}/{player.questions_answered} correct
                        </div>
                      </div>
                      <div className="text-xl font-bold text-qb-cyan">
                        {player.total_score}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Players List */}
            <Card gradient className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Players ({players.length})
              </h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 bg-qb-darker rounded-lg"
                  >
                    <div className="text-xl">{player.avatar_emoji}</div>
                    <div className="flex-1 text-white text-sm">
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
