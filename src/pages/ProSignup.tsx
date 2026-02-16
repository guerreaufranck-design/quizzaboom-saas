import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ArrowLeft, Building2, Search, CheckCircle, XCircle, AlertCircle, Shield, Mail, Clock, UserCheck } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { VerificationResult, Organization } from '../types/organization';
import { useOrganizationStore } from '../stores/useOrganizationStore';

type Step = 'form' | 'verifying' | 'result';

const getCountries = (t: TFunction) => [
  { code: 'FR', label: t('proSignup.countries.FR'), placeholder: '123 456 789 00012', hint: t('proSignup.hints.FR') },
  { code: 'DE', label: t('proSignup.countries.DE'), placeholder: 'DE123456789', hint: t('proSignup.hints.DE') },
  { code: 'ES', label: t('proSignup.countries.ES'), placeholder: 'ESA12345678', hint: t('proSignup.hints.ES') },
  { code: 'IT', label: t('proSignup.countries.IT'), placeholder: 'IT12345678901', hint: t('proSignup.hints.IT') },
  { code: 'BE', label: t('proSignup.countries.BE'), placeholder: 'BE0123456789', hint: t('proSignup.hints.BE') },
  { code: 'NL', label: t('proSignup.countries.NL'), placeholder: 'NL123456789B01', hint: t('proSignup.hints.NL') },
  { code: 'PT', label: t('proSignup.countries.PT'), placeholder: 'PT123456789', hint: t('proSignup.hints.PT') },
  { code: 'AT', label: t('proSignup.countries.AT'), placeholder: 'ATU12345678', hint: t('proSignup.hints.AT') },
  { code: 'GB', label: t('proSignup.countries.GB'), placeholder: 'GB123456789', hint: t('proSignup.hints.GB') },
  { code: 'US', label: t('proSignup.countries.US'), placeholder: '12-3456789', hint: t('proSignup.hints.US') },
  { code: 'AU', label: t('proSignup.countries.AU'), placeholder: '12 345 678 901', hint: t('proSignup.hints.AU') },
  { code: 'NZ', label: t('proSignup.countries.NZ'), placeholder: '1234567', hint: t('proSignup.hints.NZ') },
];

const BUSINESS_TYPES = [
  { value: 'bar', labelKey: 'proSignup.types.bar' },
  { value: 'restaurant', labelKey: 'proSignup.types.restaurant' },
  { value: 'hotel', labelKey: 'proSignup.types.hotel' },
  { value: 'event_company', labelKey: 'proSignup.types.eventCompany' },
  { value: 'nightclub', labelKey: 'proSignup.types.nightclub' },
  { value: 'karaoke', labelKey: 'proSignup.types.karaoke' },
  { value: 'bowling', labelKey: 'proSignup.types.bowling' },
  { value: 'escape_room', labelKey: 'proSignup.types.escapeRoom' },
  { value: 'museum', labelKey: 'proSignup.types.museum' },
  { value: 'camping', labelKey: 'proSignup.types.camping' },
  { value: 'catering', labelKey: 'proSignup.types.catering' },
  { value: 'tourism', labelKey: 'proSignup.types.tourism' },
  { value: 'entertainment', labelKey: 'proSignup.types.entertainment' },
  { value: 'other', labelKey: 'proSignup.types.other' },
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

  // Manual mode state
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    commercialName: '',
    businessType: '',
    city: '',
    region: '',
    businessDescription: '',
    phone: '',
  });

  const countries = getCountries(t);
  const selectedCountry = countries.find(c => c.code === country);

  const isManualFormValid = manualForm.fullName.trim() && manualForm.businessType && manualForm.city.trim() && manualForm.businessDescription.trim();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError(t('proSignup.signInRequired'));
      return;
    }

    setStep('verifying');
    setError('');

    try {
      const body = isManualMode
        ? {
            registrationType: 'manual',
            country,
            userId: user.id,
            fullName: manualForm.fullName,
            commercialName: manualForm.commercialName || undefined,
            businessType: manualForm.businessType,
            city: manualForm.city,
            region: manualForm.region || undefined,
            businessDescription: manualForm.businessDescription,
            phone: manualForm.phone || undefined,
          }
        : {
            registrationType: 'automatic',
            registrationNumber,
            country,
            userId: user.id,
            businessName,
          };

      const response = await fetch('/api/verify-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok && response.status !== 200) {
        setError(data.message || data.error || t('proSignup.verificationFailed'));
        setStep('form');
        return;
      }

      setResult(data);
      setStep('result');
    } catch (err) {
      setError(t('proSignup.connectionError'));
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
    // Pending review (manual verification)
    if (result.pendingReview) {
      return (
        <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-8 text-center">
            <Clock className="w-20 h-20 text-qb-yellow mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">{t('proSignup.pendingReviewTitle')}</h2>
            <p className="text-white/70 mb-6">{t('proSignup.pendingReviewDesc')}</p>
            <div className="bg-qb-yellow/10 border border-qb-yellow/30 rounded-xl p-4 mb-6">
              <p className="text-qb-yellow font-bold text-lg mb-1">{result.businessName}</p>
              <p className="text-qb-yellow/70 text-sm capitalize">{result.detectedType?.replace('_', ' ')}</p>
              <p className="text-qb-yellow/60 text-xs mt-2">{t('proSignup.pendingReviewTime')}</p>
            </div>
            <div className="space-y-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigate('/dashboard')}
              >
                {t('proSignup.backToDashboard')}
              </Button>
              <Card className="mt-4 p-4 bg-qb-cyan/10 border border-qb-cyan/30">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-qb-cyan shrink-0" />
                  <div className="text-left text-sm">
                    <p className="text-white/70">{t('proSignup.supportDesc')}</p>
                    <a
                      href="mailto:support@quizzaboom.app"
                      className="text-qb-cyan font-bold hover:underline"
                    >
                      support@quizzaboom.app
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      );
    }

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
                  <span className="font-bold">{t('proSignup.fivePerMonth')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">{t('proSignup.playersLimit')}</span>
                  <span className="font-bold">{t('proSignup.upTo250')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">{t('proSignup.trialEnds')}</span>
                  <span className="font-bold text-qb-yellow">
                    {result.trialEndsAt
                      ? new Date(result.trialEndsAt).toLocaleDateString()
                      : t('proSignup.thirtyDays')}
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
            {/* Prominent Support Contact Card */}
            <Card className="mt-6 p-6 bg-qb-cyan/10 border-2 border-qb-cyan/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-qb-cyan/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Mail className="w-7 h-7 text-qb-cyan" />
                </div>
                <div className="text-left">
                  <h4 className="text-lg font-bold text-white mb-1">
                    {t('proSignup.supportTitle')}
                  </h4>
                  <p className="text-white/70 text-sm mb-2">
                    {t('proSignup.supportDesc')}
                  </p>
                  <a
                    href="mailto:support@quizzaboom.app"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-qb-cyan/20 hover:bg-qb-cyan/30 rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4 text-qb-cyan" />
                    <span className="text-qb-cyan font-bold">support@quizzaboom.app</span>
                  </a>
                </div>
              </div>
            </Card>
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
              onClick={() => navigate('/dashboard')}
              icon={<ArrowLeft />}
            >
              {t('common.backToHome')}
            </Button>
          </div>

          <Card gradient className="p-8">
            <div className="text-center mb-8">
              <Building2 className="w-16 h-16 text-qb-purple mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-white mb-2">{t('proSignup.title')}</h1>
              <p className="text-white/70">
                {isManualMode ? t('proSignup.manualSubtitle') : t('proSignup.subtitle')}
              </p>
            </div>

            {/* Info banner */}
            <div className="mb-6 p-4 bg-qb-cyan/10 border border-qb-cyan/30 rounded-xl">
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

            {/* Manual/Automatic mode toggle */}
            <div className="mb-6 text-center">
              <button
                type="button"
                onClick={() => setIsManualMode(!isManualMode)}
                className="inline-flex items-center gap-2 text-qb-cyan hover:text-qb-cyan/80 text-sm underline underline-offset-4 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                {isManualMode
                  ? t('proSignup.switchToAutomatic')
                  : t('proSignup.switchToManual')
                }
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              {/* Country (shared by both modes) */}
              <div>
                <label className="block text-white font-bold mb-2">{t('proSignup.country')}</label>
                <Select
                  value={country}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value)}
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </Select>
              </div>

              {isManualMode ? (
                /* ===== MANUAL VERIFICATION FORM ===== */
                <>
                  {/* Full Name */}
                  <div>
                    <label className="block text-white font-bold mb-2">{t('proSignup.fullName')}</label>
                    <Input
                      type="text"
                      value={manualForm.fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualForm({ ...manualForm, fullName: e.target.value })
                      }
                      placeholder={t('proSignup.fullNamePlaceholder')}
                      required
                    />
                  </div>

                  {/* Commercial Name */}
                  <div>
                    <label className="block text-white font-bold mb-2">{t('proSignup.commercialName')}</label>
                    <Input
                      type="text"
                      value={manualForm.commercialName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualForm({ ...manualForm, commercialName: e.target.value })
                      }
                      placeholder={t('proSignup.commercialNamePlaceholder')}
                    />
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-white font-bold mb-2">{t('proSignup.businessTypeLabel')}</label>
                    <Select
                      value={manualForm.businessType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setManualForm({ ...manualForm, businessType: e.target.value })
                      }
                    >
                      <option value="">{t('proSignup.businessTypePlaceholder')}</option>
                      {BUSINESS_TYPES.map(bt => (
                        <option key={bt.value} value={bt.value}>{t(bt.labelKey)}</option>
                      ))}
                    </Select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-white font-bold mb-2">{t('proSignup.cityLabel')}</label>
                    <Input
                      type="text"
                      value={manualForm.city}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualForm({ ...manualForm, city: e.target.value })
                      }
                      placeholder={t('proSignup.cityPlaceholder')}
                      required
                    />
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-white font-bold mb-2">{t('proSignup.regionLabel')}</label>
                    <Input
                      type="text"
                      value={manualForm.region}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualForm({ ...manualForm, region: e.target.value })
                      }
                      placeholder={t('proSignup.regionPlaceholder')}
                    />
                  </div>

                  {/* Business Description */}
                  <div>
                    <label className="block text-white font-bold mb-2">{t('proSignup.descriptionLabel')}</label>
                    <textarea
                      value={manualForm.businessDescription}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, businessDescription: e.target.value })
                      }
                      placeholder={t('proSignup.descriptionPlaceholder')}
                      required
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-qb-darker border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-qb-cyan focus:outline-none focus:ring-2 focus:ring-qb-cyan/30 resize-none"
                    />
                    <p className="text-white/40 text-xs mt-1 text-right">
                      {manualForm.businessDescription.length}/500
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-white font-bold mb-2">{t('proSignup.phoneLabel')}</label>
                    <Input
                      type="tel"
                      value={manualForm.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualForm({ ...manualForm, phone: e.target.value })
                      }
                      placeholder={t('proSignup.phonePlaceholder')}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="xl"
                    fullWidth
                    gradient
                    disabled={!isManualFormValid}
                    icon={<UserCheck />}
                  >
                    {t('proSignup.submitManual')}
                  </Button>
                </>
              ) : (
                /* ===== AUTOMATIC VERIFICATION FORM (existing) ===== */
                <>
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
                        placeholder={t('proSignup.businessNamePlaceholder')}
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
                </>
              )}
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
