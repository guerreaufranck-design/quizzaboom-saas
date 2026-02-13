import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Mail, Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { signInWithGoogle, signInWithMagicLink, signUpWithPassword, signInWithPassword, resetPassword } from '../services/auth';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../services/supabase/client';

type AuthMode = 'login' | 'signup' | 'forgot';

export const Auth: React.FC = () => {
  const { t } = useTranslation();
  const routerNavigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authError, setAuthError] = useState('');
  const hasNavigated = useRef(false);

  const returnTo = searchParams.get('returnTo');

  // Smart routing after login (OAuth callback or magic link return)
  useEffect(() => {
    if (!user || hasNavigated.current) return;
    hasNavigated.current = true;

    // If returnTo is specified, go there directly
    if (returnTo) {
      routerNavigate(decodeURIComponent(returnTo), { replace: true });
      return;
    }

    // Smart routing: determine where to send the user
    const routeUser = async () => {
      try {
        // Check if user has an organization (B2B)
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (membership) {
          routerNavigate('/pro-dashboard', { replace: true });
          return;
        }

        // Check if user has any B2C purchases
        const { count } = await supabase
          .from('user_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (count && count > 0) {
          routerNavigate('/dashboard', { replace: true });
          return;
        }

        // New user with no purchases and no org → pricing
        routerNavigate('/pricing', { replace: true });
      } catch {
        // Fallback to pricing on error
        routerNavigate('/pricing', { replace: true });
      }
    };

    routeUser();
  }, [user, returnTo, routerNavigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError('');
    try {
      await signInWithGoogle(returnTo || undefined);
    } catch (error) {
      console.error('Google sign in error:', error);
      setAuthError(t('auth.errorGeneric'));
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      await signInWithMagicLink(email, returnTo || undefined);
      setMagicLinkSent(true);
    } catch (error) {
      console.error('Magic link error:', error);
      setAuthError(t('auth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) {
          setAuthError(t('auth.passwordMismatch'));
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setAuthError(t('auth.passwordTooShort'));
          setLoading(false);
          return;
        }
        await signUpWithPassword(email, password, returnTo || undefined);
        // Supabase sends a confirmation email
        setMagicLinkSent(true);
      } else {
        await signInWithPassword(email, password);
      }
    } catch (error: unknown) {
      console.error('Password auth error:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Invalid login credentials')) {
        setAuthError(t('auth.invalidCredentials'));
      } else if (msg.includes('User already registered')) {
        setAuthError(t('auth.alreadyRegistered'));
      } else if (msg.includes('Email not confirmed')) {
        setAuthError(t('auth.emailNotConfirmed'));
      } else {
        setAuthError(t('auth.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      await resetPassword(email, returnTo || undefined);
      setResetSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
      setAuthError(t('auth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  // Magic link / signup confirmation sent
  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-6">{authMode === 'signup' ? '✅' : '📧'}</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {authMode === 'signup' ? t('auth.confirmEmail') : t('auth.checkEmail')}
          </h2>
          <p className="text-white/70 mb-6">
            {authMode === 'signup' ? t('auth.confirmEmailSent') : t('auth.magicLinkSent')}{' '}
            <strong className="text-qb-cyan">{email}</strong>
          </p>
          <p className="text-white/60 text-sm mb-6">
            {t('auth.closePageHint')}
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setMagicLinkSent(false);
              setAuthMode('login');
            }}
          >
            {t('auth.tryAnother')}
          </Button>
        </Card>
      </div>
    );
  }

  // Password reset sent
  if (resetSent) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-6">🔑</div>
          <h2 className="text-3xl font-bold text-white mb-4">{t('auth.resetSent')}</h2>
          <p className="text-white/70 mb-6">
            {t('auth.resetSentDesc')}{' '}
            <strong className="text-qb-cyan">{email}</strong>
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setResetSent(false);
              setAuthMode('login');
            }}
          >
            {t('auth.backToLogin')}
          </Button>
        </Card>
      </div>
    );
  }

  // Forgot password form
  if (authMode === 'forgot') {
    return (
      <div className="min-h-screen bg-qb-dark py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => setAuthMode('login')}
                icon={<ArrowLeft />}
              >
                {t('auth.backToLogin')}
              </Button>
            </div>

            <Card className="p-8">
              <div className="text-center mb-8">
                <KeyRound className="w-16 h-16 text-qb-yellow mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">{t('auth.forgotPassword')}</h1>
                <p className="text-white/70">{t('auth.forgotDesc')}</p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{authError}</p>
                </div>
              )}

              <form onSubmit={handleForgotPassword}>
                <div className="mb-6">
                  <label className="block text-white font-medium mb-2">
                    {t('auth.emailAddress')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-qb-cyan"
                  />
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="xl"
                  gradient
                  loading={loading}
                  disabled={loading || !email}
                  icon={<Mail />}
                >
                  {t('auth.sendResetLink')}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => routerNavigate('/')}
              icon={<ArrowLeft />}
            >
              {t('common.backToHome')}
            </Button>
          </div>

          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">{t('auth.welcome')}</h1>
              <p className="text-white/70">
                {returnTo ? t('auth.loginRequired') : t('auth.signInAccess')}
              </p>
            </div>

            {/* Login / Signup tabs */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  authMode === 'login'
                    ? 'bg-qb-cyan text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  authMode === 'signup'
                    ? 'bg-qb-purple text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {t('auth.signup')}
              </button>
            </div>

            {/* Google Sign In */}
            <Button
              fullWidth
              size="xl"
              onClick={handleGoogleSignIn}
              loading={loading}
              disabled={loading}
              className="mb-4 bg-white text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.continueGoogle')}
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-qb-darker text-white/60">{t('common.or')}</span>
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{authError}</p>
              </div>
            )}

            {/* Email + Password form */}
            <form onSubmit={handlePasswordAuth} className="mb-4">
              <div className="mb-4">
                <label className="block text-white font-medium mb-2">
                  {t('auth.emailAddress')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-qb-cyan"
                />
              </div>

              <div className="mb-4">
                <label className="block text-white font-medium mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-qb-cyan"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="mb-4">
                  <label className="block text-white font-medium mb-2">
                    {t('auth.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-qb-cyan"
                    />
                  </div>
                </div>
              )}

              {authMode === 'login' && (
                <div className="text-right mb-4">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setAuthError(''); }}
                    className="text-sm text-qb-cyan hover:text-qb-cyan/80 transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                size="xl"
                gradient
                loading={loading}
                disabled={loading || !email || !password}
                icon={authMode === 'signup' ? <Mail /> : <Lock />}
              >
                {authMode === 'signup' ? t('auth.createAccount') : t('auth.signInPassword')}
              </Button>
            </form>

            {/* Magic Link alternative */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-qb-darker text-white/60">{t('auth.orMagicLink')}</span>
              </div>
            </div>

            <form onSubmit={handleMagicLink}>
              <Button
                type="submit"
                fullWidth
                size="lg"
                variant="ghost"
                loading={loading}
                disabled={loading || !email}
                icon={<Mail />}
              >
                {t('auth.sendMagicLink')}
              </Button>
            </form>

            <p className="text-center text-white/60 text-sm mt-6">
              {t('auth.businessHint')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
