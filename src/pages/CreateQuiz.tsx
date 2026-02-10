import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuizStore } from '../stores/useQuizStore';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useUserEntitlement } from '../hooks/useUserEntitlement';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { ArrowLeft, Sparkles, Clock, Target, Globe, Zap, Loader2, Lock, CreditCard, AlertTriangle } from 'lucide-react';
import { calculateQuizStructure } from '../services/gemini';
import { THEMES, THEME_MODES, type ThemeCategory, type ThemeMode } from '../types/themes';
import type { QuizGenRequest } from '../types/quiz';

export const CreateQuiz: React.FC = () => {
  const { t } = useTranslation();
  const { generateQuiz, createSession, isLoading } = useQuizStore();
  const navigate = useAppNavigate();
  const routerNavigate = useNavigate();
  const entitlement = useUserEntitlement();

  const [selectedTheme, setSelectedTheme] = useState<ThemeCategory>('general');
  const [selectedMode, setSelectedMode] = useState<ThemeMode>('standard');
  const [formData, setFormData] = useState({
    duration: 30,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    language: 'fr' as QuizGenRequest['language'],
    includeJokers: true,
  });

  const [generationStep, setGenerationStep] = useState<string>('');

  const quizStructure = calculateQuizStructure(formData.duration);
  const currentTheme = THEMES.find(t => t.category === selectedTheme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setGenerationStep(t('create.generationSteps.connecting'));
      console.log('🎨 Starting quiz generation...');

      const request: QuizGenRequest = {
        theme: `${currentTheme?.label} - ${THEME_MODES[selectedMode].label}`,
        duration: formData.duration,
        difficulty: formData.difficulty,
        language: formData.language,
        includeJokers: formData.includeJokers,
      };

      setGenerationStep(t('create.generationSteps.generating', { count: quizStructure.totalQuestions }));
      const quiz = await generateQuiz(request);

      // Consume credit before creating session
      setGenerationStep(t('create.generationSteps.creating'));
      await entitlement.consumeCredit();

      await createSession(quiz.id);

      setGenerationStep(t('create.generationSteps.ready'));
      setTimeout(() => {
        navigate('lobby');
      }, 500);

    } catch (error) {
      console.error('Failed to create quiz:', error);
      setGenerationStep('');

      let errorMessage = 'Failed to generate quiz. ';
      const msg = error instanceof Error ? error.message : '';

      if (msg.includes('API key')) {
        errorMessage += 'API key not configured properly.';
      } else if (msg.includes('attempts')) {
        errorMessage += 'The AI service is taking too long. Please try again.';
      } else if (msg.includes('credits') || msg.includes('Credits')) {
        errorMessage += 'No credits available.';
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
    }
  };

  // Entitlement loading state
  if (entitlement.isLoading) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-qb-cyan animate-spin mx-auto mb-4" />
          <p className="text-white/60">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Entitlement gate - show blocking card if user cannot create
  if (!entitlement.canCreate) {
    const gateConfig = {
      no_credits: {
        icon: <CreditCard className="w-16 h-16 text-qb-cyan" />,
        title: t('create.noCredits'),
        description: t('create.noCreditsDesc'),
        buttonText: t('create.viewPlans'),
        buttonAction: () => routerNavigate('/pricing'),
      },
      trial_expired: {
        icon: <AlertTriangle className="w-16 h-16 text-qb-yellow" />,
        title: t('create.trialExpired'),
        description: t('create.trialExpiredDesc'),
        buttonText: t('create.viewPlans'),
        buttonAction: () => routerNavigate('/pricing'),
      },
      quota_reached: {
        icon: <Lock className="w-16 h-16 text-qb-magenta" />,
        title: t('create.quotaReached'),
        description: t('create.quotaReachedDesc'),
        buttonText: t('create.viewPlans'),
        buttonAction: () => routerNavigate('/pricing'),
      },
      cancelled: {
        icon: <AlertTriangle className="w-16 h-16 text-red-400" />,
        title: t('create.cancelled'),
        description: t('create.cancelledDesc'),
        buttonText: t('create.viewPlans'),
        buttonAction: () => routerNavigate('/pricing'),
      },
      ok: { icon: null, title: '', description: '', buttonText: '', buttonAction: () => {} },
    };

    const config = gateConfig[entitlement.reason];

    return (
      <div className="min-h-screen bg-qb-dark py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('home')}
                icon={<ArrowLeft />}
              >
                {t('common.back')}
              </Button>
            </div>

            <Card className="p-8 text-center bg-gradient-to-br from-qb-purple/20 to-qb-cyan/20 border border-white/10">
              <div className="mb-6">{config.icon}</div>
              <h2 className="text-2xl font-bold text-white mb-3">{config.title}</h2>
              <p className="text-white/70 mb-8">{config.description}</p>

              {entitlement.quizUsage && (
                <div className="mb-6 p-4 bg-qb-darker rounded-lg">
                  <div className="text-sm text-white/60 mb-1">{t('create.monthlyUsage')}</div>
                  <div className="text-2xl font-bold text-white">
                    {entitlement.quizUsage.used} / {entitlement.quizUsage.limit}
                  </div>
                </div>
              )}

              <Button
                size="xl"
                fullWidth
                gradient
                onClick={config.buttonAction}
              >
                {config.buttonText}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('home')}
              icon={<ArrowLeft />}
              disabled={isLoading}
            >
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white">{t('create.title')}</h1>
              <p className="text-white/70 mt-2">{t('create.subtitle')}</p>
            </div>
          </div>

          {/* Credit info banner */}
          {entitlement.userType === 'b2c' && (
            <Card className="mb-6 p-4 bg-qb-cyan/10 border border-qb-cyan/30">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-qb-cyan" />
                <span className="text-white/80">
                  {t('create.creditsAvailable', { count: entitlement.availableCredits })}
                </span>
              </div>
            </Card>
          )}

          {entitlement.userType === 'b2b' && entitlement.quizUsage && (
            <Card className="mb-6 p-4 bg-qb-purple/10 border border-qb-purple/30">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-qb-purple" />
                <span className="text-white/80">
                  {t('create.quizUsageInfo', { used: entitlement.quizUsage.used, limit: entitlement.quizUsage.limit })}
                </span>
              </div>
            </Card>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <Card className="mb-6 p-8 text-center bg-gradient-to-br from-qb-purple to-qb-cyan">
              <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {generationStep || t('create.generating')}
              </h2>
              <p className="text-white/80">
                This may take up to 30 seconds. Please wait...
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Theme Selection */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-qb-magenta" />
                {t('create.chooseTheme')} *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.category)}
                    disabled={isLoading}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedTheme === theme.category
                        ? 'bg-qb-cyan border-qb-cyan scale-105 shadow-lg shadow-qb-cyan/50'
                        : 'bg-qb-darker border-white/20 hover:border-qb-cyan hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-5xl mb-3">{theme.emoji}</div>
                    <div className="text-white font-bold text-lg mb-1">{theme.label}</div>
                    <div className="text-xs text-white/60">{theme.description}</div>
                  </button>
                ))}
              </div>

              {currentTheme && currentTheme.subThemes && (
                <div className="mt-4 p-4 bg-qb-darker rounded-lg">
                  <div className="text-sm text-white/70 mb-2">This quiz will include:</div>
                  <div className="flex flex-wrap gap-2">
                    {currentTheme.subThemes.map((subTheme) => (
                      <span
                        key={subTheme}
                        className="px-3 py-1 bg-qb-purple/30 border border-qb-purple rounded-full text-xs text-white"
                      >
                        {subTheme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Mode Selection */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-4">
                {t('create.quizMode')}
              </label>
              <div className="grid grid-cols-3 gap-4">
                {Object.values(THEME_MODES).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id as ThemeMode)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedMode === mode.id
                        ? 'bg-qb-magenta border-qb-magenta scale-105'
                        : 'bg-qb-darker border-white/20 hover:border-qb-magenta'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-4xl mb-2">{mode.emoji}</div>
                    <div className="text-white font-bold">{mode.label}</div>
                    <div className="text-xs text-white/60 mt-1">{mode.description}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Duration */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-qb-cyan" />
                {t('create.duration')}
              </label>
              <Select
                value={formData.duration.toString()}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                disabled={isLoading}
              >
                <option value="15">15 minutes (~10 questions)</option>
                <option value="30">30 minutes (~20 questions)</option>
                <option value="45">45 minutes (~30 questions)</option>
                <option value="60">60 minutes (~40 questions)</option>
                <option value="90">90 minutes (~60 questions)</option>
              </Select>

              <div className="mt-4 p-4 bg-qb-darker rounded-lg">
                <div className="text-sm text-white/70 mb-2">{t('create.quizStructure')}</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-qb-cyan">{quizStructure.totalQuestions}</div>
                    <div className="text-xs text-white/60">{t('create.questions')}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-qb-purple">{quizStructure.totalStages}</div>
                    <div className="text-xs text-white/60">{t('create.stages')}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-qb-magenta">{quizStructure.questionsPerStage}</div>
                    <div className="text-xs text-white/60">{t('create.perStage')}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Difficulty */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-qb-yellow" />
                {t('create.difficulty')}
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'easy' as const, label: t('create.easy'), emoji: '😊', desc: t('create.easyDesc') },
                  { value: 'medium' as const, label: t('create.medium'), emoji: '🤔', desc: t('create.mediumDesc') },
                  { value: 'hard' as const, label: t('create.hard'), emoji: '🔥', desc: t('create.hardDesc') },
                ].map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: level.value })}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.difficulty === level.value
                        ? 'bg-qb-yellow border-qb-yellow scale-105'
                        : 'bg-qb-darker border-white/20 hover:border-qb-yellow'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-3xl mb-2">{level.emoji}</div>
                    <div className="text-white font-bold">{level.label}</div>
                    <div className="text-xs text-white/60 mt-1">{level.desc}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Language */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-qb-lime" />
                {t('create.language')}
              </label>
              <Select
                value={formData.language}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, language: e.target.value as QuizGenRequest['language'] })}
                disabled={isLoading}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </Select>
            </Card>

            {/* Strategic Mode */}
            <Card gradient className="p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeJokers}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, includeJokers: e.target.checked })}
                  disabled={isLoading}
                  className="w-6 h-6 rounded accent-qb-magenta"
                />
                <div className="flex-1">
                  <div className="text-white font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-qb-magenta" />
                    {t('create.strategicMode')}
                  </div>
                  <p className="text-sm text-white/70 mt-1">
                    {t('create.strategicDesc')}
                  </p>
                </div>
              </label>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              size="xl"
              fullWidth
              gradient
              disabled={isLoading}
              icon={isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            >
              {isLoading ? generationStep || t('create.generating') : t('create.generateBtn', { count: quizStructure.totalQuestions })}
            </Button>
          </form>

          {/* Preview */}
          <Card className="mt-8 p-6 bg-gradient-to-br from-qb-purple/20 to-qb-cyan/20 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-3">{t('create.preview')}</h3>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{currentTheme?.emoji}</span>
                <div>
                  <div className="font-bold text-white">{currentTheme?.label}</div>
                  <div className="text-white/60">{THEME_MODES[selectedMode].label}</div>
                </div>
              </div>
              <div className="border-t border-white/10 my-3" />
              <p><strong>{t('create.aiGenerates')}</strong> {quizStructure.totalQuestions} {t('create.uniqueQuestions')}</p>
              <p><strong>{t('create.organizedIn')}</strong> {quizStructure.totalStages} {t('create.stages')}</p>
              <p><strong>{t('create.phasesPerQuestion')}</strong> Theme (25s) → Question (15s) → Answers (20s) → Results (20s) → Break (6s)</p>
              <p><strong>{t('create.strategicGameplay')}</strong> {formData.includeJokers ? t('create.enabled') : t('create.disabled')}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
