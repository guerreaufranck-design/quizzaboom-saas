import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useOrganizationStore } from '../stores/useOrganizationStore';
import { signOut } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  LogOut, Plus, Building2, Clock, BarChart3,
  AlertTriangle, Crown, ArrowLeft, BookOpen,
} from 'lucide-react';

export const ProDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentOrganization: org,
    trialDaysRemaining,
    isTrialExpired,
    isLoading,
    fetchOrganization,
  } = useOrganizationStore();

  useEffect(() => {
    if (user) {
      const fetchWithRetry = async (attempts = 0) => {
        await fetchOrganization(user.id);
        const { currentOrganization } = useOrganizationStore.getState();
        if (!currentOrganization && attempts < 3) {
          setTimeout(() => fetchWithRetry(attempts + 1), 2000);
        }
      };
      fetchWithRetry();
    }
  }, [user, fetchOrganization]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-white/50 text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Building2 className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t('proDashboard.noAccount')}</h2>
          <p className="text-white/60 mb-6">
            {t('proDashboard.noAccountDesc')}
          </p>
          <Button fullWidth gradient onClick={() => navigate('/pro-signup')}>
            {t('proDashboard.verifyBusiness')}
          </Button>
          <Button
            fullWidth
            variant="ghost"
            className="mt-3"
            onClick={() => navigate('/dashboard')}
          >
            {t('proDashboard.personalDashboard')}
          </Button>
        </Card>
      </div>
    );
  }

  const quizUsage = org.subscription_plan === 'pro'
    ? null
    : { used: org.quizzes_used_this_month, limit: org.monthly_quiz_limit ?? 5 };

  const canCreateQuiz = !isTrialExpired &&
    org.subscription_status !== 'cancelled' &&
    (org.subscription_plan === 'pro' || (quizUsage && quizUsage.used < quizUsage.limit));

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                icon={<ArrowLeft />}
              >
                {t('common.backToHome')}
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white">{org.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/50 capitalize">{org.type.replace('_', ' ')}</span>
                  <span className="px-2 py-0.5 bg-qb-purple/20 text-qb-purple text-xs font-bold rounded-full uppercase">
                    {org.subscription_plan}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                    org.subscription_status === 'trial' ? 'bg-qb-cyan/20 text-qb-cyan' :
                    org.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {org.subscription_status}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={handleSignOut} icon={<LogOut />}>
              {t('common.signOut')}
            </Button>
          </div>

          {/* Trial Expiration Warning */}
          {isTrialExpired && (
            <Card className="mb-6 p-6 bg-red-500/10 border-red-500/30">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-red-300 mb-1">{t('proDashboard.trialExpired')}</h3>
                  <p className="text-white/70 mb-4">
                    {t('proDashboard.trialExpiredDesc')}
                  </p>
                  <Button gradient onClick={() => navigate('/pricing')}>
                    {t('proDashboard.viewPlans')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Trial Days Remaining */}
          {!isTrialExpired && trialDaysRemaining !== null && (
            <Card className={`mb-6 p-4 ${
              trialDaysRemaining <= 7
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-qb-cyan/10 border-qb-cyan/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${trialDaysRemaining <= 7 ? 'text-yellow-400' : 'text-qb-cyan'}`} />
                  <span className="text-white font-medium">
                    {t('proDashboard.daysRemaining', { count: trialDaysRemaining })}
                  </span>
                </div>
                {/* Trial progress bar */}
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${trialDaysRemaining <= 7 ? 'bg-yellow-400' : 'bg-qb-cyan'}`}
                    style={{ width: `${Math.max(0, (trialDaysRemaining / 30) * 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Quiz Usage */}
            <Card gradient className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-qb-cyan/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-qb-cyan" />
                </div>
                <div>
                  {quizUsage ? (
                    <>
                      <div className="text-3xl font-bold text-white">
                        {quizUsage.used}/{quizUsage.limit}
                      </div>
                      <div className="text-white/70">{t('proDashboard.quizzesThisMonth')}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-white">{org.quizzes_used_this_month}</div>
                      <div className="text-white/70">{t('proDashboard.quizzesThisMonth')} ({t('proDashboard.unlimited')})</div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Plan */}
            <Card gradient className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-qb-purple/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-qb-purple" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white capitalize">{org.subscription_plan}</div>
                  <div className="text-white/70">
                    {t('proDashboard.playersMax', { count: org.max_participants })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Create Quiz */}
            <Card gradient className="p-6">
              <Button
                fullWidth
                size="lg"
                gradient
                icon={<Plus />}
                onClick={() => navigate('/create')}
                disabled={!canCreateQuiz}
              >
                {t('dashboard.createQuiz')}
              </Button>
              {!canCreateQuiz && (
                <p className="text-xs text-white/60 mt-2 text-center">
                  {isTrialExpired ? t('proDashboard.trialExpiredShort') : t('proDashboard.quizLimitReached')}
                </p>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <Card gradient className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">{t('proDashboard.quickActions')}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                onClick={() => navigate('/create')}
                disabled={!canCreateQuiz}
              >
                {t('proDashboard.createNewQuiz')}
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="ghost"
                onClick={() => navigate('/pricing')}
              >
                {org.subscription_status === 'trial' ? t('proDashboard.upgradePlan') : t('proDashboard.manageSubscription')}
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="ghost"
                onClick={() => navigate('/')}
                icon={<BookOpen />}
              >
                {t('dashboard.viewGuide')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
