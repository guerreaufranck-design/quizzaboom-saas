import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/useAuthStore';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase/client';
import { Plus, LogOut, CreditCard, Trophy, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppNavigate } from '../hooks/useAppNavigate';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [purchaseFound, setPurchaseFound] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialCountRef = useRef<number | null>(null);

  const loadPurchases = useCallback(async () => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const result = data || [];
      setPurchases(result);
      return result;
    } catch (error) {
      console.error('Load purchases error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Detect ?payment=success and poll for new purchase from webhook
  useEffect(() => {
    if (searchParams.get('payment') !== 'success' || !user) return;

    setPaymentSuccess(true);
    setWaitingForWebhook(true);

    // Remove ?payment=success from URL without reload
    searchParams.delete('payment');
    setSearchParams(searchParams, { replace: true });

    // Store current purchase count to detect new one
    const startPolling = async () => {
      const current = await loadPurchases();
      initialCountRef.current = current.length;

      let attempts = 0;
      const maxAttempts = 15; // 15 × 2s = 30 seconds max

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        const updated = await loadPurchases();

        if (updated.length > (initialCountRef.current ?? 0)) {
          // New purchase detected!
          setPurchaseFound(true);
          setWaitingForWebhook(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        } else if (attempts >= maxAttempts) {
          // Stop polling after 30s — purchase not yet synced
          setPurchaseFound(false);
          setWaitingForWebhook(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      }, 2000);
    };

    startPolling();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [searchParams, user, setSearchParams, loadPurchases]);

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
            <Button
              variant="ghost"
              onClick={handleSignOut}
              icon={<LogOut />}
            >
              {t('common.signOut')}
            </Button>
          </div>

          {/* Payment success banner */}
          {paymentSuccess && (
            <div className={`mb-8 p-4 rounded-xl flex items-center gap-4 ${
              waitingForWebhook || purchaseFound
                ? 'bg-green-500/10 border border-green-500/40'
                : 'bg-yellow-500/10 border border-yellow-500/40'
            }`}>
              {waitingForWebhook ? (
                <>
                  <Loader2 className="w-6 h-6 text-green-400 animate-spin shrink-0" />
                  <div>
                    <p className="text-green-300 font-bold">{t('dashboard.paymentReceived')}</p>
                    <p className="text-green-200/70 text-sm">{t('dashboard.syncingPurchase')}</p>
                  </div>
                </>
              ) : purchaseFound ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
                  <div>
                    <p className="text-green-300 font-bold">{t('dashboard.paymentConfirmed')}</p>
                    <p className="text-green-200/70 text-sm">{t('dashboard.creditReady')}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-yellow-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-yellow-300 font-bold">{t('dashboard.paymentPending')}</p>
                    <p className="text-yellow-200/70 text-sm">{t('dashboard.paymentPendingHint')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={() => window.location.reload()}
                  >
                    {t('dashboard.refresh')}
                  </Button>
                </>
              )}
            </div>
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
                        Up to {purchase.max_players} players • {new Date(purchase.created_at).toLocaleDateString()}
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
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
