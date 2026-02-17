import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuizStore } from '../stores/useQuizStore';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, QrCode, UserCircle, Users, Mail, Trophy, BarChart3, Target } from 'lucide-react';
import { supabase } from '../services/supabase/client';

export const JoinQuiz: React.FC = () => {
  const { t } = useTranslation();
  const { joinSession, isLoading, error } = useQuizStore();
  const navigate = useAppNavigate();

  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConsent, setEmailConsent] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('😀');
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const TEAM_COLORS = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-cyan-500',
  ];

  // Check URL params for code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
    }
  }, []);

  const emojis = ['😀', '😎', '🤓', '🥳', '🤩', '😇', '🤠', '🥸', '🤡', '👻', '🦄', '🐱', '🐶', '🦊', '🐼', '🦁'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if session has team mode enabled
      const { data: session } = await supabase
        .from('quiz_sessions')
        .select('settings, team_mode')
        .eq('session_code', code.toUpperCase())
        .single();

      const settings = (session?.settings as Record<string, unknown>) || {};
      const isTeamMode = session?.team_mode || settings.teamMode;
      const sessionTeamNames = (settings.teamNames as string[]) || [];

      if (isTeamMode && sessionTeamNames.length > 0 && !selectedTeam) {
        setTeamNames(sessionTeamNames);
        setShowTeamSelection(true);
        return;
      }

      const playerEmail = (email && emailConsent) ? email : undefined;
      await joinSession(code.toUpperCase(), playerName, playerEmail, selectedEmoji, selectedTeam || undefined);
      navigate('lobby');
    } catch (err) {
      console.error('Failed to join session:', err);
    }
  };

  const handleTeamJoin = async () => {
    if (!selectedTeam) return;
    try {
      const playerEmail = (email && emailConsent) ? email : undefined;
      await joinSession(code.toUpperCase(), playerName, playerEmail, selectedEmoji, selectedTeam);
      navigate('lobby');
    } catch (err) {
      console.error('Failed to join session:', err);
    }
  };

  // Pre-registration landing: show email warning first, then form
  if (!showForm) {
    return (
      <div className="min-h-screen bg-qb-dark">
        {/* Animated CSS */}
        <style>{`
          @keyframes join-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.4); }
            50% { transform: scale(1.02); box-shadow: 0 0 40px 10px rgba(250, 204, 21, 0.2); }
          }
          @keyframes join-bounce {
            0%, 100% { transform: translateY(0); }
            25% { transform: translateY(-10px); }
            75% { transform: translateY(5px); }
          }
          @keyframes join-glow {
            0%, 100% { text-shadow: 0 0 20px rgba(250, 204, 21, 0.5); }
            50% { text-shadow: 0 0 40px rgba(250, 204, 21, 0.8), 0 0 60px rgba(250, 204, 21, 0.4); }
          }
        `}</style>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Logo / Title */}
            <div className="text-center">
              <h1 className="text-5xl font-black gradient-primary bg-clip-text text-transparent">
                QuizzaBoom
              </h1>
              <p className="text-white/60 mt-1 text-lg">{t('join.subtitle')}</p>
            </div>

            {/* BIG Email Warning — the star of this screen */}
            <div
              className="rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 p-6 border-4 border-yellow-300"
              style={{ animation: 'join-pulse 2s ease-in-out infinite' }}
            >
              <div className="text-center">
                <div className="inline-block text-6xl mb-3" style={{ animation: 'join-bounce 1.5s ease-in-out infinite' }}>
                  📧
                </div>
                <h2
                  className="text-3xl font-black text-gray-900 mb-2"
                  style={{ animation: 'join-glow 2s ease-in-out infinite' }}
                >
                  {t('join.preRegWarningTitle')}
                </h2>
                <p className="text-lg font-bold text-gray-800 mb-4">
                  {t('join.preRegWarningDesc')}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-3">
                  <div className="bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gray-900" />
                    <span className="font-bold text-gray-900">{t('join.preRegBenefitRanking')}</span>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-900" />
                    <span className="font-bold text-gray-900">{t('join.preRegBenefitStats')}</span>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-900" />
                    <span className="font-bold text-gray-900">{t('join.preRegBenefitDetails')}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">
                  {t('join.preRegSafetyNote')}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="xl"
              gradient
              fullWidth
              onClick={() => setShowForm(true)}
              className="text-2xl py-6"
            >
              {`🎮 ${t('join.preRegCTA')}`}
            </Button>

            {/* Back */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('home')}
                icon={<ArrowLeft />}
              >
                {t('common.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              icon={<ArrowLeft />}
            >
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                {t('join.title')}
              </h1>
            </div>
          </div>

          {/* Form */}
          <Card gradient className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Session Code */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-qb-cyan" />
                  {t('join.sessionCode')} *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t('join.codePlaceholder')}
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg bg-qb-darker text-white text-center text-2xl font-mono tracking-widest border border-white/20 focus:border-qb-cyan focus:outline-none focus:ring-2 focus:ring-qb-cyan/30 uppercase"
                />
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-qb-magenta" />
                  {t('join.yourName')} *
                </label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder={t('join.namePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg bg-qb-darker text-white border border-white/20 focus:border-qb-magenta focus:outline-none focus:ring-2 focus:ring-qb-magenta/30"
                />
              </div>

              {/* Email — highlighted with warning */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-yellow-400" />
                  {t('join.email')}
                  <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full font-bold">{t('join.emailRecommended')}</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value && !emailConsent) {
                      setEmailConsent(true);
                    }
                    if (!e.target.value) {
                      setEmailConsent(false);
                    }
                  }}
                  placeholder={t('join.emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg bg-qb-darker text-white border-2 border-yellow-500/50 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                />
                {email && (
                  <div className="mt-2 p-2 bg-qb-purple/10 border border-qb-purple/30 rounded-lg">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailConsent}
                        onChange={(e) => setEmailConsent(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded accent-qb-purple shrink-0"
                      />
                      <div>
                        <span className="text-sm text-white/80 font-medium">
                          {t('join.emailConsentTitle')}
                        </span>
                        <p className="text-xs text-white/50 mt-0.5">
                          {t('join.emailConsent')}{' '}
                          <a href="/privacy" className="text-qb-cyan underline">{t('join.privacyPolicy')}</a>
                        </p>
                      </div>
                    </label>
                  </div>
                )}
                {!email && (
                  <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                    {t('join.emailResultsWarning')}
                  </p>
                )}
              </div>

              {/* Avatar Selection — compact */}
              <div>
                <label className="block text-white font-medium mb-2">
                  {t('join.chooseAvatar')}
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-3xl p-2 rounded-lg transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-qb-cyan scale-110'
                          : 'bg-qb-darker hover:bg-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="xl"
                gradient
                fullWidth
                loading={isLoading}
                disabled={!code.trim() || !playerName.trim() || code.length !== 6}
              >
                {isLoading ? t('join.joining') : `🎮 ${t('join.joinBattle')}`}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Team Selection Modal */}
      {showTeamSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="max-w-lg w-full p-8 bg-qb-darker border-2 border-qb-cyan">
            <div className="text-center mb-6">
              <Users className="w-12 h-12 text-qb-cyan mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white">{t('join.selectTeam')}</h2>
            </div>
            <div className="space-y-3">
              {teamNames.map((team, idx) => (
                <button
                  key={team}
                  type="button"
                  onClick={() => setSelectedTeam(team)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selectedTeam === team
                      ? 'border-white scale-105 shadow-lg'
                      : 'border-white/20 hover:border-white/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${TEAM_COLORS[idx % TEAM_COLORS.length]}`} />
                  <span className="text-white font-bold text-lg">{team}</span>
                  {selectedTeam === team && (
                    <span className="ml-auto text-qb-cyan font-bold">&#10003;</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                fullWidth
                variant="ghost"
                onClick={() => {
                  setShowTeamSelection(false);
                  setSelectedTeam(null);
                }}
              >
                {t('common.back')}
              </Button>
              <Button
                fullWidth
                gradient
                disabled={!selectedTeam}
                loading={isLoading}
                onClick={handleTeamJoin}
              >
                {isLoading ? t('join.joining') : `🎮 ${t('join.joinBattle')}`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
