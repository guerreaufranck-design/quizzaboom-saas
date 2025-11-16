import React, { useEffect, useState } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { QRCodeDisplay } from '../components/ui/QRCodeDisplay';
import { ArrowLeft, Users, Play, Copy, Check, Share2 } from 'lucide-react';

export const QuizLobby: React.FC = () => {
  const {
    currentSession,
    currentQuiz,
    sessionCode,
    players,
    isHost,
    setCurrentView,
    startSession,
    setupRealtimeSubscription,
    cleanupRealtime,
  } = useQuizStore();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionCode) {
      setupRealtimeSubscription(sessionCode);
    }

    return () => {
      cleanupRealtime();
    };
  }, [sessionCode]);

  const copySessionCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = () => {
    const url = `${window.location.origin}?code=${sessionCode}&view=join`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleStartQuiz = async () => {
    if (players.length === 0) {
      alert('Wait for at least one player to join!');
      return;
    }
    await startSession();
  };

  if (!currentSession || !currentQuiz) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Loading lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isHost && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView('home')}
                  icon={<ArrowLeft />}
                >
                  Cancel
                </Button>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white">{currentQuiz.title}</h1>
                <p className="text-white/70 mt-2">{currentQuiz.description}</p>
              </div>
            </div>

            {isHost && (
              <Button
                size="xl"
                gradient
                onClick={handleStartQuiz}
                icon={<Play />}
                disabled={players.length === 0}
              >
                Start Quiz
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Session Info */}
            <div className="space-y-6">
              {/* Session Code */}
              <Card gradient className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Session Code</h2>
                <div className="bg-qb-darker rounded-xl p-6 mb-4">
                  <div className="text-6xl font-mono font-bold text-qb-cyan tracking-widest">
                    {sessionCode}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={copySessionCode}
                    icon={copied ? <Check /> : <Copy />}
                  >
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                  <Button
                    fullWidth
                    variant="ghost"
                    onClick={shareLink}
                    icon={<Share2 />}
                  >
                    Share Link
                  </Button>
                </div>
              </Card>

              {/* QR Code */}
              <Card gradient className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Scan to Join</h2>
                <div className="flex justify-center">
                  <QRCodeDisplay value={sessionCode || ''} size={256} />
                </div>
                <p className="text-white/70 mt-4">
                  Players can scan this QR code to join instantly
                </p>
              </Card>

              {/* Quiz Info */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quiz Details</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-bold text-qb-cyan">{currentQuiz.estimated_duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stages:</span>
                    <span className="font-bold text-qb-magenta">{currentQuiz.total_stages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span className="font-bold text-qb-purple">
                      ~{currentQuiz.total_stages * currentQuiz.questions_per_stage}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span className="font-bold text-qb-yellow capitalize">{currentQuiz.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strategic Mode:</span>
                    <span className="font-bold text-qb-lime">
                      {currentQuiz.has_joker_rounds ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Players List */}
            <div className="space-y-6">
              <Card gradient className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Players ({players.length})
                  </h2>
                  {currentSession.unlimited_players && (
                    <span className="text-sm text-white/70">Up to 250 players</span>
                  )}
                </div>

                {players.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-xl text-white/70 mb-2">Waiting for players...</p>
                    <p className="text-sm text-white/50">
                      Share the code or QR code to get started!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-4 bg-qb-darker rounded-xl"
                      >
                        <div className="text-4xl">{player.avatar_emoji}</div>
                        <div className="flex-1">
                          <div className="font-bold text-white">{player.player_name}</div>
                          <div className="text-sm text-white/50">
                            Joined {new Date(player.joined_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: player.is_connected ? '#10B981' : '#EF4444' }}
                          />
                          <span className="text-sm text-white/70">
                            {player.is_connected ? 'Ready' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Joker Info */}
              {currentQuiz.has_joker_rounds && (
                <Card className="p-6 bg-gradient-to-br from-qb-purple/20 to-qb-magenta/20 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">Strategic Mode Active</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl mb-1">🛡️</div>
                      <div className="text-xs text-white/70">Protection × 2</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-1">🚫</div>
                      <div className="text-xs text-white/70">Block × 10</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-1">💰</div>
                      <div className="text-xs text-white/70">Steal × 10</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-1">⭐</div>
                      <div className="text-xs text-white/70">Double × 5</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
