import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuizStore } from '../stores/useQuizStore';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, QrCode, UserCircle } from 'lucide-react';

export const JoinQuiz: React.FC = () => {
  const { t } = useTranslation();
  const { joinSession, isLoading, error } = useQuizStore();
  const navigate = useAppNavigate();

  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConsent, setEmailConsent] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('😀');

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
      const playerEmail = (email && emailConsent) ? email : undefined;
      await joinSession(code.toUpperCase(), playerName, playerEmail, selectedEmoji);
      navigate('lobby');
    } catch (err) {
      console.error('Failed to join session:', err);
    }
  };

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('home')}
              icon={<ArrowLeft />}
            >
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                {t('join.title')}
              </h1>
              <p className="text-white/70 mt-2">
                {t('join.subtitle')}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card gradient className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <p className="text-sm text-white/50 mt-2 text-center">
                  {t('join.codeHint')}
                </p>
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

              {/* Email (Optional) */}
              <div>
                <label className="block text-white font-medium mb-2">
                  {t('join.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('join.emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg bg-qb-darker text-white border border-white/20 focus:border-qb-purple focus:outline-none focus:ring-2 focus:ring-qb-purple/30"
                />
                {email && (
                  <label className="flex items-start gap-3 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailConsent}
                      onChange={(e) => setEmailConsent(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded accent-qb-purple shrink-0"
                    />
                    <span className="text-xs text-white/60">
                      {t('join.emailConsent')}{' '}
                      <a href="/privacy" className="text-qb-cyan underline">{t('join.privacyPolicy')}</a>
                    </span>
                  </label>
                )}
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-white font-medium mb-3">
                  {t('join.chooseAvatar')}
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-4xl p-3 rounded-lg transition-all ${
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
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200">{error}</p>
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

          {/* Info */}
          <Card className="p-6 text-center">
            <p className="text-white/70">
              <span className="font-bold text-qb-cyan">{t('common.tip')}:</span> {t('join.connectionTip')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
