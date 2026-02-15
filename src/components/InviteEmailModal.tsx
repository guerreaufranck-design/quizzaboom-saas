import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Mail, Calendar, Clock, Send, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface InviteEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  contactCount: number;
}

type ModalState = 'form' | 'paying' | 'sending' | 'sent' | 'error';

export const InviteEmailModal: React.FC<InviteEmailModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  contactCount,
}) => {
  const { t } = useTranslation();
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [state, setState] = useState<ModalState>('form');
  const [sendResults, setSendResults] = useState<{ sent: number; failed: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendAndPay = async () => {
    if (!eventDate || !eventTime) return;

    setState('paying');

    try {
      const priceId = import.meta.env.VITE_STRIPE_PRICE_INVITE_EMAIL;

      if (!priceId) {
        // If no Stripe price configured, send directly (for dev/testing)
        setState('sending');
        const res = await fetch('/api/send-invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId, eventDate, eventTime }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send');
        setSendResults(data.results);
        setState('sent');
        return;
      }

      // Create Stripe checkout session
      const successUrl = `${window.location.origin}/pro-dashboard?invite=success&orgId=${organizationId}&date=${encodeURIComponent(eventDate)}&time=${encodeURIComponent(eventTime)}`;
      const cancelUrl = `${window.location.origin}/pro-dashboard?invite=cancelled`;

      const checkoutRes = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          planName: 'invite_email',
          userId: '',
          successUrl,
          cancelUrl,
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || 'Failed to create checkout');
      }

      // Redirect to Stripe
      window.location.href = checkoutData.url;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setState('error');
    }
  };

  const handleClose = () => {
    setState('form');
    setEventDate('');
    setEventTime('');
    setSendResults(null);
    setErrorMessage('');
    onClose();
  };

  // Format date for preview
  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('proDashboard.inviteModalTitle')} size="lg">
      {state === 'sent' ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">{t('proDashboard.inviteSent')}</h3>
          <p className="text-white/60">
            {t('proDashboard.inviteSentDesc', {
              sent: sendResults?.sent || 0,
              failed: sendResults?.failed || 0,
            })}
          </p>
          <Button gradient className="mt-6" onClick={handleClose}>
            {t('common.close')}
          </Button>
        </div>
      ) : state === 'error' ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">{t('proDashboard.inviteError')}</h3>
          <p className="text-white/60 mb-4">{errorMessage}</p>
          <Button variant="secondary" onClick={() => setState('form')}>
            {t('common.back')}
          </Button>
        </div>
      ) : state === 'paying' || state === 'sending' ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-qb-cyan animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">
            {state === 'paying' ? t('proDashboard.invitePaying') : t('proDashboard.inviteSending')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Date & Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t('proDashboard.inviteDate')}
              </label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                {t('proDashboard.inviteTime')}
              </label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>
          </div>

          {/* Email Preview */}
          {eventDate && eventTime && (
            <div className="bg-qb-darker rounded-xl p-4 border border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">{t('proDashboard.invitePreview')}</p>
              <div className="bg-[#1a1a2e] rounded-lg p-4 space-y-2">
                <p className="text-white/50 text-sm">
                  <strong className="text-white/70">{t('proDashboard.inviteSubjectLabel')}:</strong>{' '}
                  🎯 {organizationName} {t('proDashboard.inviteSubjectPreview')}
                </p>
                <hr className="border-white/10" />
                <p className="text-white text-sm">
                  {organizationName} {t('proDashboard.inviteBodyPreview')}
                </p>
                <p className="text-qb-cyan font-bold">
                  📅 {formattedDate}
                </p>
                <p className="text-qb-cyan font-bold">
                  🕐 {eventTime}
                </p>
              </div>
            </div>
          )}

          {/* Summary & CTA */}
          <div className="flex items-center justify-between p-4 bg-qb-purple/10 border border-qb-purple/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-qb-purple" />
              <span className="text-white">
                {t('proDashboard.inviteSendTo', { count: contactCount })}
              </span>
            </div>
            <span className="text-qb-yellow font-bold text-lg">$1.99</span>
          </div>

          <Button
            fullWidth
            gradient
            size="lg"
            icon={<Send />}
            onClick={handleSendAndPay}
            disabled={!eventDate || !eventTime}
          >
            {t('proDashboard.inviteSendAndPay')}
          </Button>
        </div>
      )}
    </Modal>
  );
};
