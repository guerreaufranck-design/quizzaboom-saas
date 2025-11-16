import React from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Sparkles, Users, Zap, Trophy, Shield, Target } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setCurrentView } = useQuizStore();

  return (
    <div className="min-h-screen bg-qb-dark">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <div className="inline-block">
              <img
                src="/images/logo.png"
                alt="QuizzaBoom"
                className="h-40 w-auto mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold">
                <span className="gradient-primary bg-clip-text text-transparent">
                  QuizzaBoom
                </span>
              </h1>
              <p className="text-2xl lg:text-3xl text-white/90 font-medium">
                Turn Any Gathering Into An Epic Quiz Battle!
              </p>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                AI-powered quiz generation, real-time multiplayer up to 250 players, 
                and strategic gameplay with jokers. Perfect for bars, restaurants, events, and parties!
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                size="xl"
                gradient
                onClick={() => setCurrentView('create')}
                className="text-xl"
              >
                🚀 Start the Fun NOW!
              </Button>
              <Button
                size="xl"
                variant="ghost"
                onClick={() => setCurrentView('join')}
                className="text-xl"
              >
                🎮 Join a Quiz Battle
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card gradient hover className="text-center">
              <Sparkles className="w-16 h-16 text-qb-magenta mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">AI-Powered</h3>
              <p className="text-white/80">
                Generate custom quizzes on any topic instantly with Gemini 2.5 Flash
              </p>
            </Card>

            <Card gradient hover className="text-center">
              <Users className="w-16 h-16 text-qb-cyan mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Unlimited Players</h3>
              <p className="text-white/80">
                Up to 250 players in perfect real-time sync with QR code entry
              </p>
            </Card>

            <Card gradient hover className="text-center">
              <Zap className="w-16 h-16 text-qb-yellow mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Strategic Mode</h3>
              <p className="text-white/80">
                4 jokers, 4 phases, epic battles with point redistribution!
              </p>
            </Card>
          </div>

          {/* How It Works */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center text-white">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-qb-magenta flex items-center justify-center text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-white">Create Your Quiz</h3>
                <p className="text-white/70">
                  Tell us your topic and duration, AI generates the perfect quiz
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-qb-cyan flex items-center justify-center text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-white">Share QR Code</h3>
                <p className="text-white/70">
                  Players scan and join instantly, no app download needed
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-qb-purple flex items-center justify-center text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-white">Battle & Win</h3>
                <p className="text-white/70">
                  Use strategic jokers, compete in real-time, crown the champion!
                </p>
              </div>
            </div>
          </div>

          {/* Strategic Features */}
          <div className="bg-gradient-to-br from-qb-purple/20 via-qb-magenta/20 to-qb-cyan/20 rounded-3xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Strategic Gameplay Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-5xl">🛡️</div>
                <h4 className="text-lg font-bold text-white">Protection</h4>
                <p className="text-sm text-white/70">Immunity from all attacks</p>
                <p className="text-xs text-qb-cyan">2 uses</p>
              </div>

              <div className="text-center space-y-2">
                <div className="text-5xl">🚫</div>
                <h4 className="text-lg font-bold text-white">Block</h4>
                <p className="text-sm text-white/70">Prevent opponent from answering</p>
                <p className="text-xs text-qb-cyan">10 uses</p>
              </div>

              <div className="text-center space-y-2">
                <div className="text-5xl">💰</div>
                <h4 className="text-lg font-bold text-white">Steal</h4>
                <p className="text-sm text-white/70">Take 100% of opponent's points</p>
                <p className="text-xs text-qb-cyan">10 uses</p>
              </div>

              <div className="text-center space-y-2">
                <div className="text-5xl">⭐</div>
                <h4 className="text-lg font-bold text-white">Double Points</h4>
                <p className="text-sm text-white/70">Multiply your score by 2</p>
                <p className="text-xs text-qb-cyan">5 uses</p>
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="text-center p-8 bg-gradient-to-r from-qb-orange/20 via-qb-magenta/20 to-qb-purple/20 rounded-2xl border border-white/10">
            <p className="text-3xl font-bold text-white">
              🔥 Over 50,000 epic quiz battles created! 🔥
            </p>
          </div>

          {/* B2B Pricing Preview */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center text-white">
              Perfect for Businesses
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card gradient className="text-center space-y-6 p-8">
                <h3 className="text-2xl font-bold text-white">Starter</h3>
                <div className="text-5xl font-bold text-qb-cyan">$69</div>
                <p className="text-white/70">per month</p>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> 5 quizzes/month
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> Up to 250 players
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> 30-day free trial
                  </li>
                </ul>
                <Button fullWidth variant="secondary">Start Trial</Button>
              </Card>

              <Card gradient className="text-center space-y-6 p-8 border-2 border-qb-magenta">
                <div className="absolute top-4 right-4 bg-qb-magenta text-white text-xs px-3 py-1 rounded-full font-bold">
                  POPULAR
                </div>
                <h3 className="text-2xl font-bold text-white">Pro</h3>
                <div className="text-5xl font-bold text-qb-magenta">$99</div>
                <p className="text-white/70">per month</p>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> Unlimited quizzes
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> 2 team seats
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> White label
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> Up to 250 players
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> 30-day free trial
                  </li>
                </ul>
                <Button fullWidth gradient>Start Trial</Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
