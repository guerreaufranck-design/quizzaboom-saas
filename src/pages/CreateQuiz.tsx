import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuizStore } from '../stores/useQuizStore';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { ArrowLeft, Sparkles, Hash, Target, Globe, Zap, Loader2, X, Shield, Ban, Repeat, Gem, Coffee, MessageSquare } from 'lucide-react';
import { calculateQuizStructureFromCount } from '../services/gemini';
import { THEMES, THEME_MODES, type ThemeCategory, type ThemeMode } from '../types/themes';
import type { QuizGenRequest, CommercialBreakConfig } from '../types/quiz';
import { useUserEntitlement } from '../hooks/useUserEntitlement';

const QUESTION_COUNT_OPTIONS = [
  { value: 25 as const, emoji: '⚡', labelKey: 'create.questions25', descKey: 'create.questions25Desc' },
  { value: 50 as const, emoji: '🎯', labelKey: 'create.questions50', descKey: 'create.questions50Desc' },
  { value: 100 as const, emoji: '🏆', labelKey: 'create.questions100', descKey: 'create.questions100Desc' },
];

const BREAK_DURATION_OPTIONS = [
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
  { value: 900, label: '15 min' },
  { value: 1200, label: '20 min' },
];

export const CreateQuiz: React.FC = () => {
  const { t } = useTranslation();
  const { generateQuiz, createSession, isLoading } = useQuizStore();
  const navigate = useAppNavigate();
  const { consumeCredit } = useUserEntitlement();

  const [selectedTheme, setSelectedTheme] = useState<ThemeCategory>('general');
  const [selectedMode, setSelectedMode] = useState<ThemeMode>('standard');
  const [excludedSubThemes, setExcludedSubThemes] = useState<string[]>([]);
  const [enabledJokers, setEnabledJokers] = useState({
    protection: true,
    block: true,
    steal: true,
    double_points: true,
  });
  const [formData, setFormData] = useState({
    questionCount: 25 as 25 | 50 | 100,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    language: 'fr' as QuizGenRequest['language'],
    includeJokers: true,
  });
  const [commercialBreaks, setCommercialBreaks] = useState<CommercialBreakConfig>({
    enabled: false,
    numberOfPauses: 2,
    breakDurationSeconds: 300,
    promoMessage: '',
  });

  const [generationStep, setGenerationStep] = useState<string>('');

  const quizStructure = calculateQuizStructureFromCount(formData.questionCount);
  const currentTheme = THEMES.find(t => t.category === selectedTheme);
  const activeSubThemes = currentTheme?.subThemes?.filter(st => !excludedSubThemes.includes(st)) || [];

  // Calculate where breaks would be placed
  const breakPreview = useMemo(() => {
    if (!commercialBreaks.enabled || commercialBreaks.numberOfPauses === 0) return [];
    const interval = formData.questionCount / (commercialBreaks.numberOfPauses + 1);
    return Array.from({ length: commercialBreaks.numberOfPauses }, (_, i) =>
      Math.round(interval * (i + 1))
    );
  }, [commercialBreaks.enabled, commercialBreaks.numberOfPauses, formData.questionCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setGenerationStep(t('create.generationSteps.connecting'));
      console.log('🎨 Starting quiz generation...');

      // Build theme string with active sub-themes for AI diversity
      const themeLabel = currentTheme?.label || selectedTheme;
      const modeLabel = THEME_MODES[selectedMode].label;
      const subThemesStr = activeSubThemes.length > 0 ? ` (focus: ${activeSubThemes.join(', ')})` : '';

      const request: QuizGenRequest = {
        theme: `${themeLabel} - ${modeLabel}${subThemesStr}`,
        questionCount: formData.questionCount,
        difficulty: formData.difficulty,
        language: formData.language,
        includeJokers: formData.includeJokers,
        enabledJokers: formData.includeJokers ? enabledJokers : undefined,
        commercialBreaks: commercialBreaks.enabled ? commercialBreaks : undefined,
      };

      setGenerationStep(t('create.generationSteps.generating', { count: quizStructure.totalQuestions }));
      const quiz = await generateQuiz(request);

      setGenerationStep(t('create.generationSteps.creating'));
      await createSession(
        quiz.id,
        formData.includeJokers ? enabledJokers : undefined,
        commercialBreaks.enabled ? commercialBreaks : undefined,
      );

      // Consume one credit (mark oldest unused purchase as used)
      try {
        await consumeCredit();
        console.log('✅ Credit consumed successfully');
      } catch (creditError) {
        console.error('⚠️ Failed to consume credit:', creditError);
        // Don't block quiz — session already created
      }

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
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
    }
  };

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

          {/* Loading Overlay */}
          {isLoading && (
            <Card className="mb-6 p-8 text-center bg-gradient-to-br from-qb-purple to-qb-cyan">
              <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {generationStep || t('create.generating')}
              </h2>
              <p className="text-white/80">
                {t('create.generationWait')}
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
                    onClick={() => { setSelectedTheme(theme.category); setExcludedSubThemes([]); }}
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-white/70">This quiz will include:</div>
                    {excludedSubThemes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExcludedSubThemes([])}
                        className="text-xs text-qb-cyan hover:text-qb-cyan/80 underline"
                      >
                        Reset all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentTheme.subThemes.map((subTheme) => {
                      const isExcluded = excludedSubThemes.includes(subTheme);
                      return (
                        <button
                          key={subTheme}
                          type="button"
                          onClick={() => {
                            if (isExcluded) {
                              setExcludedSubThemes(excludedSubThemes.filter(s => s !== subTheme));
                            } else if (activeSubThemes.length > 1) {
                              setExcludedSubThemes([...excludedSubThemes, subTheme]);
                            }
                          }}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all ${
                            isExcluded
                              ? 'bg-white/5 border border-white/10 text-white/40 line-through'
                              : 'bg-qb-purple/30 border border-qb-purple text-white hover:bg-qb-purple/50'
                          }`}
                        >
                          {subTheme}
                          {!isExcluded && activeSubThemes.length > 1 && (
                            <X className="w-3 h-3 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {excludedSubThemes.length > 0 && (
                    <div className="text-xs text-white/50 mt-2">
                      {activeSubThemes.length} sub-theme{activeSubThemes.length > 1 ? 's' : ''} active
                    </div>
                  )}
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

            {/* Question Count (replaces Duration) */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-qb-cyan" />
                {t('create.questionCount')}
              </label>
              <div className="grid grid-cols-3 gap-4">
                {QUESTION_COUNT_OPTIONS.map((option) => {
                  const structure = calculateQuizStructureFromCount(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, questionCount: option.value })}
                      disabled={isLoading}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        formData.questionCount === option.value
                          ? 'bg-qb-cyan border-qb-cyan scale-105 shadow-lg shadow-qb-cyan/50'
                          : 'bg-qb-darker border-white/20 hover:border-qb-cyan hover:scale-105'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="text-4xl mb-2">{option.emoji}</div>
                      <div className="text-3xl font-bold text-white mb-1">{option.value}</div>
                      <div className="text-sm text-white/80 font-medium">{t('create.questions')}</div>
                      <div className="text-xs text-white/50 mt-2">~{structure.estimatedDurationMinutes} min</div>
                      <div className="text-xs text-white/50">{t(option.descKey)}</div>
                    </button>
                  );
                })}
              </div>

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
                    <div className="text-3xl font-bold text-qb-magenta">~{quizStructure.estimatedDurationMinutes}</div>
                    <div className="text-xs text-white/60">{t('create.estimatedMinutes')}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Commercial Breaks */}
            <Card gradient className="p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commercialBreaks.enabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommercialBreaks({ ...commercialBreaks, enabled: e.target.checked })}
                  disabled={isLoading}
                  className="w-6 h-6 rounded accent-qb-yellow"
                />
                <div className="flex-1">
                  <div className="text-white font-bold flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-qb-yellow" />
                    {t('create.commercialBreaks')}
                  </div>
                  <p className="text-sm text-white/70 mt-1">
                    {t('create.commercialBreaksDesc')}
                  </p>
                </div>
              </label>

              {commercialBreaks.enabled && (
                <div className="mt-4 space-y-4">
                  {/* Number of pauses */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">{t('create.numberOfPauses')}</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCommercialBreaks({ ...commercialBreaks, numberOfPauses: n })}
                          disabled={isLoading}
                          className={`w-12 h-12 rounded-lg border-2 font-bold text-lg transition-all ${
                            commercialBreaks.numberOfPauses === n
                              ? 'bg-qb-yellow border-qb-yellow text-qb-dark'
                              : 'bg-qb-darker border-white/20 text-white hover:border-qb-yellow'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Break duration */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">{t('create.breakDuration')}</label>
                    <div className="flex flex-wrap gap-2">
                      {BREAK_DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCommercialBreaks({ ...commercialBreaks, breakDurationSeconds: opt.value })}
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                            commercialBreaks.breakDurationSeconds === opt.value
                              ? 'bg-qb-yellow border-qb-yellow text-qb-dark'
                              : 'bg-qb-darker border-white/20 text-white hover:border-qb-yellow'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Promo message */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {t('create.promoMessage')}
                    </label>
                    <input
                      type="text"
                      value={commercialBreaks.promoMessage || ''}
                      onChange={(e) => setCommercialBreaks({ ...commercialBreaks, promoMessage: e.target.value })}
                      placeholder={t('create.promoMessagePlaceholder')}
                      disabled={isLoading}
                      maxLength={200}
                      className="w-full px-4 py-3 bg-qb-darker border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:border-qb-yellow focus:outline-none"
                    />
                  </div>

                  {/* Break preview */}
                  {breakPreview.length > 0 && (
                    <div className="p-3 bg-qb-darker rounded-lg border border-qb-yellow/30">
                      <div className="text-sm text-qb-yellow font-medium mb-1">{t('create.breakPreview')}</div>
                      <div className="text-xs text-white/70">
                        {t('create.pauseAfterQuestions')}: {breakPreview.map(q => `Q${q}`).join(', ')}
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {commercialBreaks.numberOfPauses} {t('create.pausesOf')} {Math.floor(commercialBreaks.breakDurationSeconds / 60)} min
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                <option value="fr">Fran\u00e7ais</option>
                <option value="es">Espa\u00f1ol</option>
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

              {formData.includeJokers && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { key: 'protection' as const, icon: <Shield className="w-4 h-4" />, label: 'Protection', color: 'bg-blue-500' },
                    { key: 'block' as const, icon: <Ban className="w-4 h-4" />, label: 'Block', color: 'bg-red-500' },
                    { key: 'steal' as const, icon: <Repeat className="w-4 h-4" />, label: 'Steal', color: 'bg-orange-500' },
                    { key: 'double_points' as const, icon: <Gem className="w-4 h-4" />, label: 'Double Points', color: 'bg-yellow-500' },
                  ].map((joker) => (
                    <button
                      key={joker.key}
                      type="button"
                      onClick={() => setEnabledJokers({ ...enabledJokers, [joker.key]: !enabledJokers[joker.key] })}
                      disabled={isLoading}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        enabledJokers[joker.key]
                          ? `${joker.color}/20 border-white/30 text-white`
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      {joker.icon}
                      <span className="text-sm font-medium">{joker.label}</span>
                      <span className="ml-auto text-xs">
                        {enabledJokers[joker.key] ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
              <p><strong>{t('create.estimatedDuration')}:</strong> ~{quizStructure.estimatedDurationMinutes} min</p>
              <p><strong>{t('create.strategicGameplay')}</strong> {formData.includeJokers ? t('create.enabled') : t('create.disabled')}</p>
              {commercialBreaks.enabled && breakPreview.length > 0 && (
                <p><strong>{t('create.commercialBreaks')}:</strong> {commercialBreaks.numberOfPauses}x {Math.floor(commercialBreaks.breakDurationSeconds / 60)} min</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
