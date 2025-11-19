import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Check, AlertCircle, Building2, Users, Crown, Shield } from 'lucide-react';

export const Pricing: React.FC = () => {
  const [showB2B, setShowB2B] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planName: string) => {
    setLoading(priceId);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId,
          planName,
          successUrl: `${window.location.origin}/auth?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?payment=cancel`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirection directe vers Stripe
      window.location.href = url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Payment failed. Please try again.');
      setLoading(null);
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
        '1 Quiz Session',
        'Up to 5 Players',
        'All Game Modes',
        'Strategic Jokers',
        'Real-time Leaderboard',
        'Email Results',
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
        '1 Quiz Session',
        'Up to 15 Players',
        'All Game Modes',
        'Strategic Jokers',
        'Real-time Leaderboard',
        'Email Results',
        'Perfect for parties!',
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
        '1 Quiz Session',
        'Up to 50 Players',
        'All Game Modes',
        'Strategic Jokers',
        'Real-time Leaderboard',
        'Email Results',
        'Great for events!',
      ],
    },
    {
      name: 'Pro Event',
      price: 19.99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_EVENT,
      players: 250,
      icon: '👑',
      popular: false,
      features: [
        '1 Quiz Session',
        'Up to 250 Players',
        'All Game Modes',
        'Strategic Jokers',
        'Real-time Leaderboard',
        'Email Results',
        'Maximum capacity!',
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
        '5 Quiz per month',
        'Up to 250 players per session',
        'Strategic mode included',
        'Email results & analytics',
        'Standard support',
        '30-day free trial',
      ],
      warnings: [
        'Professional business card required',
        'Proof of business activity required',
        'VAT number verification',
      ],
    },
    {
      name: 'Pro',
      price: 99,
      priceId: import.meta.env.VITE_STRIPE_PRICE_PRO,
      icon: <Crown className="w-8 h-8" />,
      trial: false,
      features: [
        'Unlimited Quiz',
        'Up to 250 players per session',
        '2 Team Seats',
        'White Label (custom subdomain)',
        'Strategic mode included',
        'Priority support',
        'Advanced analytics',
      ],
      warnings: [
        'Professional business card required',
        'Proof of business activity required',
        'VAT number verification',
        'No free trial - Paid immediately',
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
              onClick={() => window.location.href = '/'}
              icon={<ArrowLeft />}
            >
              Back to Home
            </Button>
          </div>

          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h1>
            <p className="text-2xl text-white/70">
              One-time payment, instant access. No subscription.
            </p>
          </div>

          <div className="mb-20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-qb-cyan to-qb-purple rounded-full">
                <Users className="w-6 h-6 text-white" />
                <span className="text-2xl font-bold text-white">For Everyone</span>
              </div>
            </div>

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
                        <span className="text-sm font-bold text-white">⭐ MOST POPULAR</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{plan.icon}</div>
                    <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold text-qb-cyan">${plan.price}</span>
                    </div>
                    <p className="text-white/70 mt-2">One-time payment</p>
                    <p className="text-qb-cyan font-bold">{plan.players} Players Max</p>
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
                    {loading === plan.priceId ? 'Processing...' : 'Buy Now'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-12">
            <div className="text-center mb-8">
              <button
                onClick={() => setShowB2B(!showB2B)}
                className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"
              >
                <Building2 className="w-6 h-6 text-white/70" />
                <span className="text-xl font-bold text-white/70">
                  Business Plans (Bars, Restaurants, Hotels)
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
                        ⚠️ Business Accounts Only
                      </h3>
                      <ul className="text-white/90 space-y-1 text-lg">
                        <li>• Professional business credit card required</li>
                        <li>• Proof of business activity (SIRET, VAT number, business license)</li>
                        <li>• Manual verification process (24-48h)</li>
                        <li>• Monthly billing - automatic renewal</li>
                      </ul>
                      <p className="text-yellow-200 font-bold mt-3">
                        💡 For personal use, choose one of our one-time payment plans above!
                      </p>
                    </div>
                  </div>
                </div>

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
                          <p className="text-qb-cyan font-bold mt-2">30-day free trial</p>
                        )}
                        {!plan.trial && (
                          <p className="text-red-400 font-bold mt-2">⚠️ No trial - Paid immediately</p>
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

                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm font-bold text-red-300 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Required Documents:
                        </p>
                        <ul className="text-xs text-red-200/90 space-y-1">
                          {plan.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        fullWidth
                        size="lg"
                        variant="ghost"
                        onClick={() => alert('Please contact sales@quizzaboom.com for business accounts')}
                      >
                        Contact Sales
                      </Button>
                    </Card>
                  ))}
                </div>

                <div className="text-center mt-8 p-4 bg-white/5 rounded-lg">
                  <p className="text-white/70">
                    Business inquiries: <a href="mailto:sales@quizzaboom.com" className="text-qb-cyan font-bold">sales@quizzaboom.com</a>
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
