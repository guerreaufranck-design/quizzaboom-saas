import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuizStore } from '../stores/useQuizStore';
import { useStrategicQuizStore } from '../stores/useStrategicQuizStore';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useUserEntitlement } from '../hooks/useUserEntitlement';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { QRCodeDisplay } from '../components/ui/QRCodeDisplay';
import { ArrowLeft, Users, Play, Copy, Check, Share2, Clock, AlertTriangle, Loader2, Monitor, Users2, Eye, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase/client';

export const QuizLobby: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const { consumeCredit } = useUserEntitlement();
  const {
    currentSession,
    currentQuiz,
    sessionCode,
    players,
    isHost,
    startSession,
    setupRealtimeSubscription,
    cleanupRealtime,
    loadPlayers,
    setCurrentView,
  } = useQuizStore();

  const { allQuestions, loadQuestions } = useStrategicQuizStore();
  const [copied, setCopied] = useState(false);
  const [copiedTV, setCopiedTV] = useState(false);
  const [showStartWarning, setShowStartWarning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load questions for preview (host only)
  useEffect(() => {
    if (isHost && currentQuiz?.id && allQuestions.length === 0) {
      loadQuestions(currentQuiz.id);
    }
  }, [isHost, currentQuiz?.id]);

  useEffect(() => {
    // Load players immediately
    if (currentSession?.id) {
      loadPlayers(currentSession.id);
    }

    // Setup realtime subscription
    if (sessionCode) {
      setupRealtimeSubscription(sessionCode);
    }

    // Auto-refresh players every 500ms
    const refreshInterval = setInterval(() => {
      if (currentSession?.id) {
        loadPlayers(currentSession.id);
      }
    }, 500);

    // Safety net for players: poll DB every 2s to detect quiz started
    // In case Realtime misses the quiz_started event
    let statusPollInterval: NodeJS.Timeout | undefined;
    if (!isHost && currentSession?.id) {
      statusPollInterval = setInterval(async () => {
        try {
          const { data } = await supabase
            .from('quiz_sessions')
            .select('status')
            .eq('id', currentSession.id)
            .single();
          if (data?.status === 'playing') {
            console.log('🔄 Poll detected quiz started — redirecting to playing view');
            clearInterval(statusPollInterval);
            setCurrentView('playing');
          }
        } catch (err) {
          // Ignore poll errors
        }
      }, 2000);
    }

    return () => {
      clearInterval(refreshInterval);
      if (statusPollInterval) clearInterval(statusPollInterval);
      cleanupRealtime();
    };
  }, [sessionCode, currentSession?.id]);

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
    alert(t('lobby.linkCopied'));
  };

  const tvLink = `${window.location.origin}/tv?code=${sessionCode}`;

  const copyTVLink = () => {
    navigator.clipboard.writeText(tvLink);
    setCopiedTV(true);
    setTimeout(() => setCopiedTV(false), 2000);
  };

  const handleStartQuiz = () => {
    if (players.length === 0) {
      alert(t('lobby.noPlayers'));
      return;
    }
    setStartError(null);
    setShowStartWarning(true);
  };

  const handleConfirmStart = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      await consumeCredit();
      console.log('✅ Credit consumed successfully');
      await startSession();
      setShowStartWarning(false);
    } catch (error) {
      console.error('❌ Failed to start quiz:', error);
      const message = error instanceof Error ? error.message : '';
      if (message.includes('No available credits') || message.includes('credits')) {
        setStartError(t('lobby.noCreditsError'));
      } else {
        setStartError(t('lobby.startError'));
      }
    } finally {
      setIsStarting(false);
    }
  };

  const TEAM_COLORS = [
    'bg-blue-500/20 border-blue-500/50',
    'bg-red-500/20 border-red-500/50',
    'bg-green-500/20 border-green-500/50',
    'bg-yellow-500/20 border-yellow-500/50',
    'bg-purple-500/20 border-purple-500/50',
    'bg-pink-500/20 border-pink-500/50',
    'bg-orange-500/20 border-orange-500/50',
    'bg-cyan-500/20 border-cyan-500/50',
  ];

  const TEAM_HEADER_COLORS = [
    'text-blue-400', 'text-red-400', 'text-green-400', 'text-yellow-400',
    'text-purple-400', 'text-pink-400', 'text-orange-400', 'text-cyan-400',
  ];

  const sessionSettings = (currentSession?.settings as Record<string, unknown>) || {};
  const isTeamMode = currentSession?.team_mode || sessionSettings.teamMode;
  const teamNamesList = (sessionSettings.teamNames as string[]) || [];

  // Group players by team
  const playersByTeam = isTeamMode
    ? teamNamesList.reduce<Record<string, typeof players>>((acc, teamName) => {
        acc[teamName] = players.filter(p => p.team_name === teamName);
        return acc;
      }, {})
    : {};

  if (!currentSession || !currentQuiz) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">{t('lobby.loading')}</p>
        </div>
      </div>
    );
  }

  // PLAYER VIEW - Simplified lobby without controls
  if (!isHost) {
    return (
      <div className="min-h-screen bg-qb-dark py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Quiz Info */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">{currentQuiz.title}</h1>
              <p className="text-white/70 mb-4">{currentQuiz.description}</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-qb-cyan/20 border border-qb-cyan rounded-full">
                <span className="text-qb-cyan font-mono font-bold text-xl">{sessionCode}</span>
              </div>
            </div>

            {/* Waiting Message */}
            <Card className="p-12 text-center bg-gradient-to-br from-qb-purple/20 to-qb-cyan/20">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('lobby.waitingForHost')}
              </h2>
              <p className="text-xl text-white/70 mb-6">
                {t('lobby.getReady')}
              </p>
              <div className="flex items-center justify-center gap-2 text-white/50">
                <Clock className="w-5 h-5 animate-pulse" />
                <span>{t('lobby.stayConnected')}</span>
              </div>
            </Card>

            {/* Players Grid */}
            <Card gradient className="p-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                {t('lobby.playersInLobby', { count: players.length })}
              </h3>
              {isTeamMode && teamNamesList.length > 0 ? (
                <div className="space-y-4">
                  {teamNamesList.map((teamName, idx) => {
                    const teamPlayers = playersByTeam[teamName] || [];
                    return (
                      <div key={teamName} className={`rounded-xl border p-4 ${TEAM_COLORS[idx % TEAM_COLORS.length]}`}>
                        <div className={`font-bold mb-3 flex items-center gap-2 ${TEAM_HEADER_COLORS[idx % TEAM_HEADER_COLORS.length]}`}>
                          <Users2 className="w-4 h-4" />
                          <span>{t('lobby.team')}: {teamName}</span>
                          <span className="text-xs text-white/50 ml-auto">{t('lobby.teamMembers', { count: teamPlayers.length })}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {teamPlayers.map((player) => (
                            <div key={player.id} className="p-3 bg-qb-darker rounded-xl text-center">
                              <div className="text-3xl mb-1">{player.avatar_emoji}</div>
                              <div className="font-bold text-white text-sm truncate">{player.player_name}</div>
                              <div
                                className="w-2 h-2 rounded-full mx-auto mt-1"
                                style={{ backgroundColor: player.is_connected ? '#10B981' : '#EF4444' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="p-4 bg-qb-darker rounded-xl text-center"
                    >
                      <div className="text-4xl mb-2">{player.avatar_emoji}</div>
                      <div className="font-bold text-white text-sm truncate">
                        {player.player_name}
                      </div>
                      <div
                        className="w-2 h-2 rounded-full mx-auto mt-2"
                        style={{
                          backgroundColor: player.is_connected ? '#10B981' : '#EF4444',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quiz Details */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 text-center">{t('lobby.quizInfo')}</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-qb-cyan">{currentQuiz.estimated_duration}</div>
                  <div className="text-sm text-white/70">{t('lobby.minutes')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-qb-magenta">{currentQuiz.total_stages}</div>
                  <div className="text-sm text-white/70">{t('lobby.stages')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-qb-purple">
                    ~{currentQuiz.total_stages * currentQuiz.questions_per_stage}
                  </div>
                  <div className="text-sm text-white/70">{t('lobby.questions')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-qb-yellow capitalize">
                    {currentQuiz.difficulty}
                  </div>
                  <div className="text-sm text-white/70">{t('lobby.difficulty')}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // HOST VIEW - Full control lobby
  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('dashboard')}
                icon={<ArrowLeft />}
              >
                {t('common.cancel')}
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white">{currentQuiz.title}</h1>
                <p className="text-white/70 mt-2">{currentQuiz.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowPreview(true)}
                icon={<Eye />}
              >
                {t('lobby.previewQuestions')}
              </Button>
              <Button
                size="xl"
                gradient
                onClick={handleStartQuiz}
                icon={<Play />}
                disabled={players.length === 0}
              >
                {t('lobby.startQuiz')}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Session Info */}
            <div className="space-y-6">
              {/* Session Code */}
              <Card gradient className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">{t('lobby.sessionCode')}</h2>
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
                    {copied ? t('lobby.copied') : t('lobby.copyCode')}
                  </Button>
                  <Button
                    fullWidth
                    variant="ghost"
                    onClick={shareLink}
                    icon={<Share2 />}
                  >
                    {t('lobby.shareLink')}
                  </Button>
                </div>
              </Card>

              {/* TV Display Link */}
              <Card className="p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="w-6 h-6 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">{t('lobby.tvDisplayLink')}</h2>
                </div>
                <div className="bg-qb-darker rounded-lg p-3 mb-3 flex items-center gap-3">
                  <code className="text-sm text-qb-cyan font-mono flex-1 truncate">{tvLink}</code>
                  <Button
                    size="sm"
                    variant={copiedTV ? 'primary' : 'secondary'}
                    onClick={copyTVLink}
                    icon={copiedTV ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copiedTV ? t('lobby.copiedTVLink') : t('lobby.copyCode')}
                  </Button>
                </div>
                <p className="text-sm text-white/60">{t('lobby.tvDisplayHint')}</p>
              </Card>

              {/* QR Code */}
              <Card gradient className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">{t('lobby.scanToJoin')}</h2>
                <div className="flex justify-center">
                  <QRCodeDisplay value={sessionCode || ''} size={256} />
                </div>
                <p className="text-white/70 mt-4">
                  {t('lobby.qrCodeHint')}
                </p>
              </Card>

              {/* Quiz Info */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t('lobby.quizDetails')}</h3>
                <div className="space-y-3 text-white/80">
                  <div className="flex justify-between">
                    <span>{t('lobby.duration')}</span>
                    <span className="font-bold text-qb-cyan">{currentQuiz.estimated_duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('lobby.stagesLabel')}</span>
                    <span className="font-bold text-qb-magenta">{currentQuiz.total_stages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('lobby.questionsLabel')}</span>
                    <span className="font-bold text-qb-purple">
                      ~{currentQuiz.total_stages * currentQuiz.questions_per_stage}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('lobby.difficultyLabel')}</span>
                    <span className="font-bold text-qb-yellow capitalize">{currentQuiz.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('lobby.strategicMode')}</span>
                    <span className="font-bold text-qb-lime">
                      {currentQuiz.has_joker_rounds ? `✓ ${t('lobby.enabled')}` : `✗ ${t('lobby.disabled')}`}
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
                    {t('lobby.playersCount', { count: players.length })}
                  </h2>
                  {currentSession.unlimited_players && (
                    <span className="text-sm text-white/70">{t('lobby.maxPlayers')}</span>
                  )}
                </div>

                {players.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-xl text-white/70 mb-2">{t('lobby.waitingForPlayers')}</p>
                    <p className="text-sm text-white/50">
                      {t('lobby.shareToStart')}
                    </p>
                  </div>
                ) : isTeamMode && teamNamesList.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {teamNamesList.map((teamName, idx) => {
                      const teamPlayers = playersByTeam[teamName] || [];
                      return (
                        <div key={teamName} className={`rounded-xl border p-3 ${TEAM_COLORS[idx % TEAM_COLORS.length]}`}>
                          <div className={`font-bold text-sm mb-2 flex items-center gap-2 ${TEAM_HEADER_COLORS[idx % TEAM_HEADER_COLORS.length]}`}>
                            <Users2 className="w-4 h-4" />
                            {teamName}
                            <span className="text-xs text-white/50 ml-auto">{t('lobby.teamMembers', { count: teamPlayers.length })}</span>
                          </div>
                          {teamPlayers.map((player) => (
                            <div key={player.id} className="flex items-center gap-3 p-2 bg-qb-darker/50 rounded-lg mb-1">
                              <div className="text-2xl">{player.avatar_emoji}</div>
                              <div className="flex-1">
                                <div className="font-bold text-white text-sm">{player.player_name}</div>
                              </div>
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: player.is_connected ? '#10B981' : '#EF4444' }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-4 bg-qb-darker rounded-xl"
                      >
                        <div className="text-4xl">{player.avatar_emoji}</div>
                        <div className="flex-1">
                          <div className="font-bold text-white">{player.player_name}</div>
                          <div className="text-sm text-white/50">
                            {t('lobby.joined', { time: new Date(player.joined_at).toLocaleTimeString() })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: player.is_connected ? '#10B981' : '#EF4444' }}
                          />
                          <span className="text-sm text-white/70">
                            {player.is_connected ? t('lobby.ready') : t('lobby.offline')}
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
                  <h3 className="text-lg font-bold text-white mb-4">{t('lobby.strategicModeActive')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl mb-1">🛡️</div>
                      <div className="text-xs text-white/70">{t('lobby.jokerProtection')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-1">🚫</div>
                      <div className="text-xs text-white/70">{t('lobby.jokerBlock')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-1">💰</div>
                      <div className="text-xs text-white/70">{t('lobby.jokerSteal')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-1">⭐</div>
                      <div className="text-xs text-white/70">{t('lobby.jokerDouble')}</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Start Quiz Confirmation Modal */}
      <Modal
        isOpen={showStartWarning}
        onClose={() => !isStarting && setShowStartWarning(false)}
        title={t('lobby.startWarningTitle')}
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-qb-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-qb-yellow" />
          </div>
          <p className="text-white/80 text-lg mb-6">
            {t('lobby.startWarningMessage')}
          </p>
          {startError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {startError}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              fullWidth
              variant="ghost"
              onClick={() => setShowStartWarning(false)}
              disabled={isStarting}
            >
              {t('lobby.cancelStart')}
            </Button>
            <Button
              fullWidth
              gradient
              onClick={handleConfirmStart}
              disabled={isStarting}
              icon={isStarting ? <Loader2 className="animate-spin" /> : <Play />}
            >
              {isStarting ? t('common.loading') : t('lobby.confirmStart')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Questions Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={t('lobby.previewTitle')}
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-2">
          {allQuestions.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-qb-cyan mb-3" />
              <p className="text-white/70">{t('common.loading')}</p>
            </div>
          ) : (
            (() => {
              // Group questions by stage
              const stages: Record<string, typeof allQuestions> = {};
              allQuestions.forEach(q => {
                const stage = q.stage_id || 'General';
                if (!stages[stage]) stages[stage] = [];
                stages[stage].push(q);
              });

              return Object.entries(stages).map(([stageName, questions]) => (
                <div key={stageName}>
                  <div className="sticky top-0 bg-qb-dark/95 backdrop-blur-sm py-2 z-10">
                    <h3 className="text-lg font-bold text-qb-cyan flex items-center gap-2">
                      <span>🎯</span> {stageName}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <Card key={q.id} className="p-4 bg-qb-darker/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-qb-purple/30 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-qb-purple">{idx + 1}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="text-white font-medium">{q.question_text}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {(q.options || []).map((option, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                                    option === q.correct_answer
                                      ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                      : 'bg-white/5 border border-white/10 text-white/70'
                                  }`}
                                >
                                  <span className="font-bold text-xs">{['A', 'B', 'C', 'D'][optIdx]}</span>
                                  <span className="flex-1">{option}</span>
                                  {option === q.correct_answer && (
                                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                            {q.fun_fact && (
                              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                                <p className="text-xs text-yellow-300">
                                  <span className="font-bold">💡 </span>{q.fun_fact}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ));
            })()
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <Button
            fullWidth
            variant="ghost"
            onClick={() => setShowPreview(false)}
            icon={<X />}
          >
            {t('lobby.closePreview')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
