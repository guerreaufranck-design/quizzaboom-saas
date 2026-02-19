import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuizStore } from '../stores/useQuizStore';
import { useUserEntitlement } from '../hooks/useUserEntitlement';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { ArrowLeft, Sparkles, Hash, Target, Globe, Zap, Loader2, X, Shield, Ban, Repeat, Gem, Coffee, MessageSquare, Users, Plus, Trash2 } from 'lucide-react';
import { calculateQuizStructureFromCount } from '../services/gemini';
import { THEMES, THEME_MODES, type ThemeCategory, type ThemeMode } from '../types/themes';
import type { QuizGenRequest, CommercialBreakConfig } from '../types/quiz';


// Removed preset question counts (25/50/100) due to timeout issues — use custom only

const BREAK_DURATION_OPTIONS = [
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
  { value: 900, label: '15 min' },
  { value: 1200, label: '20 min' },
];

export const CreateQuiz: React.FC = () => {
  const { t } = useTranslation();
  const { generateQuiz, createSession, isLoading, generationProgress } = useQuizStore();
  const { consumeCredit, canCreate, reason, quizUsage } = useUserEntitlement();
  const navigate = useAppNavigate();
  const [selectedThemes, setSelectedThemes] = useState<ThemeCategory[]>(['general']);
  const [selectedMode, setSelectedMode] = useState<ThemeMode>('standard');
  const [excludedSubThemes, setExcludedSubThemes] = useState<string[]>([]);
  const [enabledJokers, setEnabledJokers] = useState({
    protection: true,
    block: true,
    steal: true,
    double_points: true,
  });
  const [jokerUses, setJokerUses] = useState({
    protection: 1,
    block: 1,
    steal: 1,
    double_points: 1,
  });
  const [teamMode, setTeamMode] = useState(false);
  const [teamNames, setTeamNames] = useState<string[]>(['Table 1', 'Table 2']);
  const [formData, setFormData] = useState({
    questionCount: 15,  // Default to 15 questions
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    language: 'en' as QuizGenRequest['language'],
    includeJokers: true,
  });
  const [customQuestionCount, setCustomQuestionCount] = useState('15');
  const [customThemes, setCustomThemes] = useState<string[]>([]);
  const [customThemeInput, setCustomThemeInput] = useState('');

  // Multi-theme toggle using functional setState to avoid stale closures
  const toggleTheme = useCallback((category: ThemeCategory) => {
    setSelectedThemes(prev => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        // Don't allow deselecting the last theme
        if (prev.length > 1) {
          // Also clean up excluded sub-themes for this category
          const themeObj = THEMES.find(t => t.category === category);
          if (themeObj?.subThemes) {
            setExcludedSubThemes(prevExcl =>
              prevExcl.filter(st => !themeObj.subThemes!.includes(st))
            );
          }
          return prev.filter(t => t !== category);
        }
        return prev; // Keep at least one
      } else {
        return [...prev, category];
      }
    });
  }, []);
  const [commercialBreaks, setCommercialBreaks] = useState<CommercialBreakConfig>({
    enabled: false,
    numberOfPauses: 2,
    breakDurationSeconds: 300,
    promoMessage: '',
    promoMessages: ['', ''],
  });

  const [generationStep, setGenerationStep] = useState<string>('');

  const quizStructure = calculateQuizStructureFromCount(formData.questionCount);
  const selectedThemeObjects = THEMES.filter(t => selectedThemes.includes(t.category));
  const allSubThemes = selectedThemeObjects.flatMap(t => t.subThemes || []);
  const activeSubThemes = allSubThemes.filter(st => !excludedSubThemes.includes(st));

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

    // Check plan limits BEFORE generating
    if (!canCreate) {
      if (reason === 'quota_reached') {
        alert(t('create.error.quotaReached', `You have reached your monthly limit of ${quizUsage?.limit || 5} quizzes. ${t('create.error.quotaHint', 'Upgrade to Pro for unlimited quizzes, or purchase B2C credits to continue.')}`));
      } else if (reason === 'trial_expired') {
        alert(t('create.error.trialExpired', 'Your trial has expired. Please subscribe to continue creating quizzes, or purchase B2C credits.'));
      } else if (reason === 'no_credits') {
        alert(t('create.error.noCredits', 'You have no quiz credits remaining. Please purchase more credits or upgrade your plan.'));
      } else if (reason === 'cancelled') {
        alert(t('create.error.cancelled', 'Your subscription has been cancelled. Please reactivate your subscription or purchase B2C credits.'));
      } else {
        alert(t('create.error.cannotCreate', 'Unable to create quiz. Please check your subscription status.'));
      }
      return;
    }

    try {
      setGenerationStep(t('create.generationSteps.connecting'));
      console.log('🎨 Starting quiz generation...');

      // Credit is consumed when the host actually STARTS the quiz (in QuizLobby),
      // not here — so users can explore the dashboard and preview the quiz freely.

      // Build theme string — custom themes are added alongside standard themes
      const hasCustom = selectedThemes.includes('custom') && customThemes.length > 0;
      const standardThemeLabels = selectedThemeObjects.filter(t => t.category !== 'custom').map(t => t.label);
      const allThemeLabels = hasCustom ? [...standardThemeLabels, ...customThemes] : standardThemeLabels;
      const themeLabel = allThemeLabels.join(' + ');
      const modeLabel = THEME_MODES[selectedMode].label;
      const subThemesStr = (activeSubThemes.length > 0 && !hasCustom) ? ` (focus: ${activeSubThemes.join(', ')})` : '';

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
        teamMode,
        teamMode ? teamNames.filter(n => n.trim()) : undefined,
        formData.includeJokers ? jokerUses : undefined,
      );

      setGenerationStep(t('create.generationSteps.ready'));
      setTimeout(() => {
        navigate('lobby');
      }, 500);

    } catch (error) {
      console.error('Failed to create quiz:', error);
      setGenerationStep('');

      const msg = error instanceof Error ? error.message : '';
      let errorMessage = '';

      if (msg.includes('API key')) {
        errorMessage = t('create.error.apiKey');
      } else if (msg.includes('attempts')) {
        errorMessage = t('create.error.timeout');
      } else {
        errorMessage = t('create.error.tryAgain');
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
              onClick={() => navigate('dashboard')}
              icon={<ArrowLeft />}
              disabled={isLoading}
            >
              {t('common.back')}
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white">{t('create.title')}</h1>
              <p className="text-white/70 mt-2">{t('create.subtitle')}</p>
            </div>
            {/* Plan usage indicator */}
            {quizUsage && (
              <Card className="px-4 py-2 bg-qb-darker border-white/20">
                <p className="text-sm text-white/70">{t('create.quizzesThisMonth', 'Quizzes this month')}</p>
                <p className="text-2xl font-bold text-white">
                  {quizUsage.used} / {quizUsage.limit}
                </p>
                {quizUsage.used >= quizUsage.limit && (
                  <p className="text-xs text-red-400 mt-1">{t('create.limitReached', 'Limit reached!')}</p>
                )}
              </Card>
            )}
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <Card className="mb-6 p-8 text-center bg-gradient-to-br from-qb-purple to-qb-cyan">
              <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {generationStep || t('create.generating')}
              </h2>

              {/* Chunk progress bar */}
              {generationProgress && generationProgress.total > 1 && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>{generationProgress.message}</span>
                    <span className="font-bold">{generationProgress.current}/{generationProgress.total}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-white rounded-full h-3 transition-all duration-700 ease-out"
                      style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-white/60 text-xs mt-2">
                    {Math.round((generationProgress.current / generationProgress.total) * 100)}%
                  </p>
                </div>
              )}

              <p className="text-white/80 mt-3">
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
              <p className="text-sm text-white/60 mb-3">{t('create.multiThemeHint', 'Select one or more themes')}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {THEMES.map((theme) => {
                  const isSelected = selectedThemes.includes(theme.category);
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => toggleTheme(theme.category)}
                      disabled={isLoading}
                      className={`p-6 rounded-xl border-2 transition-all relative ${
                        isSelected
                          ? 'bg-qb-cyan border-qb-cyan scale-105 shadow-lg shadow-qb-cyan/50'
                          : 'bg-qb-darker border-white/20 hover:border-qb-cyan hover:scale-105'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSelected && selectedThemes.length > 1 && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="text-5xl mb-3">{theme.emoji}</div>
                      <div className="text-white font-bold text-lg mb-1">{theme.label}</div>
                      <div className="text-xs text-white/60">{theme.description}</div>
                    </button>
                  );
                })}
              </div>
              {/* Custom themes — up to 5 tags */}
              {selectedThemes.includes('custom') && (
                <div className="mt-4 p-4 bg-qb-darker rounded-lg border border-qb-cyan/30">
                  <label className="block text-sm text-white/80 mb-2">{t('create.customThemeLabel', 'Add your custom themes (up to 5)')}</label>
                  {/* Tags display */}
                  {customThemes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {customThemes.map((theme, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-qb-cyan/20 border border-qb-cyan/40 rounded-full text-sm text-qb-cyan font-medium"
                        >
                          {theme}
                          <button
                            type="button"
                            onClick={() => setCustomThemes(prev => prev.filter((_, i) => i !== idx))}
                            className="hover:text-white transition-colors ml-0.5"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Input for new theme */}
                  {customThemes.length < 5 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customThemeInput}
                        onChange={(e) => setCustomThemeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customThemeInput.trim()) {
                            e.preventDefault();
                            const newTheme = customThemeInput.trim();
                            if (!customThemes.includes(newTheme)) {
                              setCustomThemes(prev => [...prev, newTheme]);
                            }
                            setCustomThemeInput('');
                          }
                        }}
                        placeholder={t('create.customThemePlaceholder', 'e.g. Harry Potter, 80s Music, FC Barcelona...')}
                        disabled={isLoading}
                        maxLength={100}
                        className="flex-1 px-4 py-3 bg-qb-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-qb-cyan focus:outline-none focus:ring-2 focus:ring-qb-cyan/30"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customThemeInput.trim()) {
                            const newTheme = customThemeInput.trim();
                            if (!customThemes.includes(newTheme)) {
                              setCustomThemes(prev => [...prev, newTheme]);
                            }
                            setCustomThemeInput('');
                          }
                        }}
                        disabled={!customThemeInput.trim() || isLoading}
                        className="px-4 py-3 bg-qb-cyan/20 border border-qb-cyan/40 rounded-lg text-qb-cyan font-bold hover:bg-qb-cyan/30 disabled:opacity-30 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-white/50 mt-2">
                    {customThemes.length < 5
                      ? t('create.customThemeHint', 'Type a theme and press Enter — {{remaining}} remaining', { remaining: 5 - customThemes.length })
                      : t('create.customThemeMax', 'Maximum 5 custom themes reached')}
                  </p>
                </div>
              )}

              {(selectedThemes.length > 1 || customThemes.length > 0) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-qb-cyan">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('create.multiThemeSelected', { count: selectedThemes.filter(t => t !== 'custom').length + customThemes.length, themes: [...selectedThemeObjects.filter(t => t.category !== 'custom').map(t => t.label), ...customThemes].join(' + ') })}</span>
                </div>
              )}

              {allSubThemes.length > 0 && (
                <div className="mt-4 p-4 bg-qb-darker rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-white/70">{t('create.quizWillInclude')}</div>
                    {excludedSubThemes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExcludedSubThemes([])}
                        className="text-xs text-qb-cyan hover:text-qb-cyan/80 underline"
                      >
                        {t('create.resetAll')}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedThemeObjects.map((themeObj) => (
                      themeObj.subThemes?.map((subTheme) => {
                        const isExcluded = excludedSubThemes.includes(subTheme);
                        return (
                          <button
                            key={`${themeObj.id}-${subTheme}`}
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
                            {selectedThemes.length > 1 && <span className="opacity-60">{themeObj.emoji}</span>}
                            {subTheme}
                            {!isExcluded && activeSubThemes.length > 1 && (
                              <X className="w-3 h-3 ml-1" />
                            )}
                          </button>
                        );
                      })
                    ))}
                  </div>
                  {excludedSubThemes.length > 0 && (
                    <div className="text-xs text-white/50 mt-2">
                      {t('create.subThemesActive', { count: activeSubThemes.length })}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              {/* Direct custom input — always visible, no preset buttons */}
              <div className="p-4 bg-qb-darker rounded-lg border border-qb-cyan/30">
                <label className="block text-sm text-white/80 mb-2">{t('create.customQuestionLabel', 'How many questions?')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={customQuestionCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomQuestionCount(val);
                      const num = parseInt(val, 10);
                      if (num >= 5 && num <= 100) {
                        setFormData({ ...formData, questionCount: num });
                      }
                    }}
                    placeholder="15"
                    disabled={isLoading}
                    className="w-28 px-4 py-3 bg-qb-dark border border-white/20 rounded-lg text-white text-center text-2xl font-bold focus:border-qb-cyan focus:outline-none focus:ring-2 focus:ring-qb-cyan/30"
                  />
                  <div className="text-white/60 text-sm">
                    {customQuestionCount && parseInt(customQuestionCount, 10) >= 5 && parseInt(customQuestionCount, 10) <= 100 && (
                      <span className="text-qb-cyan font-bold">~{calculateQuizStructureFromCount(parseInt(customQuestionCount, 10)).estimatedDurationMinutes} min</span>
                    )}
                    {customQuestionCount && (parseInt(customQuestionCount, 10) < 5 || parseInt(customQuestionCount, 10) > 100) && (
                      <span className="text-red-400">{t('create.customRange', 'Between 5 and 100')}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-2">{t('create.customHint', 'Recommended: 10-20 questions for best experience. Larger quizzes may take longer to generate.')}</p>
              </div>

              <div className="mt-4 p-4 bg-qb-darker rounded-lg">
                <div className="text-sm text-white/70 mb-2">{t('create.quizStructure')}</div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
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
                          onClick={() => {
                            const currentMessages = commercialBreaks.promoMessages || [];
                            const newMessages = Array.from({ length: n }, (_, i) => currentMessages[i] || '');
                            setCommercialBreaks({ ...commercialBreaks, numberOfPauses: n, promoMessages: newMessages });
                          }}
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

                  {/* Promo messages — one per pause */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {t('create.promoMessages')}
                    </label>
                    <p className="text-xs text-white/50 mb-3">{t('create.promoMessagesHint')}</p>
                    <div className="space-y-3">
                      {Array.from({ length: commercialBreaks.numberOfPauses }, (_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-qb-yellow/20 border border-qb-yellow/40 flex items-center justify-center">
                            <span className="text-qb-yellow font-bold text-sm">{i + 1}</span>
                          </div>
                          <input
                            type="text"
                            value={(commercialBreaks.promoMessages || [])[i] || ''}
                            onChange={(e) => {
                              const newMessages = [...(commercialBreaks.promoMessages || Array(commercialBreaks.numberOfPauses).fill(''))];
                              newMessages[i] = e.target.value;
                              setCommercialBreaks({ ...commercialBreaks, promoMessages: newMessages });
                            }}
                            placeholder={t('create.promoMessagePlaceholderN', { n: i + 1 })}
                            disabled={isLoading}
                            maxLength={200}
                            className="flex-1 px-4 py-3 bg-qb-darker border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:border-qb-yellow focus:outline-none text-lg"
                          />
                        </div>
                      ))}
                    </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              {formData.includeJokers && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { key: 'protection' as const, icon: <Shield className="w-4 h-4" />, label: t('create.jokerProtection'), color: 'bg-blue-500' },
                    { key: 'block' as const, icon: <Ban className="w-4 h-4" />, label: t('create.jokerBlock'), color: 'bg-red-500' },
                    { key: 'steal' as const, icon: <Repeat className="w-4 h-4" />, label: t('create.jokerSteal'), color: 'bg-orange-500' },
                    { key: 'double_points' as const, icon: <Gem className="w-4 h-4" />, label: t('create.jokerDoublePoints'), color: 'bg-yellow-500' },
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
                        {enabledJokers[joker.key] ? t('common.on') : t('common.off')}
                      </span>
                    </button>
                  ))}

                  {/* Joker uses per player */}
                  <div className="col-span-2 mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm font-bold text-white/80 mb-2">{t('create.jokerUsesPerPlayer')}</p>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 5].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setJokerUses({
                            protection: count,
                            block: count,
                            steal: count,
                            double_points: count,
                          })}
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            jokerUses.protection === count
                              ? 'bg-qb-magenta text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {count}x
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/50 mt-1">{t('create.jokerUsesHint')}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Team Mode */}
            <Card gradient className="p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamMode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamMode(e.target.checked)}
                  disabled={isLoading}
                  className="w-6 h-6 rounded accent-qb-cyan"
                />
                <div className="flex-1">
                  <div className="text-white font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-qb-cyan" />
                    {t('create.teamMode')}
                  </div>
                  <p className="text-sm text-white/70 mt-1">
                    {t('create.teamModeDesc')}
                  </p>
                </div>
              </label>

              {teamMode && (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm text-white/80 mb-2">{t('create.teamNames')}</label>
                  {teamNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const updated = [...teamNames];
                          updated[idx] = e.target.value;
                          setTeamNames(updated);
                        }}
                        placeholder={t('create.teamNamePlaceholder')}
                        disabled={isLoading}
                        maxLength={30}
                        className="flex-1 px-4 py-2 bg-qb-darker border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:border-qb-cyan focus:outline-none"
                      />
                      {teamNames.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setTeamNames(teamNames.filter((_, i) => i !== idx))}
                          disabled={isLoading}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {teamNames.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setTeamNames([...teamNames, `Table ${teamNames.length + 1}`])}
                      disabled={isLoading}
                      className="flex items-center gap-2 text-sm text-qb-cyan hover:text-qb-cyan/80 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('create.addTeam')}
                    </button>
                  )}
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
                <span className="text-3xl">{selectedThemeObjects.map(t => t.emoji).join(' ')}</span>
                <div>
                  <div className="font-bold text-white">{selectedThemeObjects.map(t => t.label).join(' + ')}</div>
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
              {teamMode && (
                <p><strong>{t('create.teamMode')}:</strong> {teamNames.filter(n => n.trim()).join(', ')}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
