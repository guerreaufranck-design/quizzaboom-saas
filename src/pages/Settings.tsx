import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/useAuthStore';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase/client';
import {
  ArrowLeft,
  LogOut,
  CreditCard,
  Shield,
  FileText,
  Trash2,
  ExternalLink,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { LanguageSelector } from '../components/LanguageSelector';

const STRIPE_CUSTOMER_PORTAL = 'https://billing.stripe.com/p/login/cNifZifiT7ww7FP5zubQY00';

export const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useAppNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      // Delete user data from our tables
      await supabase.from('session_players').delete().eq('email', user.email);
      await supabase.from('user_purchases').delete().eq('user_id', user.id);

      // Sign out (Supabase admin deletion requires server-side)
      await signOut();
      navigate('home');
    } catch (error) {
      console.error('Delete account error:', error);
      setDeleting(false);
    }
  };

  if (!user) {
    navigate('auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('dashboard')}
                icon={<ArrowLeft />}
              >
                {t('common.back')}
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white">{t('settings.title')}</h1>
                <p className="text-white/70">{user.email}</p>
              </div>
            </div>
            <LanguageSelector />
          </div>

          <div className="space-y-6">
            {/* Subscription Management */}
            <Card gradient className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-qb-cyan" />
                <h2 className="text-2xl font-bold text-white">{t('settings.subscription')}</h2>
              </div>
              <p className="text-white/70 mb-4">{t('settings.subscriptionDesc')}</p>
              <Button
                variant="secondary"
                icon={<ExternalLink />}
                onClick={() => window.open(STRIPE_CUSTOMER_PORTAL, '_blank')}
              >
                {t('settings.manageSubscription')}
              </Button>
            </Card>

            {/* Privacy Policy */}
            <Card gradient className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-bold text-white">{t('settings.privacyPolicy')}</h2>
              </div>
              <div className="text-white/70 space-y-3 text-sm leading-relaxed">
                <p>{t('settings.privacyIntro')}</p>
                <h3 className="text-white font-bold text-base mt-4">{t('settings.dataCollectedTitle')}</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('settings.dataEmail')}</li>
                  <li>{t('settings.dataQuiz')}</li>
                  <li>{t('settings.dataPayment')}</li>
                </ul>
                <h3 className="text-white font-bold text-base mt-4">{t('settings.dataUsageTitle')}</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('settings.usageService')}</li>
                  <li>{t('settings.usageResults')}</li>
                  <li>{t('settings.usageImprove')}</li>
                </ul>
                <h3 className="text-white font-bold text-base mt-4">{t('settings.dataStorageTitle')}</h3>
                <p>{t('settings.dataStorage')}</p>
                <h3 className="text-white font-bold text-base mt-4">{t('settings.gdprTitle')}</h3>
                <p>{t('settings.gdprDesc')}</p>
              </div>
            </Card>

            {/* Terms of Service */}
            <Card gradient className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">{t('settings.termsOfService')}</h2>
              </div>
              <div className="text-white/70 space-y-3 text-sm leading-relaxed">
                <p>{t('settings.termsIntro')}</p>
                <h3 className="text-white font-bold text-base mt-4">{t('settings.termsUsageTitle')}</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('settings.termsUsage1')}</li>
                  <li>{t('settings.termsUsage2')}</li>
                  <li>{t('settings.termsUsage3')}</li>
                </ul>
                <h3 className="text-white font-bold text-base mt-4">{t('settings.termsPaymentTitle')}</h3>
                <p>{t('settings.termsPayment')}</p>
                <h3 className="text-white font-bold text-base mt-4">{t('settings.termsLiabilityTitle')}</h3>
                <p>{t('settings.termsLiability')}</p>
              </div>
            </Card>

            {/* Contact */}
            <Card gradient className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">{t('settings.contact')}</h2>
              </div>
              <p className="text-white/70 mb-2">{t('settings.contactDesc')}</p>
              <a href="mailto:contact@quizzaboom.app" className="text-qb-cyan hover:underline font-bold">
                contact@quizzaboom.app
              </a>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-2 border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h2 className="text-2xl font-bold text-red-400">{t('settings.dangerZone')}</h2>
              </div>

              <div className="flex items-center justify-between mb-4 p-4 bg-white/5 rounded-lg">
                <div>
                  <h3 className="text-white font-bold">{t('settings.signOutTitle')}</h3>
                  <p className="text-white/60 text-sm">{t('settings.signOutDesc')}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  icon={<LogOut />}
                  className="text-white/70 hover:text-white"
                >
                  {t('common.signOut')}
                </Button>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-red-400 font-bold">{t('settings.deleteAccount')}</h3>
                    <p className="text-white/60 text-sm">{t('settings.deleteAccountDesc')}</p>
                  </div>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(true)}
                      icon={<Trash2 />}
                      className="text-red-400 hover:text-red-300"
                    >
                      {t('common.delete')}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleting ? t('common.loading') : t('settings.confirmDelete')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
