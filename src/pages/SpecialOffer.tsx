import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Check, ArrowLeft, Gift, Globe, Clock, Zap, Users, Shield, Loader2 } from 'lucide-react';

export const SpecialOffer: React.FC = () => {
  const routerNavigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCheckout = async (priceId: string, planName: string) => {
    if (!user) {
      routerNavigate('/auth?returnTo=/offer');
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
          cancelUrl: `${window.location.origin}/offer?payment=cancel`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('pricing.error.checkoutFailed'));
      }

      window.location.href = data.url;
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('common.errorUnknown');
      console.error('Checkout error:', msg);
      alert(t('pricing.error.paymentFailed', { message: msg }));
      setLoading(null);
    }
  };

  const handleRedeemPromo = async () => {
    if (!user) {
      routerNavigate('/auth?returnTo=/offer');
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

  const plans = [
    {
      name: 'Solo',
      price: 1.99,
      originalPrice: 3.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_SOLO,
      players: 5,
      icon: '🎮',
      popular: false,
      features: [
        t('offer.oneQuizSession'),
        t('offer.playersMax', { count: 5 }),
        t('offer.allGameModes'),
        t('offer.strategicJokers'),
        t('offer.realtimeLeaderboard'),
        t('offer.emailResults'),
        t('offer.multiSiteFeature'),
      ],
    },
    {
      name: 'Friends',
      price: 4.99,
      originalPrice: 9.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_FRIENDS,
      players: 20,
      icon: '🎉',
      popular: true,
      features: [
        t('offer.oneQuizSession'),
        t('offer.playersMax', { count: 20 }),
        t('offer.allGameModes'),
        t('offer.strategicJokers'),
        t('offer.realtimeLeaderboard'),
        t('offer.emailResults'),
        t('offer.multiSiteFeature'),
        t('offer.perfectForParties'),
      ],
    },
    {
      name: 'Party',
      price: 9.99,
      originalPrice: 19.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_PARTY,
      players: 50,
      icon: '🔥',
      popular: false,
      features: [
        t('offer.oneQuizSession'),
        t('offer.playersMax', { count: 50 }),
        t('offer.allGameModes'),
        t('offer.strategicJokers'),
        t('offer.realtimeLeaderboard'),
        t('offer.emailResults'),
        t('offer.multiSiteFeature'),
        t('offer.aiGenerated'),
      ],
    },
    {
      name: 'Pro Event',
      price: 19.99,
      originalPrice: 39.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_EVENT,
      players: 150,
      icon: '👑',
      popular: false,
      features: [
        t('offer.oneQuizSession'),
        t('offer.playersMax', { count: 150 }),
        t('offer.allGameModes'),
        t('offer.strategicJokers'),
        t('offer.realtimeLeaderboard'),
        t('offer.emailResults'),
        t('offer.multiSiteFeature'),
        t('offer.aiGenerated'),
        t('offer.maximumCapacity'),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-qb-dark py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back */}
          <Button
            variant="ghost"
            onClick={() => routerNavigate('/')}
            icon={<ArrowLeft />}
          >
            {t('common.backToHome')}
          </Button>

          {/* Hero Header */}
          <div className="text-center my-10">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-qb-magenta/30 to-qb-purple/30 border border-qb-magenta/50 rounded-full mb-6 animate-pulse">
              <Gift className="w-5 h-5 text-qb-magenta" />
              <span className="text-qb-magenta font-bold text-lg">{t('offer.badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {t('offer.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">
              {t('offer.subtitle')}
            </p>
          </div>

          {/* Urgency Banner */}
          <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-yellow-500/40 rounded-2xl p-5 mb-12 text-center animate-pulse">
            <p className="text-xl text-white font-bold flex items-center justify-center gap-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <span>{t('offer.urgency')}</span>
              <Zap className="w-6 h-6 text-yellow-400" />
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                gradient
                className={`p-8 relative ${
                  plan.popular
                    ? 'ring-4 ring-qb-cyan scale-105 shadow-2xl shadow-qb-cyan/50'
                    : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-qb-cyan to-qb-purple px-6 py-2 rounded-full">
                      <span className="text-sm font-bold text-white">{t('pricing.mostPopular')}</span>
                    </div>
                  </div>
                )}

                {/* Multi-site Badge */}
                <div className="flex justify-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 border border-purple-400/40 rounded-full">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-bold text-purple-400">{t('offer.multiSite')}</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{plan.icon}</div>
                  <h3 className="text-3xl font-bold text-white mb-3">{plan.name}</h3>

                  {/* Strikethrough original price */}
                  <div className="text-white/40 text-xl line-through decoration-red-400 decoration-2 mb-1">
                    ${plan.originalPrice}
                  </div>

                  {/* Current price */}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-green-400">${plan.price}</span>
                  </div>

                  {/* Savings badge */}
                  <div className="inline-block mt-3 px-4 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full">
                    <span className="text-green-400 font-bold text-sm">
                      {t('offer.save')} {Math.round((1 - plan.price / plan.originalPrice) * 100)}%
                    </span>
                  </div>

                  <p className="text-white/60 mt-3 text-sm">{t('pricing.oneTime')}</p>
                  <p className="text-qb-cyan font-bold text-lg mt-1">
                    <Users className="w-4 h-4 inline mr-1" />
                    {t('offer.playersMax', { count: plan.players })}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-white/90 text-sm">
                      <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  fullWidth
                  size="lg"
                  gradient={plan.popular}
                  variant={plan.popular ? 'primary' : 'secondary'}
                  onClick={() => handleCheckout(plan.priceId, plan.name)}
                  loading={loading === plan.priceId}
                  disabled={!!loading}
                  className="text-lg"
                >
                  {loading === plan.priceId ? t('pricing.processing') : t('offer.grabDeal')}
                </Button>
              </Card>
            ))}
          </div>

          {/* Promo Code Section */}
          <Card gradient className="p-6 mb-12 max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-white mb-3 text-center flex items-center justify-center gap-2">
              <Gift className="w-5 h-5 text-qb-yellow" />
              {t('offer.promoSection')}
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

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-white/60">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">{t('offer.trustBadge1')}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Zap className="w-5 h-5 text-qb-cyan" />
              <span className="text-sm font-medium">{t('offer.trustBadge2')}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Globe className="w-5 h-5 text-qb-purple" />
              <span className="text-sm font-medium">{t('offer.trustBadge3')}</span>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-center pb-8">
            <p className="text-white/50 text-lg">{t('offer.noSubscription')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
