import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  ArrowLeft, ArrowRight, Tv, Smartphone, Bot, Globe, Timer, BarChart3,
  Trophy, MessageSquare, Building2, Users, TrendingUp, Sparkles,
  DollarSign, CheckCircle, X, Zap, Crown, Shield,
} from 'lucide-react';

export const Guide: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: <Bot className="w-7 h-7" />, color: 'text-qb-cyan', titleKey: 'guide.features.ai.title', descKey: 'guide.features.ai.desc' },
    { icon: <Tv className="w-7 h-7" />, color: 'text-qb-purple', titleKey: 'guide.features.tv.title', descKey: 'guide.features.tv.desc' },
    { icon: <Smartphone className="w-7 h-7" />, color: 'text-qb-magenta', titleKey: 'guide.features.mobile.title', descKey: 'guide.features.mobile.desc' },
    { icon: <Globe className="w-7 h-7" />, color: 'text-qb-orange', titleKey: 'guide.features.multiSite.title', descKey: 'guide.features.multiSite.desc' },
    { icon: <Timer className="w-7 h-7" />, color: 'text-green-400', titleKey: 'guide.features.auto.title', descKey: 'guide.features.auto.desc' },
    { icon: <BarChart3 className="w-7 h-7" />, color: 'text-qb-cyan', titleKey: 'guide.features.analytics.title', descKey: 'guide.features.analytics.desc' },
    { icon: <Trophy className="w-7 h-7" />, color: 'text-qb-yellow', titleKey: 'guide.features.strategic.title', descKey: 'guide.features.strategic.desc' },
    { icon: <MessageSquare className="w-7 h-7" />, color: 'text-qb-purple', titleKey: 'guide.features.breaks.title', descKey: 'guide.features.breaks.desc' },
  ];

  const steps = [
    { icon: <Building2 className="w-8 h-8" />, color: 'from-qb-cyan to-qb-purple', titleKey: 'guide.howItWorks.step1Title', descKey: 'guide.howItWorks.step1Desc' },
    { icon: <Bot className="w-8 h-8" />, color: 'from-qb-purple to-qb-magenta', titleKey: 'guide.howItWorks.step2Title', descKey: 'guide.howItWorks.step2Desc' },
    { icon: <Smartphone className="w-8 h-8" />, color: 'from-qb-magenta to-qb-orange', titleKey: 'guide.howItWorks.step3Title', descKey: 'guide.howItWorks.step3Desc' },
    { icon: <Timer className="w-8 h-8" />, color: 'from-qb-orange to-qb-yellow', titleKey: 'guide.howItWorks.step4Title', descKey: 'guide.howItWorks.step4Desc' },
  ];

  const starterFeatures = [
    t('guide.pricing.starterFeature1'),
    t('guide.pricing.starterFeature2'),
    t('guide.pricing.starterFeature3'),
    t('guide.pricing.starterFeature4'),
    t('guide.pricing.starterFeature5'),
  ];

  const proFeatures = [
    t('guide.pricing.proFeature1'),
    t('guide.pricing.proFeature2'),
    t('guide.pricing.proFeature3'),
    t('guide.pricing.proFeature4'),
    t('guide.pricing.proFeature5'),
    t('guide.pricing.proFeature6'),
  ];

  const quizRoomCons = [
    t('guide.roi.quizRoomCon1'),
    t('guide.roi.quizRoomCon2'),
    t('guide.roi.quizRoomCon3'),
    t('guide.roi.quizRoomCon4'),
  ];

  const qbPros = [
    t('guide.roi.qbPro1'),
    t('guide.roi.qbPro2'),
    t('guide.roi.qbPro3'),
    t('guide.roi.qbPro4'),
  ];

  return (
    <div className="min-h-screen bg-qb-dark">
      {/* ============ SECTION 1: HERO ============ */}
      <section className="min-h-[60vh] flex items-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Back */}
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft />}
            >
              {t('guide.back')}
            </Button>

            <div className="text-center mt-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500/20 to-qb-cyan/20 border border-green-500/40 rounded-full mb-8 animate-pulse">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold text-lg">{t('guide.hero.badge')}</span>
              </div>

              {/* H1 */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-primary bg-clip-text text-transparent mb-6 leading-tight">
                {t('guide.hero.title')}
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10">
                {t('guide.hero.subtitle')}
              </p>

              {/* CTAs */}
              <div className="flex gap-4 justify-center flex-wrap mb-10">
                <Button
                  gradient
                  size="xl"
                  onClick={() => navigate('/pro-signup')}
                  icon={<Zap />}
                  className="text-xl px-10"
                >
                  {t('guide.hero.ctaPrimary')}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate('/pricing')}
                  icon={<ArrowRight />}
                >
                  {t('guide.hero.ctaSecondary')}
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-8">
                <div className="flex items-center gap-2 text-white/60">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">{t('guide.hero.trustNoCard')}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Timer className="w-5 h-5 text-qb-cyan" />
                  <span className="text-sm font-medium">{t('guide.hero.trust30Days')}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-5 h-5 text-qb-purple" />
                  <span className="text-sm font-medium">{t('guide.hero.trust250Players')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 2: ROI ============ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('guide.roi.title')}</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">{t('guide.roi.subtitle')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-14">
              {[
                { icon: <TrendingUp className="w-10 h-10 text-green-400" />, value: t('guide.roi.stat1Value'), label: t('guide.roi.stat1Label'), color: 'border-green-500/30' },
                { icon: <Users className="w-10 h-10 text-qb-cyan" />, value: t('guide.roi.stat2Value'), label: t('guide.roi.stat2Label'), color: 'border-qb-cyan/30' },
                { icon: <DollarSign className="w-10 h-10 text-qb-yellow" />, value: t('guide.roi.stat3Value'), label: t('guide.roi.stat3Label'), color: 'border-qb-yellow/30' },
              ].map((stat, idx) => (
                <Card key={idx} gradient className={`p-8 text-center border-2 ${stat.color}`}>
                  <div className="flex justify-center mb-4">{stat.icon}</div>
                  <div className="text-5xl font-bold text-white mb-3">{stat.value}</div>
                  <p className="text-white/60 text-lg">{stat.label}</p>
                </Card>
              ))}
            </div>

            {/* Comparison */}
            <Card gradient className="p-8 md:p-12">
              <h3 className="text-2xl font-bold text-white text-center mb-10">{t('guide.roi.compareTitle')}</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Quiz Rooms - Cons */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-red-400 mb-5 text-center">Quiz Rooms</h4>
                  <ul className="space-y-3">
                    {quizRoomCons.map((con, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-white/70">
                        <X className="w-5 h-5 text-red-400 shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* QuizzaBoom - Pros */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                  <h4 className="text-xl font-bold text-green-400 mb-5 text-center">QuizzaBoom</h4>
                  <ul className="space-y-3">
                    {qbPros.map((pro, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-white/90">
                        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ============ SECTION 3: HOW IT WORKS ============ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('guide.howItWorks.title')}</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">{t('guide.howItWorks.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {steps.map((step, idx) => (
                <Card key={idx} gradient className="p-6 text-center relative overflow-hidden">
                  {/* Step number */}
                  <div className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white`}>
                    {step.icon}
                  </div>
                  <div className="absolute top-3 right-4 text-6xl font-bold text-white/5">{idx + 1}</div>
                  <h3 className="text-lg font-bold text-white mb-3">{t(step.titleKey)}</h3>
                  <p className="text-white/60 text-sm">{t(step.descKey)}</p>
                </Card>
              ))}
            </div>

            {/* Auto message callout */}
            <div className="bg-gradient-to-r from-green-500/15 to-qb-cyan/15 border border-green-500/30 rounded-2xl p-5 text-center">
              <p className="text-lg font-bold text-green-400 flex items-center justify-center gap-3">
                <Zap className="w-5 h-5" />
                <span>{t('guide.howItWorks.autoMessage')}</span>
                <Zap className="w-5 h-5" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 4: FEATURES ============ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('guide.features.title')}</h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">{t('guide.features.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <Card key={idx} gradient className="p-6">
                  <div className={`w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-white/60 text-sm">{t(feature.descKey)}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 5: PRICING PREVIEW ============ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('guide.pricing.title')}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Starter Plan */}
              <Card gradient className="p-8 relative ring-4 ring-green-500/50 shadow-2xl shadow-green-500/20">
                {/* Free trial badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-500 to-green-400 px-6 py-2 rounded-full animate-pulse">
                    <span className="text-sm font-bold text-white">{t('guide.pricing.freeTrial')}</span>
                  </div>
                </div>

                <div className="text-center mb-6 pt-4">
                  <Building2 className="w-12 h-12 text-qb-purple mx-auto mb-3" />
                  <h3 className="text-3xl font-bold text-white mb-2">Starter</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">$69</span>
                    <span className="text-white/70">{t('guide.pricing.perMonth')}</span>
                  </div>
                  <p className="text-green-400 font-bold text-lg mt-2">{t('guide.pricing.starterTrial')}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {starterFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/90">
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  fullWidth
                  size="xl"
                  gradient
                  onClick={() => navigate('/pro-signup')}
                  icon={<Zap />}
                  className="text-lg"
                >
                  {t('guide.pricing.startTrial')}
                </Button>
              </Card>

              {/* Pro Plan */}
              <Card gradient className="p-8">
                <div className="text-center mb-6 pt-4">
                  <Crown className="w-12 h-12 text-qb-yellow mx-auto mb-3" />
                  <h3 className="text-3xl font-bold text-white mb-2">Pro</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">$99</span>
                    <span className="text-white/70">{t('guide.pricing.perMonth')}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {proFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white/90">
                      <CheckCircle className="w-5 h-5 text-qb-purple shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  fullWidth
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/pro-signup')}
                >
                  {t('guide.pricing.getPro')}
                </Button>
              </Card>
            </div>

            {/* Individual plans link */}
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/pricing')}
                className="text-qb-cyan hover:text-qb-cyan/80 font-medium text-lg underline underline-offset-4 transition-colors"
              >
                {t('guide.pricing.individualLink')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 6: FINAL CTA ============ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card gradient className="p-12 text-center">
              <Sparkles className="w-16 h-16 text-qb-cyan mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('guide.cta.title')}</h2>
              <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">{t('guide.cta.subtitle')}</p>
              <Button
                gradient
                size="xl"
                onClick={() => navigate('/pro-signup')}
                icon={<Zap />}
                className="text-xl px-10 mb-6"
              >
                {t('guide.cta.button')}
              </Button>
              <p className="text-white/50">
                {t('guide.cta.support')}{' '}
                <a href="mailto:support@quizzaboom.app" className="text-qb-cyan font-bold hover:underline">
                  support@quizzaboom.app
                </a>
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
