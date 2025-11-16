import React, { useState } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ArrowLeft, Sparkles, Clock, Target, Globe, Zap } from 'lucide-react';
import { calculateQuizStructure } from '../services/gemini';

export const CreateQuiz: React.FC = () => {
  const { generateQuiz, createSession, setCurrentView, isLoading } = useQuizStore();
  
  const [formData, setFormData] = useState({
    theme: '',
    duration: 30,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    language: 'english',
    includeJokers: true,
  });

  const quizStructure = calculateQuizStructure(formData.duration);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.theme.trim()) {
      alert('Please enter a quiz theme');
      return;
    }

    try {
      console.log('🎨 Generating quiz with AI...');
      const quiz = await generateQuiz(formData);
      
      console.log('📝 Creating session...');
      await createSession(quiz.id);
      
      console.log('✅ Redirecting to lobby...');
      setCurrentView('lobby');
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('home')}
              icon={<ArrowLeft />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white">Create Your Quiz</h1>
              <p className="text-white/70 mt-2">AI-powered quiz generation in seconds</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Theme */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-qb-magenta" />
                Quiz Theme *
              </label>
              <Input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="e.g., 'World History', 'Pop Culture 2000s', 'Science & Nature'"
                required
                disabled={isLoading}
              />
              <p className="text-sm text-white/60 mt-2">
                💡 Tip: Be specific! "80s Rock Music" works better than just "Music"
              </p>
            </Card>

            {/* Duration */}
            <Card gradient className="p-6">
              <label className="block text-white font-bold mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-qb-cyan" />
                Quiz Duration
              </label>
              <Select
                value={formData.duration.toString()}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                disabled={isLoading}
              >
                <option value="15">15 minutes (~10 questions)</option>
                <option value="30">30 minutes (~20 questions)</option>
                <option value="45">45 minutes (~30 questions)</option>
                <option value="60">60 minutes (~40 questions)</option>
                <option value="90">90 minutes (~60 questions)</option>
              </Select>
              
              {/* Quiz Structure Preview */}
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
                <div className="text-xs text-white/50 mt-3 text-center">
                  ⏱️ Each question takes ~1.5 minutes (theme, question, answers, results, break)
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
                  { value: 'easy', label: 'Easy', emoji: '😊', desc: 'Everyone can play' },
                  { value: 'medium', label: 'Medium', emoji: '🤔', desc: 'Balanced challenge' },
                  { value: 'hard', label: 'Hard', emoji: '🔥', desc: 'For experts' },
                ].map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: level.value as any })}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.difficulty === level.value
                        ? 'bg-qb-cyan border-qb-cyan scale-105'
                        : 'bg-qb-darker border-white/20 hover:border-qb-cyan'
                    }`}
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
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                disabled={isLoading}
              >
                <option value="english">English</option>
                <option value="french">Français</option>
                <option value="spanish">Español</option>
                <option value="german">Deutsch</option>
                <option value="italian">Italiano</option>
              </Select>
            </Card>

            {/* Strategic Mode */}
            <Card gradient className="p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeJokers}
                  onChange={(e) => setFormData({ ...formData, includeJokers: e.target.checked })}
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
            <div className="flex gap-4">
              <Button
                type="submit"
                size="xl"
                fullWidth
                gradient
                disabled={isLoading}
                icon={<Sparkles />}
              >
                {isLoading ? 'Generating Quiz with AI...' : `Generate ${quizStructure.totalQuestions} Questions`}
              </Button>
            </div>
          </form>

          {/* Info Card */}
          <Card className="mt-8 p-6 bg-gradient-to-br from-qb-purple/20 to-qb-cyan/20 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-3">🎯 How it works:</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>✨ <strong>AI generates</strong> {quizStructure.totalQuestions} unique, high-quality questions</li>
              <li>📊 <strong>Organized in</strong> {quizStructure.totalStages} themed stages ({quizStructure.questionsPerStage} questions each)</li>
              <li>⏱️ <strong>5 phases per question:</strong> Theme (25s) → Question (15s) → Answers (20s) → Results (20s) → Break (6s)</li>
              <li>🎮 <strong>Strategic gameplay</strong> with jokers for competitive fun</li>
              <li>📱 <strong>Players join</strong> via QR code or session code</li>
              <li>📺 <strong>TV display</strong> for big screen (Chromecast compatible)</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
