import React, { useState } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { ArrowLeft, Sparkles, Clock, Target, Globe, Zap, Loader2 } from 'lucide-react';
import { calculateQuizStructure } from '../services/gemini';
import { THEMES, THEME_MODES, type ThemeCategory, type ThemeMode } from '../types/themes';
import type { QuizGenRequest } from '../types/quiz';

export const CreateQuiz: React.FC = () => {
  const { generateQuiz, createSession, setCurrentView, isLoading } = useQuizStore();
  
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
      setGenerationStep('🤖 Connecting to AI...');
      console.log('🎨 Starting quiz generation...');
      
      const request: QuizGenRequest = {
        theme: `${currentTheme?.label} - ${THEME_MODES[selectedMode].label}`,
        duration: formData.duration,
        difficulty: formData.difficulty,
        language: formData.language,
        includeJokers: formData.includeJokers,
      };

      setGenerationStep(`🎨 Generating ${quizStructure.totalQuestions} questions...`);
      const quiz = await generateQuiz(request);
      
      setGenerationStep('📝 Creating session...');
      await createSession(quiz.id);
      
      setGenerationStep('✅ Ready!');
      setTimeout(() => {
        setCurrentView('lobby');
      }, 500);
      
    } catch (error: any) {
      console.error('Failed to create quiz:', error);
      setGenerationStep('');
      
      let errorMessage = 'Failed to generate quiz. ';
      
      if (error.message.includes('API key')) {
        errorMessage += 'API key not configured properly.';
      } else if (error.message.includes('attempts')) {
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
              onClick={() => setCurrentView('home')}
              icon={<ArrowLeft />}
              disabled={isLoading}
            >
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white">Create Your Quiz</h1>
              <p className="text-white/70 mt-2">AI-powered quiz generation in seconds</p>
            </div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <Card className="mb-6 p-8 text-center bg-gradient-to-br from-qb-purple to-qb-cyan">
              <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {generationStep || 'Generating Quiz...'}
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
                Choose Quiz Theme *
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
                🎭 Quiz Mode
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
                Quiz Duration
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
                <div className="text-sm text-white/70 mb-2">Generated Quiz Structure:</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-qb-cyan">{quizStructure.totalQuestions}</div>
                    <div className="text-xs text-white/60">Questions</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-qb-purple">{quizStructure.totalStages}</div>
                    <div className="text-xs text-white/60">Stages</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-qb-magenta">{quizStructure.questionsPerStage}</div>
                    <div className="text-xs text-white/60">Per Stage</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Difficulty */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-qb-yellow" />
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'easy' as const, label: 'Easy', emoji: '😊', desc: 'Everyone can play' },
                  { value: 'medium' as const, label: 'Medium', emoji: '🤔', desc: 'Balanced challenge' },
                  { value: 'hard' as const, label: 'Hard', emoji: '🔥', desc: 'For experts' },
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
                Language
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
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
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
                    Strategic Mode (Jokers)
                  </div>
                  <p className="text-sm text-white/70 mt-1">
                    Players get 1 joker of each type: Protection 🛡️, Block 🚫, Steal 💰, Double Points ⭐
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
              {isLoading ? generationStep || 'Generating...' : `Generate ${quizStructure.totalQuestions} Questions`}
            </Button>
          </form>

          {/* Preview */}
          <Card className="mt-8 p-6 bg-gradient-to-br from-qb-purple/20 to-qb-cyan/20 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-3">🎯 Your Quiz:</h3>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{currentTheme?.emoji}</span>
                <div>
                  <div className="font-bold text-white">{currentTheme?.label}</div>
                  <div className="text-white/60">{THEME_MODES[selectedMode].label}</div>
                </div>
              </div>
              <div className="border-t border-white/10 my-3" />
              <p>✨ <strong>AI generates</strong> {quizStructure.totalQuestions} unique questions</p>
              <p>📊 <strong>Organized in</strong> {quizStructure.totalStages} themed stages</p>
              <p>⏱️ <strong>5 phases per question:</strong> Theme (25s) → Question (15s) → Answers (20s) → Results (20s) → Break (6s)</p>
              <p>🎮 <strong>Strategic gameplay</strong> {formData.includeJokers ? 'enabled' : 'disabled'}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
