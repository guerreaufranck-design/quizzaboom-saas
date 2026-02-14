import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/useAuthStore';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase/client';
import {
  Plus, LogOut, CreditCard, Trophy, Loader2, BookOpen, Building2, Settings,
  Gamepad2, Users, DollarSign, ArrowLeft, Zap, BarChart3, Clock,
} from 'lucide-react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useOrganizationStore } from '../stores/useOrganizationStore';

interface Purchase {
  id: string;
  plan_name: string;
  max_players: number;
  created_at: string;
  used: boolean;
  amount?: number;
}

interface QuizSession {
  id: string;
  session_code: string;
  status: string;
  created_at: string;
  quiz_id: string;
  player_count: number;
  quiz_title?: string;
}

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useAppNavigate();
  const { currentOrganization, fetchOrganization } = useOrganizationStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
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
    loadSessions();
    fetchOrganization(user.id);
  }, [user]);

  // Poll for new purchase after Stripe payment redirect
  useEffect(() => {
    if (searchParams.get('payment') !== 'success' || !user) return;

    setWaitingForPayment(true);
    pollCountRef.current = 0;

    const pollInterval = setInterval(async () => {
      pollCountRef.current++;
      console.log(`Payment polling attempt ${pollCountRef.current}...`);

      const { data } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const currentCount = data?.length || 0;

      if (initialPurchaseCountRef.current === null) {
        initialPurchaseCountRef.current = purchases.length;
      }

      if (currentCount > (initialPurchaseCountRef.current || 0)) {
        setPurchases(data || []);
        setWaitingForPayment(false);
        setSearchParams({}, { replace: true });
        clearInterval(pollInterval);
        return;
      }

      if (pollCountRef.current >= 30) {
        setWaitingForPayment(false);
        setSearchParams({}, { replace: true });
        clearInterval(pollInterval);
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

  const loadSessions = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('quiz_sessions')
        .select('id, session_code, status, created_at, quiz_id')
        .eq('host_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        return;
      }

      // Fetch player counts for each session
      const enrichedSessions = await Promise.all(
        sessionsData.map(async (session) => {
          const { count } = await supabase
            .from('session_players')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          // Get quiz title
          const { data: quizData } = await supabase
            .from('ai_generated_quizzes')
            .select('title')
            .eq('id', session.quiz_id)
            .single();

          return {
            ...session,
            player_count: count || 0,
            quiz_title: quizData?.title || 'Quiz',
          };
        })
      );

      setSessions(enrichedSessions);
    } catch (error) {
      console.error('Load sessions error:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  const availableCredits = purchases.filter(p => !p.used).length;
  const totalQuizzes = purchases.filter(p => p.used).length;
  const totalPlayers = sessions.reduce((sum, s) => sum + s.player_count, 0);
  const totalSpent = purchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('home')}
                icon={<ArrowLeft />}
              >
                {t('common.backToHome')}
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white">{t('dashboard.title')}</h1>
                <p className="text-white/70">{t('dashboard.welcomeBack', { email: user?.email })}</p>
              </div>
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
            <Card className="p-4 mb-6 bg-gradient-to-r from-green-500/20 to-qb-cyan/20 border border-green-500/50">
              <div className="flex items-center gap-3 justify-center">
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                <span className="text-green-400 font-bold">{t('dashboard.paymentProcessing')}</span>
              </div>
            </Card>
          )}

          {/* Stats Grid — 4 cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card gradient className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-qb-cyan/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-qb-cyan" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{availableCredits}</div>
                  <div className="text-white/60 text-sm">{t('dashboard.availableCredits')}</div>
                </div>
              </div>
            </Card>

            <Card gradient className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-qb-purple/20 rounded-xl flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-qb-purple" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{totalQuizzes}</div>
                  <div className="text-white/60 text-sm">{t('dashboard.totalQuizzes')}</div>
                </div>
              </div>
            </Card>

            <Card gradient className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-qb-magenta/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-qb-magenta" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{totalPlayers}</div>
                  <div className="text-white/60 text-sm">{t('dashboard.totalPlayers')}</div>
                </div>
              </div>
            </Card>

            <Card gradient className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-qb-yellow/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-qb-yellow" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">${totalSpent.toFixed(0)}</div>
                  <div className="text-white/60 text-sm">{t('dashboard.totalSpent')}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card gradient className="p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-qb-yellow" />
              {t('dashboard.quickActions')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                icon={<Gamepad2 />}
                onClick={() => navigate('join')}
              >
                {t('dashboard.joinQuiz')}
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                icon={<CreditCard />}
                onClick={() => navigate('pricing')}
              >
                {t('dashboard.buyMore')}
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="ghost"
                icon={<BookOpen />}
                onClick={() => navigate('home')}
              >
                {t('dashboard.viewGuide')}
              </Button>
            </div>
            {availableCredits === 0 && (
              <p className="text-xs text-white/50 mt-2 text-center">{t('dashboard.noCredits')}</p>
            )}
          </Card>

          {/* Pro Dashboard shortcut */}
          {currentOrganization && (
            <Card gradient className="p-5 mb-8 bg-gradient-to-r from-qb-purple/10 to-qb-magenta/10 border border-qb-purple/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-qb-purple/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-qb-purple" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('dashboard.proDashboard')}</h3>
                    <p className="text-white/50 text-sm">{t('dashboard.proDashboardDesc')}</p>
                  </div>
                </div>
                <Button gradient onClick={() => navigate('pro-dashboard')}>
                  {t('dashboard.proDashboard')}
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Sessions */}
          <Card gradient className="p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-qb-cyan" />
              {t('dashboard.recentSessions')}
            </h2>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🎯</div>
                <p className="text-white/50">{t('dashboard.noSessions')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        {session.status === 'finished' || session.status === 'completed' ? '✅' : '🔄'}
                      </div>
                      <div>
                        <div className="text-white font-bold">{session.quiz_title}</div>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {t('dashboard.players', { count: session.player_count })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        session.status === 'finished' || session.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : session.status === 'playing'
                          ? 'bg-qb-cyan/20 text-qb-cyan'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {session.status === 'finished' || session.status === 'completed'
                          ? t('dashboard.completed')
                          : session.status === 'playing'
                          ? t('dashboard.inProgress')
                          : session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Purchases / Credits */}
          <Card gradient className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-qb-yellow" />
              {t('dashboard.myPurchases')}
            </h2>

            {loading ? (
              <div className="text-center py-8 text-white/50">{t('common.loading')}</div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🎮</div>
                <p className="text-white/50 mb-4">{t('dashboard.noPurchases')}</p>
                <Button gradient onClick={() => navigate('pricing')}>
                  {t('dashboard.browsePlans')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div>
                      <div className="text-white font-bold">{purchase.plan_name}</div>
                      <div className="text-sm text-white/50">
                        {t('dashboard.upToPlayers', { count: purchase.max_players })} • {new Date(purchase.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      {purchase.used ? (
                        <span className="px-4 py-1.5 bg-white/5 text-white/40 rounded-lg text-sm">
                          {t('dashboard.used')}
                        </span>
                      ) : (
                        <Button
                          gradient
                          size="sm"
                          onClick={() => navigate('create')}
                        >
                          {t('dashboard.useCredit')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-4 text-center">
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
