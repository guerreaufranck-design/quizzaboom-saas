import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LanguageSelector } from '../components/LanguageSelector';
import { Sparkles, Users, Zap, LogIn, User } from 'lucide-react';
import { AnimatedLogo } from '../components/AnimatedLogo';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const { user } = useAuthStore();

  const handleAuth = () => {
    if (user) {
      navigate('dashboard');
    } else {
      navigate('auth');
    }
  };

  return (
    <div className="min-h-screen bg-qb-dark">
      {/* Auth Header */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex justify-between items-center">
          <LanguageSelector />
          <Button
            variant="ghost"
            onClick={handleAuth}
            icon={user ? <User /> : <LogIn />}
          >
            {user ? t('common.dashboard') : t('common.signIn')}
          </Button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <AnimatedLogo size="lg" className="mx-auto" />

            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold">
                <span className="gradient-primary bg-clip-text text-transparent">
                  {t('home.title')}
                </span>
              </h1>
              <p className="text-2xl lg:text-3xl text-white/90 font-medium">
                {t('home.subtitle')}
              </p>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                {t('home.description')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                size="xl"
                gradient
                onClick={() => navigate('create')}
                className="text-xl"
              >
                {t('home.startNow')}
              </Button>
              <Button
                size="xl"
                variant="ghost"
                onClick={() => navigate('join')}
                className="text-xl"
              >
                {t('home.joinQuiz')}
              </Button>
            </div>

            <div className="text-center pt-4">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('pricing')}
                className="text-lg"
              >
                {t('home.viewPricing')}
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card gradient hover className="text-center">
              <Sparkles className="w-16 h-16 text-qb-magenta mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">{t('home.features.aiPowered')}</h3>
              <p className="text-white/80">{t('home.features.aiDesc')}</p>
            </Card>

            <Card gradient hover className="text-center">
              <Users className="w-16 h-16 text-qb-cyan mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">{t('home.features.unlimitedPlayers')}</h3>
              <p className="text-white/80">{t('home.features.playersDesc')}</p>
            </Card>

            <Card gradient hover className="text-center">
              <Zap className="w-16 h-16 text-qb-yellow mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">{t('home.features.strategicMode')}</h3>
              <p className="text-white/80">{t('home.features.strategicDesc')}</p>
            </Card>
          </div>

          {/* How It Works */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center text-white">
              {t('home.howItWorks')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-qb-magenta flex items-center justify-center text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-white">{t('home.step1Title')}</h3>
                <p className="text-white/70">{t('home.step1Desc')}</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-qb-cyan flex items-center justify-center text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-white">{t('home.step2Title')}</h3>
                <p className="text-white/70">{t('home.step2Desc')}</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-qb-purple flex items-center justify-center text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-white">{t('home.step3Title')}</h3>
                <p className="text-white/70">{t('home.step3Desc')}</p>
              </div>
            </div>
          </div>

          {/* Strategic Features */}
          <div className="bg-gradient-to-br from-qb-purple/20 via-qb-magenta/20 to-qb-cyan/20 rounded-3xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              {t('home.strategicFeatures')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-5xl">🛡️</div>
                <h4 className="text-lg font-bold text-white">{t('home.protection')}</h4>
                <p className="text-sm text-white/70">{t('home.protectionDesc')}</p>
                <p className="text-xs text-qb-cyan">2 uses</p>
              </div>

              <div className="text-center space-y-2">
                <div className="text-5xl">🚫</div>
                <h4 className="text-lg font-bold text-white">{t('home.block')}</h4>
                <p className="text-sm text-white/70">{t('home.blockDesc')}</p>
                <p className="text-xs text-qb-cyan">10 uses</p>
              </div>

              <div className="text-center space-y-2">
                <div className="text-5xl">💰</div>
                <h4 className="text-lg font-bold text-white">{t('home.steal')}</h4>
                <p className="text-sm text-white/70">{t('home.stealDesc')}</p>
                <p className="text-xs text-qb-cyan">10 uses</p>
              </div>

              <div className="text-center space-y-2">
                <div className="text-5xl">⭐</div>
                <h4 className="text-lg font-bold text-white">{t('home.doublePoints')}</h4>
                <p className="text-sm text-white/70">{t('home.doublePointsDesc')}</p>
                <p className="text-xs text-qb-cyan">5 uses</p>
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="text-center p-8 bg-gradient-to-r from-qb-orange/20 via-qb-magenta/20 to-qb-purple/20 rounded-2xl border border-white/10">
            <p className="text-3xl font-bold text-white">
              {t('home.statsBanner')}
            </p>
          </div>

          {/* B2B Pricing Preview */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center text-white">
              {t('home.perfectForBusiness')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card gradient className="text-center space-y-6 p-8">
                <h3 className="text-2xl font-bold text-white">Starter</h3>
                <div className="text-5xl font-bold text-qb-cyan">$69</div>
                <p className="text-white/70">{t('home.perMonth')}</p>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> {t('home.quizzesMonth', { count: 5 })}
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> {t('home.upTo250')}
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> {t('home.freeTrial')}
                  </li>
                </ul>
                <Button fullWidth variant="secondary" onClick={() => navigate('pro-signup')}>{t('home.startTrial')}</Button>
              </Card>

              <Card gradient className="text-center space-y-6 p-8 border-2 border-qb-magenta relative">
                <div className="absolute top-4 right-4 bg-qb-magenta text-white text-xs px-3 py-1 rounded-full font-bold">
                  POPULAR
                </div>
                <h3 className="text-2xl font-bold text-white">Pro</h3>
                <div className="text-5xl font-bold text-qb-magenta">$99</div>
                <p className="text-white/70">{t('home.perMonth')}</p>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> {t('home.unlimited')}
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> {t('home.teamSeats')}
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> {t('home.whiteLabel')}
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <span className="text-green-400">✓</span> {t('home.upTo250')}
                  </li>
                </ul>
                <Button fullWidth gradient onClick={() => navigate('pro-signup')}>{t('home.getStarted')}</Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
