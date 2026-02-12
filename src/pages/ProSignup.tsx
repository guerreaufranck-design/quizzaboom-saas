import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ArrowLeft, Building2, Search, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';
import type { VerificationResult, Organization } from '../types/organization';
import { useOrganizationStore } from '../stores/useOrganizationStore';

type Step = 'form' | 'verifying' | 'result';

const COUNTRIES = [
  { code: 'FR', label: 'France', placeholder: '123 456 789 00012', hint: 'Enter your 14-digit SIRET number' },
  { code: 'DE', label: 'Germany', placeholder: 'DE123456789', hint: 'Enter your VAT number (DE + 9 digits)' },
  { code: 'ES', label: 'Spain', placeholder: 'ESA12345678', hint: 'Enter your VAT number (ES + 9 chars)' },
  { code: 'IT', label: 'Italy', placeholder: 'IT12345678901', hint: 'Enter your VAT number (IT + 11 digits)' },
  { code: 'BE', label: 'Belgium', placeholder: 'BE0123456789', hint: 'Enter your VAT number (BE + 10 digits)' },
  { code: 'NL', label: 'Netherlands', placeholder: 'NL123456789B01', hint: 'Enter your VAT number' },
  { code: 'PT', label: 'Portugal', placeholder: 'PT123456789', hint: 'Enter your VAT number' },
  { code: 'AT', label: 'Austria', placeholder: 'ATU12345678', hint: 'Enter your VAT number' },
  { code: 'GB', label: 'United Kingdom', placeholder: 'GB123456789', hint: 'Enter your VAT number' },
  { code: 'US', label: 'United States', placeholder: '12-3456789', hint: 'Enter your EIN (Employer Identification Number)' },
  { code: 'AU', label: 'Australia', placeholder: '12 345 678 901', hint: 'Enter your 11-digit ABN (Australian Business Number)' },
  { code: 'NZ', label: 'New Zealand', placeholder: '1234567', hint: 'Enter your NZBN or company number' },
];

export const ProSignup: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('form');
  const [country, setCountry] = useState('FR');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const selectedCountry = COUNTRIES.find(c => c.code === country);

  // Auth is handled by ProtectedRoute wrapper

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to verify your business.');
      return;
    }

    setStep('verifying');
    setError('');

    try {
      const response = await fetch('/api/verify-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber,
          country,
          userId: user.id,
          businessName,
        }),
      });

      const data = await response.json();

      if (!response.ok && response.status !== 200) {
        setError(data.message || data.error || 'Verification failed');
        setStep('form');
        return;
      }

      setResult(data);
      setStep('result');
    } catch (err) {
      setError('Connection error. Please try again.');
      setStep('form');
    }
  };

  if (step === 'verifying') {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="animate-pulse">
            <Search className="w-16 h-16 text-qb-cyan mx-auto mb-6" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{t('proSignup.verifying')}</h2>
          <div className="space-y-3 text-white/70">
            <p>{t('proSignup.lookingUp')}</p>
            <p>{t('proSignup.analyzing')}</p>
            <p className="text-sm text-white/50">{t('proSignup.fewSeconds')}</p>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-qb-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-qb-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-qb-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'result' && result) {
    if (result.eligible) {
      return (
        <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">{t('proSignup.welcomePro')}</h2>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <p className="text-green-300 font-bold text-lg mb-1">{result.businessName}</p>
              <p className="text-green-200/70 text-sm capitalize">{result.detectedType?.replace('_', ' ')}</p>
            </div>
            <div className="space-y-3 text-white/80 mb-8">
              <p>{t('proSignup.trialActive')}</p>
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">{t('proSignup.plan')}</span>
                  <span className="font-bold text-qb-cyan">{t('proSignup.starterTrial')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">{t('proSignup.quizLimit')}</span>
                  <span className="font-bold">5/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">{t('proSignup.playersLimit')}</span>
                  <span className="font-bold">Up to 250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">{t('proSignup.trialEnds')}</span>
                  <span className="font-bold text-qb-yellow">
                    {result.trialEndsAt
                      ? new Date(result.trialEndsAt).toLocaleDateString()
                      : '30 days'}
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="xl"
              fullWidth
              gradient
              onClick={() => {
                // Pre-populate the org store to avoid race condition
                if (result.organizationId) {
                  const { setOrganizationDirectly } = useOrganizationStore.getState();
                  setOrganizationDirectly({
                    id: result.organizationId,
                    name: result.businessName,
                    type: (result.detectedType as Organization['type']) || 'other',
                    subscription_plan: 'starter',
                    subscription_status: 'trial',
                    trial_ends_at: result.trialEndsAt,
                    monthly_quiz_limit: 5,
                    quizzes_used_this_month: 0,
                    max_participants: 250,
                    white_label_enabled: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                }
                navigate('/pro-dashboard');
              }}
            >
              {t('proSignup.goToDashboard')}
            </Button>
          </Card>
        </div>
      );
    }

    // Rejected
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center">
          <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">{t('proSignup.notEligible')}</h2>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-300 font-bold text-lg mb-1">{result.businessName}</p>
            <p className="text-red-200/70 text-sm capitalize">{result.detectedType?.replace('_', ' ')}</p>
          </div>
          <p className="text-white/70 mb-4">{result.reason}</p>
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-white/80 text-sm">
              {t('proSignup.notEligibleDesc')}
            </p>
          </div>
          <div className="space-y-3">
            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                setStep('form');
                setResult(null);
              }}
            >
              {t('proSignup.tryAnother')}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => navigate('/pricing')}
            >
              {t('proSignup.viewPersonalPlans')}
            </Button>
            <p className="text-white/50 text-xs mt-4">
              {t('proSignup.mistakeContact')}{' '}
              <a href="mailto:support@quizzaboom.app" className="text-qb-cyan">
                support@quizzaboom.app
              </a>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Form step
  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/pricing')}
              icon={<ArrowLeft />}
            >
              {t('proSignup.backToPricing')}
            </Button>
          </div>

          <Card gradient className="p-8">
            <div className="text-center mb-8">
              <Building2 className="w-16 h-16 text-qb-purple mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-white mb-2">{t('proSignup.title')}</h1>
              <p className="text-white/70">
                {t('proSignup.subtitle')}
              </p>
            </div>

            {/* Info banner */}
            <div className="mb-8 p-4 bg-qb-cyan/10 border border-qb-cyan/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-qb-cyan shrink-0 mt-0.5" />
                <div className="text-sm text-white/80">
                  <p className="font-bold text-qb-cyan mb-1">{t('proSignup.eligibleBusiness')}</p>
                  <p>
                    {t('proSignup.eligibleDesc')}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              {/* Country */}
              <div>
                <label className="block text-white font-bold mb-2">{t('proSignup.country')}</label>
                <Select
                  value={country}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value)}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </Select>
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-white font-bold mb-2">
                  {country === 'FR' ? t('proSignup.siret') : ['US', 'AU', 'NZ'].includes(country) ? t('proSignup.businessId', 'Business ID') : t('proSignup.vatNumber')}
                </label>
                <Input
                  type="text"
                  value={registrationNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegistrationNumber(e.target.value)}
                  placeholder={selectedCountry?.placeholder}
                  required
                />
                <p className="text-white/50 text-xs mt-1">{selectedCountry?.hint}</p>
              </div>

              {/* Business Name (for non-FR countries where VIES may not return name) */}
              {country !== 'FR' && (
                <div>
                  <label className="block text-white font-bold mb-2">
                    {t('proSignup.businessName')}
                  </label>
                  <Input
                    type="text"
                    value={businessName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                    required
                  />
                  <p className="text-white/50 text-xs mt-1">
                    {t('proSignup.businessNameHint')}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                size="xl"
                fullWidth
                gradient
                disabled={!registrationNumber.trim()}
                icon={<Search />}
              >
                {t('proSignup.verifyButton')}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/50 text-sm">
                {t('proSignup.verificationNote')}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
