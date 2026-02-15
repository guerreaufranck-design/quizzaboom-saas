import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useOrganizationStore } from '../stores/useOrganizationStore';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase/client';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { InviteEmailModal } from '../components/InviteEmailModal';
import {
  LogOut, Plus, Building2, Clock, BarChart3,
  AlertTriangle, Crown, ArrowLeft, BookOpen,
  Download, Mail, Send, Users, Loader2, CheckCircle,
} from 'lucide-react';

interface ContactInfo {
  player_name: string;
  email: string;
}

export const ProDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const {
    currentOrganization: org,
    trialDaysRemaining,
    isTrialExpired,
    isLoading,
    fetchOrganization,
  } = useOrganizationStore();

  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

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

  // Load contacts when org is available
  useEffect(() => {
    if (org?.id) {
      loadContacts(org.id);
    }
  }, [org?.id]);

  // Handle invite payment return from Stripe
  useEffect(() => {
    const inviteStatus = searchParams.get('invite');
    if (inviteStatus === 'success' && org?.id) {
      const date = searchParams.get('date');
      const time = searchParams.get('time');
      if (date && time) {
        handlePostPaymentSend(org.id, date, time);
        setSearchParams({}, { replace: true });
      }
    } else if (inviteStatus === 'cancelled') {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams.get('invite'), org?.id]);

  const loadContacts = async (orgId: string) => {
    setContactsLoading(true);
    try {
      const { data, error } = await supabase
        .from('participant_emails')
        .select('player_name, email')
        .eq('source_organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate by email
      const emailMap = new Map<string, ContactInfo>();
      for (const c of data || []) {
        if (!emailMap.has(c.email)) {
          emailMap.set(c.email, { player_name: c.player_name, email: c.email });
        }
      }
      setContacts(Array.from(emailMap.values()));
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handlePostPaymentSend = async (orgId: string, date: string, time: string) => {
    setInviteSending(true);
    try {
      const res = await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, eventDate: date, eventTime: time }),
      });
      if (res.ok) {
        setInviteSent(true);
      }
    } catch (error) {
      console.error('Failed to send invite emails after payment:', error);
    } finally {
      setInviteSending(false);
    }
  };

  const exportContactsCSV = () => {
    if (contacts.length === 0) return;
    const headers = ['Name', 'Email'];
    const rows = contacts.map(c => [`"${c.player_name}"`, `"${c.email}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quizzaboom-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

          {/* Invite sent banner */}
          {(inviteSending || inviteSent) && (
            <Card className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-qb-cyan/20 border border-green-500/50">
              <div className="flex items-center gap-3 justify-center">
                {inviteSending ? (
                  <>
                    <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                    <span className="text-green-400 font-bold">{t('proDashboard.inviteSending')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-bold">{t('proDashboard.inviteSent')}</span>
                  </>
                )}
              </div>
            </Card>
          )}

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

          {/* Player Contacts — CRM Section */}
          <Card gradient className="p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-qb-magenta/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-qb-magenta" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('proDashboard.playerContacts')}</h2>
                  <p className="text-white/50 text-sm">{t('proDashboard.playerContactsDesc')}</p>
                </div>
              </div>
              {!contactsLoading && (
                <span className="text-3xl font-bold text-qb-cyan">
                  {contacts.length}
                </span>
              )}
            </div>

            {contactsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-white/30 animate-spin mx-auto" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">{t('proDashboard.noContacts')}</p>
                <p className="text-white/30 text-sm mt-1">{t('proDashboard.noContactsHint')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Contact count summary */}
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{t('proDashboard.contactCount', { count: contacts.length })}</span>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    fullWidth
                    size="lg"
                    variant="secondary"
                    icon={<Download />}
                    onClick={exportContactsCSV}
                  >
                    {t('proDashboard.exportCSV')}
                  </Button>
                  <Button
                    fullWidth
                    size="lg"
                    gradient
                    icon={<Send />}
                    onClick={() => setShowInviteModal(true)}
                  >
                    {t('proDashboard.inviteNextQuiz')}
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">$1.99</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>

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

      {/* Invite Email Modal */}
      <InviteEmailModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        organizationId={org.id}
        organizationName={org.name}
        contactCount={contacts.length}
      />
    </div>
  );
};
