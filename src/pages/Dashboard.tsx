import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/useAuthStore';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase/client';
import { Plus, LogOut, CreditCard, Trophy, Loader2, BookOpen, Building2, Settings } from 'lucide-react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useOrganizationStore } from '../stores/useOrganizationStore';

interface Purchase {
  id: string;
  plan_name: string;
  max_players: number;
  created_at: string;
  used: boolean;
}

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useAppNavigate();
  const { currentOrganization, fetchOrganization } = useOrganizationStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const pollCountRef = useRef(0);
  const initialPurchaseCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('auth');
      return;
    }

    loadPurchases();
    fetchOrganization(user.id);
  }, [user]);

  // Poll for new purchase after Stripe payment redirect
  useEffect(() => {
    if (searchParams.get('payment') !== 'success' || !user) return;

    setWaitingForPayment(true);
    pollCountRef.current = 0;

    const pollInterval = setInterval(async () => {
      pollCountRef.current++;
      console.log(`💳 Polling for new purchase (attempt ${pollCountRef.current})...`);

      const { data } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const currentCount = data?.length || 0;

      // First poll: store initial count
      if (initialPurchaseCountRef.current === null) {
        initialPurchaseCountRef.current = purchases.length;
      }

      // New purchase detected!
      if (currentCount > (initialPurchaseCountRef.current || 0)) {
        console.log('✅ New purchase detected!');
        setPurchases(data || []);
        setWaitingForPayment(false);
        setSearchParams({}, { replace: true }); // Clean URL
        clearInterval(pollInterval);
        return;
      }

      // Timeout after 30 attempts (60 seconds)
      if (pollCountRef.current >= 30) {
        console.log('⏱️ Payment polling timeout');
        setWaitingForPayment(false);
        setSearchParams({}, { replace: true });
        clearInterval(pollInterval);
        // Reload one final time
        setPurchases(data || []);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [searchParams.get('payment'), user]);

  const loadPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Load purchases error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  const availableCredits = purchases.filter(p => !p.used).length;

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">{t('dashboard.title')}</h1>
              <p className="text-white/70">{t('dashboard.welcomeBack', { email: user?.email })}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate('settings')}
                icon={<Settings />}
              >
                {t('settings.title')}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                icon={<LogOut />}
              >
                {t('common.signOut')}
              </Button>
            </div>
          </div>

          {/* Payment processing banner */}
          {waitingForPayment && (
            <Card className="p-4 mb-8 bg-gradient-to-r from-green-500/20 to-qb-cyan/20 border border-green-500/50">
              <div className="flex items-center gap-3 justify-center">
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                <span className="text-green-400 font-bold">{t('dashboard.paymentProcessing')}</span>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card gradient className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-qb-cyan/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-qb-cyan" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{availableCredits}</div>
                  <div className="text-white/70">{t('dashboard.availableCredits')}</div>
                </div>
              </div>
              {availableCredits === 0 && purchases.length > 0 && (
                <Button
                  size="sm"
                  gradient
                  className="mt-4 w-full"
                  onClick={() => navigate('pricing')}
                  icon={<Plus />}
                >
                  {t('dashboard.buyMore')}
                </Button>
              )}
            </Card>

            <Card gradient className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-qb-purple/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-qb-purple" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{purchases.length}</div>
                  <div className="text-white/70">{t('dashboard.totalPurchases')}</div>
                </div>
              </div>
            </Card>

            <Card gradient className="p-6">
              <Button
                fullWidth
                size="lg"
                gradient
                icon={<Plus />}
                onClick={() => navigate('create')}
                disabled={availableCredits === 0}
              >
                {t('dashboard.createQuiz')}
              </Button>
              {availableCredits === 0 && (
                <p className="text-xs text-white/60 mt-2 text-center">
                  {t('dashboard.noCredits')}
                </p>
              )}
            </Card>
          </div>

          {/* Guide */}
          <Card gradient className="p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-qb-cyan/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-qb-cyan" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t('dashboard.guideTitle')}</h3>
                  <p className="text-white/60 text-sm">{t('dashboard.guideDesc')}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => navigate('home')}>
                {t('dashboard.viewGuide')}
              </Button>
            </div>
          </Card>

          {/* Pro Dashboard shortcut */}
          {currentOrganization && (
            <Card gradient className="p-6 mb-8 bg-gradient-to-r from-qb-purple/10 to-qb-magenta/10 border border-qb-purple/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-qb-purple/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-qb-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{t('dashboard.proDashboard')}</h3>
                    <p className="text-white/60 text-sm">{t('dashboard.proDashboardDesc')}</p>
                  </div>
                </div>
                <Button gradient onClick={() => navigate('pro-dashboard')}>
                  {t('dashboard.proDashboard')}
                </Button>
              </div>
            </Card>
          )}

          {/* Purchases */}
          <Card gradient className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">{t('dashboard.myPurchases')}</h2>

            {loading ? (
              <div className="text-center py-8 text-white/50">{t('common.loading')}</div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-white/70 mb-6">{t('dashboard.noPurchases')}</p>
                <Button
                  gradient
                  onClick={() => navigate('pricing')}
                >
                  {t('dashboard.browsePlans')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div>
                      <div className="text-lg font-bold text-white">{purchase.plan_name}</div>
                      <div className="text-sm text-white/60">
                        {t('dashboard.upToPlayers', { count: purchase.max_players })} • {new Date(purchase.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      {purchase.used ? (
                        <span className="px-4 py-2 bg-white/5 text-white/50 rounded-lg">
                          {t('dashboard.used')}
                        </span>
                      ) : (
                        <Button
                          gradient
                          onClick={() => navigate('create')}
                        >
                          {t('dashboard.useCredit')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-6 text-center">
                  <Button
                    gradient
                    onClick={() => navigate('pricing')}
                    icon={<Plus />}
                  >
                    {t('dashboard.buyMore')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
