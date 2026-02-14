import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';
import { useOrganizationStore } from '../stores/useOrganizationStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Check, AlertCircle, Building2, Users, Crown, Shield, ArrowLeft, Gift, Loader2, Briefcase } from 'lucide-react';

export const Pricing: React.FC = () => {
  const routerNavigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { currentOrganization, fetchOrganization } = useOrganizationStore();
  const [showB2B, setShowB2B] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch organization to check if user is a verified business
  useEffect(() => {
    if (user) {
      fetchOrganization(user.id);
    }
  }, [user, fetchOrganization]);

  const handleCheckout = async (priceId: string, planName: string) => {
    // Require auth before checkout
    if (!user) {
      routerNavigate('/auth?returnTo=/pricing');
      return;
    }

    setLoading(priceId);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          planName,
          userId: user.id,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?payment=cancel`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('pricing.error.checkoutFailed'));
      }

      const { url } = data;

      // Redirection directe vers Stripe
      window.location.href = url;
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('pricing.error.unknown');
      console.error('Checkout error:', msg);
      alert(t('pricing.error.paymentFailed', { message: msg }));
      setLoading(null);
    }
  };

  const handleRedeemPromo = async () => {
    if (!user) {
      routerNavigate('/auth?returnTo=/pricing');
      return;
    }

    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setPromoLoading(true);
    setPromoResult(null);

    try {
      const response = await fetch('/api/redeem-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorKey = data.error;
        if (errorKey === 'invalid') {
          setPromoResult({ success: false, message: t('pricing.promoInvalid') });
        } else if (errorKey === 'expired' || errorKey === 'exhausted') {
          setPromoResult({ success: false, message: t('pricing.promoExpired') });
        } else if (errorKey === 'already_redeemed') {
          setPromoResult({ success: false, message: t('pricing.promoAlreadyUsed') });
        } else {
          setPromoResult({ success: false, message: t('pricing.promoInvalid') });
        }
        return;
      }

      setPromoResult({ success: true, message: t('pricing.promoSuccess') });
      setPromoCode('');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        routerNavigate('/dashboard?payment=success');
      }, 2000);

    } catch (error) {
      console.error('Promo redeem error:', error);
      setPromoResult({ success: false, message: t('pricing.promoInvalid') });
    } finally {
      setPromoLoading(false);
    }
  };

  const b2cPlans = [
    {
      name: 'Solo',
      price: 1.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_SOLO,
      players: 5,
      icon: '🎮',
      popular: false,
      features: [
        t('pricing.oneQuizSession'),
        t('pricing.upTo5Players'),
        t('pricing.allGameModes'),
        t('pricing.strategicJokers'),
        t('pricing.realtimeLeaderboard'),
        t('pricing.emailResults'),
      ],
    },
    {
      name: 'Friends',
      price: 4.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_FRIENDS,
      players: 15,
      icon: '🎉',
      popular: true,
      features: [
        t('pricing.oneQuizSession'),
        t('pricing.upTo15Players'),
        t('pricing.allGameModes'),
        t('pricing.strategicJokers'),
        t('pricing.realtimeLeaderboard'),
        t('pricing.emailResults'),
        t('pricing.perfectForParties'),
      ],
    },
    {
      name: 'Party',
      price: 9.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_PARTY,
      players: 50,
      icon: '🔥',
      popular: false,
      features: [
        t('pricing.oneQuizSession'),
        t('pricing.upTo50Players'),
        t('pricing.allGameModes'),
        t('pricing.strategicJokers'),
        t('pricing.realtimeLeaderboard'),
        t('pricing.emailResults'),
        t('pricing.perfectForParties'),
      ],
    },
    {
      name: 'Pro Event',
      price: 19.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_EVENT,
      players: 100,
      icon: '👑',
      popular: false,
      features: [
        t('pricing.oneQuizSession'),
        t('pricing.upTo100Players'),
        t('pricing.allGameModes'),
        t('pricing.strategicJokers'),
        t('pricing.realtimeLeaderboard'),
        t('pricing.emailResults'),
        t('pricing.maximumCapacity'),
      ],
    },
  ];

  const b2bPlans = [
    {
      name: 'Starter',
      price: 69,
      priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER,
      icon: <Building2 className="w-8 h-8" />,
      trial: true,
      features: [
        t('pricing.b2b.quizPerMonth'),
        t('pricing.b2b.playersPerSession'),
        t('pricing.b2b.strategicIncluded'),
        t('pricing.b2b.emailAnalytics'),
        t('pricing.b2b.standardSupport'),
        t('pricing.b2b.freeTrialDays'),
      ],
      warnings: [
        t('pricing.b2b.warningRegistration'),
        t('pricing.b2b.warningAiVerification'),
        t('pricing.b2b.warningEligible'),
      ],
    },
    {
      name: 'Pro',
      price: 99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_PRO,
      icon: <Crown className="w-8 h-8" />,
      trial: false,
      features: [
        t('pricing.b2b.unlimitedQuiz'),
        t('pricing.b2b.playersPerSession'),
        t('pricing.b2b.teamSeats'),
        t('pricing.b2b.whiteLabel'),
        t('pricing.b2b.strategicIncluded'),
        t('pricing.b2b.prioritySupport'),
        t('pricing.b2b.advancedAnalytics'),
      ],
      warnings: [
        t('pricing.b2b.warningRegistration'),
        t('pricing.b2b.warningAiVerification'),
        t('pricing.b2b.warningNoTrial'),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => routerNavigate('/')}
              icon={<ArrowLeft />}
            >
              {t('common.backToHome')}
            </Button>
          </div>

          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
              {t('pricing.title')}
            </h1>
            <p className="text-2xl text-white/70">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="mb-20">
            <div className="flex items-center justify-center gap-6 mb-14 flex-wrap">
              <div className="inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-qb-cyan to-qb-purple rounded-full shadow-lg shadow-qb-purple/20">
                <Users className="w-6 h-6 text-white" />
                <span className="text-2xl font-bold text-white">{t('pricing.forEveryone')}</span>
              </div>
              <button
                onClick={() => {
                  setShowB2B(!showB2B);
                  if (!showB2B) {
                    setTimeout(() => {
                      document.getElementById('b2b-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-full transition-all"
              >
                <Building2 className="w-5 h-5 text-white/60" />
                <span className="text-lg font-semibold text-white/60">{t('pricing.businessPlans')}</span>
                <span className="text-white/40 text-sm">{showB2B ? '▼' : '▶'}</span>
              </button>
            </div>

            {/* Promo Code Section */}
            <Card gradient className="p-6 mb-8 max-w-lg mx-auto">
              <h3 className="text-xl font-bold text-white mb-3 text-center flex items-center justify-center gap-2">
                <Gift className="w-5 h-5 text-qb-yellow" />
                {t('pricing.havePromoCode')}
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoResult(null); }}
                  placeholder={t('pricing.promoPlaceholder')}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 uppercase tracking-wider focus:border-qb-yellow focus:outline-none"
                  maxLength={20}
                  disabled={promoLoading}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRedeemPromo(); }}
                />
                <Button
                  gradient
                  onClick={handleRedeemPromo}
                  disabled={!promoCode.trim() || promoLoading}
                  icon={promoLoading ? <Loader2 className="animate-spin" /> : undefined}
                >
                  {t('pricing.applyPromo')}
                </Button>
              </div>
              {promoResult && (
                <div className={`mt-3 p-3 rounded-lg text-center font-bold text-sm ${
                  promoResult.success ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}>
                  {promoResult.message}
                </div>
              )}
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {b2cPlans.map((plan) => (
                <Card
                  key={plan.name}
                  gradient
                  className={`p-8 relative ${
                    plan.popular ? 'ring-4 ring-qb-cyan scale-105 shadow-2xl shadow-qb-cyan/50' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-qb-cyan to-qb-purple px-6 py-2 rounded-full">
                        <span className="text-sm font-bold text-white">⭐ {t('pricing.mostPopular')}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{plan.icon}</div>
                    <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold text-qb-cyan">${plan.price}</span>
                    </div>
                    <p className="text-white/70 mt-2">{t('pricing.oneTime')}</p>
                    <p className="text-qb-cyan font-bold">{t('pricing.playersMax', { count: plan.players })}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-white/90">
                        <Check className="w-5 h-5 text-qb-cyan shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    fullWidth
                    size="lg"
                    gradient={plan.popular}
                    variant={plan.popular ? 'primary' : 'secondary'}
                    onClick={() => handleCheckout(plan.priceId, plan.name)}
                    loading={loading === plan.priceId}
                    disabled={!!loading}
                  >
                    {loading === plan.priceId ? t('pricing.processing') : t('pricing.buyNow')}
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          <div id="b2b-section" className="border-t border-white/10 pt-12">
            <div className="text-center mb-8">
              <button
                onClick={() => setShowB2B(!showB2B)}
                className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"
              >
                <Building2 className="w-6 h-6 text-white/70" />
                <span className="text-xl font-bold text-white/70">
                  {t('pricing.businessPlans')}
                </span>
                <span className="text-white/50">{showB2B ? '▼' : '▶'}</span>
              </button>
            </div>

            {showB2B && (
              <>
                <div className="mb-8 p-6 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-yellow-400 shrink-0" />
                    <div>
                      <h3 className="text-2xl font-bold text-yellow-300 mb-2">
                        ⚠️ {t('pricing.businessOnly')}
                      </h3>
                      <ul className="text-white/90 space-y-1 text-lg">
                        <li>• {t('pricing.businessReqs.registration')}</li>
                        <li>• {t('pricing.businessReqs.aiVerification')}</li>
                        <li>• {t('pricing.businessReqs.eligible')}</li>
                        <li>• {t('pricing.businessReqs.monthlyBilling')}</li>
                      </ul>
                      <p className="text-yellow-200 font-bold mt-3">
                        💡 {t('pricing.personalTip')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Pass — One-time B2B plan */}
                <Card className="mb-10 p-8 max-w-3xl mx-auto ring-4 ring-qb-cyan/50 bg-gradient-to-r from-qb-cyan/5 to-qb-purple/5 border-qb-cyan/30 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-qb-cyan to-qb-purple px-6 py-2 rounded-full">
                      <span className="text-sm font-bold text-white">{t('pricing.businessPass.badge')}</span>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <Briefcase className="w-10 h-10 text-qb-cyan" />
                        <h3 className="text-3xl font-bold text-white">Business Pass</h3>
                      </div>
                      <div className="flex items-baseline gap-1 justify-center md:justify-start mb-2">
                        <span className="text-5xl font-bold text-qb-cyan">$19.90</span>
                      </div>
                      <p className="text-white/70">{t('pricing.oneTime')}</p>
                      <p className="text-qb-cyan font-bold text-lg mt-1">{t('pricing.businessPass.players')}</p>
                      <p className="text-white/50 text-sm mt-2">{t('pricing.businessPass.desc')}</p>
                    </div>
                    <div>
                      <ul className="space-y-3 mb-6">
                        {[
                          t('pricing.oneQuizSession'),
                          t('pricing.businessPass.players'),
                          t('pricing.allGameModes'),
                          t('pricing.strategicJokers'),
                          t('pricing.realtimeLeaderboard'),
                          t('pricing.emailResults'),
                          t('pricing.businessPass.verified'),
                        ].map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-white/90">
                            <Check className="w-5 h-5 text-qb-cyan shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {currentOrganization ? (
                        <Button
                          fullWidth
                          size="lg"
                          gradient
                          onClick={() => handleCheckout(
                            import.meta.env.VITE_STRIPE_PRICE_BUSINESS_PASS,
                            'Business Pass'
                          )}
                          loading={loading === import.meta.env.VITE_STRIPE_PRICE_BUSINESS_PASS}
                          disabled={!!loading}
                        >
                          {loading === import.meta.env.VITE_STRIPE_PRICE_BUSINESS_PASS
                            ? t('pricing.processing')
                            : t('pricing.buyNow')}
                        </Button>
                      ) : (
                        <div>
                          <Button
                            fullWidth
                            size="lg"
                            gradient
                            onClick={() => routerNavigate('/pro-signup')}
                          >
                            {t('pricing.businessPass.verifyFirst')}
                          </Button>
                          <p className="text-white/50 text-xs mt-2 text-center">
                            {t('pricing.businessPass.verifyHint')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Subscription plans */}
                <h3 className="text-2xl font-bold text-white/70 text-center mb-8">{t('pricing.businessPass.orSubscription')}</h3>
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {b2bPlans.map((plan) => (
                    <Card key={plan.name} className="p-8 bg-white/5 border-white/10">
                      <div className="text-center mb-6">
                        <div className="text-qb-purple mb-4">{plan.icon}</div>
                        <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-bold text-white">${plan.price}</span>
                          <span className="text-white/70">/month</span>
                        </div>
                        {plan.trial && (
                          <p className="text-qb-cyan font-bold mt-2">{t('pricing.b2b.trialBadge')}</p>
                        )}
                        {!plan.trial && (
                          <p className="text-red-400 font-bold mt-2">{t('pricing.b2b.noTrialWarning')}</p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-white/90">
                            <Check className="w-5 h-5 text-qb-purple shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mb-6 p-4 bg-qb-cyan/10 border border-qb-cyan/30 rounded-lg">
                        <p className="text-sm font-bold text-qb-cyan mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {t('pricing.requirements')}
                        </p>
                        <ul className="text-xs text-white/70 space-y-1">
                          {plan.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        fullWidth
                        size="lg"
                        variant={plan.trial ? 'primary' : 'ghost'}
                        gradient={plan.trial}
                        onClick={() => routerNavigate('/pro-signup')}
                      >
                        {plan.trial ? t('pricing.startFreeTrial') : t('pricing.getStarted')}
                      </Button>
                    </Card>
                  ))}
                </div>

                <div className="text-center mt-8 p-4 bg-white/5 rounded-lg">
                  <p className="text-white/70">
                    {t('pricing.questions')} <a href="mailto:support@quizzaboom.app" className="text-qb-cyan font-bold">support@quizzaboom.app</a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
