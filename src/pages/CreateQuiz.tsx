import React, { useState } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Sparkles, Clock, Target, Globe } from 'lucide-react';
import type { QuizGenRequest } from '../types/quiz';

// Thèmes prédéfinis
const PRESET_THEMES = {
  traditional: [
    { id: 'history', name: 'History', emoji: '📚', description: 'World history from ancient to modern' },
    { id: 'geography', name: 'Geography', emoji: '🗺️', description: 'Countries, capitals, landmarks' },
    { id: 'science', name: 'Science', emoji: '🔬', description: 'Physics, chemistry, biology' },
    { id: 'literature', name: 'Literature', emoji: '📖', description: 'Classic and modern literature' },
    { id: 'sports', name: 'Sports', emoji: '⚽', description: 'All sports and athletes' },
    { id: 'cinema', name: 'Cinema', emoji: '🎬', description: 'Movies, actors, directors' },
    { id: 'music', name: 'Music', emoji: '🎵', description: 'Artists, songs, music history' },
    { id: 'art', name: 'Art', emoji: '🎨', description: 'Painting, sculpture, artists' },
  ],
  fun: [
    { id: 'popculture', name: 'Pop Culture', emoji: '🌟', description: 'Trends, memes, viral moments' },
    { id: '90s', name: '90s Nostalgia', emoji: '📼', description: 'Everything from the 90s' },
    { id: 'food', name: 'Food & Drinks', emoji: '🍕', description: 'Cuisine, recipes, restaurants' },
    { id: 'travel', name: 'Travel', emoji: '✈️', description: 'Destinations, cultures, adventures' },
    { id: 'animals', name: 'Animals', emoji: '🦁', description: 'Wildlife, pets, nature' },
    { id: 'tech', name: 'Technology', emoji: '💻', description: 'Gadgets, apps, innovation' },
    { id: 'gaming', name: 'Video Games', emoji: '🎮', description: 'Games, consoles, esports' },
    { id: 'mystery', name: 'Mystery & Crime', emoji: '🔍', description: 'Detectives, unsolved cases' },
  ],
  special: [
    { id: 'mix', name: 'Mix Everything', emoji: '🎲', description: 'Random questions from all categories' },
    { id: 'custom', name: 'Custom Theme', emoji: '✏️', description: 'Create your own topic' },
  ],
};

export const CreateQuiz: React.FC = () => {
  const { setCurrentView, generateQuiz, createSession, isLoading, error } = useQuizStore();

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState('');
  const [formData, setFormData] = useState<Omit<QuizGenRequest, 'theme'>>({
    duration: 30,
    difficulty: 'medium',
    language: 'en',
    includeJokers: true,
    categories: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final theme
    let finalTheme = '';
    if (selectedTheme === 'custom') {
      if (!customTheme.trim()) {
        alert('Please enter your custom theme');
        return;
      }
      finalTheme = customTheme;
    } else if (selectedTheme === 'mix') {
      finalTheme = 'Mix of various topics: history, geography, science, pop culture, sports, cinema, music, and general knowledge';
    } else {
      const allThemes = [...PRESET_THEMES.traditional, ...PRESET_THEMES.fun];
      const theme = allThemes.find(t => t.id === selectedTheme);
      finalTheme = theme ? `${theme.name}: ${theme.description}` : '';
    }

    if (!finalTheme) {
      alert('Please select a theme');
      return;
    }

    // REMOVED B2B LIMIT CHECK FOR DEV MODE
    // TODO: Re-enable when organizations are properly setup

    try {
      const quiz = await generateQuiz({ ...formData, theme: finalTheme });
      const sessionCode = await createSession(quiz.id);
      console.log('Quiz created with session code:', sessionCode);
      setCurrentView('lobby');
    } catch (err) {
      console.error('Failed to create quiz:', err);
    }
  };

  const estimatedQuestions = Math.floor(formData.duration / 2);
  const estimatedStages = Math.max(3, Math.floor(formData.duration / 15));

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('home')}
              icon={<ArrowLeft />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                Create Your Quiz
              </h1>
              <p className="text-white/70 mt-2">
                Choose a theme and let AI generate your perfect quiz
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Theme Selection */}
            <Card gradient className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-qb-magenta" />
                Choose Your Theme
              </h2>

              {/* Traditional Themes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">📚 Traditional</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRESET_THEMES.traditional.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedTheme === theme.id
                          ? 'bg-qb-cyan text-qb-darker ring-2 ring-qb-cyan scale-105'
                          : 'bg-qb-darker text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="text-3xl mb-2">{theme.emoji}</div>
                      <div className="font-bold">{theme.name}</div>
                      <div className={`text-xs mt-1 ${selectedTheme === theme.id ? 'text-qb-darker/70' : 'text-white/50'}`}>
                        {theme.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fun Themes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">🎉 Fun & Creative</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRESET_THEMES.fun.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedTheme === theme.id
                          ? 'bg-qb-magenta text-white ring-2 ring-qb-magenta scale-105'
                          : 'bg-qb-darker text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="text-3xl mb-2">{theme.emoji}</div>
                      <div className="font-bold">{theme.name}</div>
                      <div className={`text-xs mt-1 ${selectedTheme === theme.id ? 'text-white/70' : 'text-white/50'}`}>
                        {theme.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Options */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">⭐ Special</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PRESET_THEMES.special.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedTheme === theme.id
                          ? 'bg-gradient-to-r from-qb-purple to-qb-cyan text-white ring-2 ring-white scale-105'
                          : 'bg-qb-darker text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{theme.emoji}</div>
                        <div>
                          <div className="font-bold">{theme.name}</div>
                          <div className={`text-xs mt-1 ${selectedTheme === theme.id ? 'text-white/80' : 'text-white/50'}`}>
                            {theme.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Theme Input */}
              {selectedTheme === 'custom' && (
                <div className="mt-6 p-4 bg-qb-darker rounded-xl border-2 border-qb-purple">
                  <label className="block text-white font-medium mb-2">
                    Enter Your Custom Theme
                  </label>
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="e.g., 'Marvel Cinematic Universe', 'French Cuisine', 'Ancient Egypt'"
                    className="w-full px-4 py-3 rounded-lg bg-qb-dark text-white border border-white/20 focus:border-qb-purple focus:outline-none focus:ring-2 focus:ring-qb-purple/30"
                  />
                </div>
              )}
            </Card>

            {/* Quiz Settings */}
            <Card gradient className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-qb-cyan" />
                Quiz Settings
              </h2>

              {/* Duration */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-qb-cyan" />
                  Duration: {formData.duration} minutes
                </label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full h-3 bg-qb-darker rounded-lg appearance-none cursor-pointer accent-qb-cyan"
                />
                <div className="flex justify-between text-sm text-white/50 mt-2">
                  <span>15 min</span>
                  <span>30 min</span>
                  <span>60 min</span>
                  <span>120 min</span>
                </div>
                <div className="mt-4 p-4 bg-qb-darker/50 rounded-lg border border-white/10">
                  <p className="text-sm text-white/70">
                    Estimated: <span className="text-qb-cyan font-bold">{estimatedStages} stages</span> × <span className="text-qb-cyan font-bold">~{Math.floor(estimatedQuestions / estimatedStages)} questions</span> = <span className="text-qb-magenta font-bold">~{estimatedQuestions} total questions</span>
                  </p>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-qb-yellow" />
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: level })}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        formData.difficulty === level
                          ? 'bg-qb-yellow text-qb-darker'
                          : 'bg-qb-darker text-white hover:bg-white/10'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-qb-purple" />
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-lg bg-qb-darker text-white border border-white/20 focus:border-qb-purple focus:outline-none focus:ring-2 focus:ring-qb-purple/30"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              {/* Strategic Mode */}
              <div className="p-4 bg-gradient-to-r from-qb-purple/20 to-qb-magenta/20 rounded-lg border border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includeJokers}
                    onChange={(e) => setFormData({ ...formData, includeJokers: e.target.checked })}
                    className="w-6 h-6 rounded accent-qb-magenta"
                  />
                  <div>
                    <span className="text-white font-medium">Enable Strategic Mode</span>
                    <p className="text-sm text-white/70">
                      Include joker phases with Protection, Block, Steal, and Double Points
                    </p>
                  </div>
                </label>
              </div>
            </Card>

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
              disabled={!selectedTheme || (selectedTheme === 'custom' && !customTheme.trim())}
            >
              {isLoading ? 'Generating Quiz...' : '✨ Generate Quiz with AI'}
            </Button>

            <p className="text-center text-sm text-white/50">
              This will take about 10-15 seconds
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
