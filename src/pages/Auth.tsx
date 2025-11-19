import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Mail, Check } from 'lucide-react';
import { signInWithGoogle, signInWithMagicLink } from '../services/auth';

export const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      alert('Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithMagicLink(email);
      setMagicLinkSent(true);
    } catch (error: any) {
      console.error('Magic link error:', error);
      alert('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="text-3xl font-bold text-white mb-4">Check Your Email</h2>
          <p className="text-white/70 mb-6">
            We sent a magic link to <strong className="text-qb-cyan">{email}</strong>
          </p>
          <p className="text-white/60 text-sm mb-6">
            Click the link in the email to sign in. You can close this page.
          </p>
          <Button
            variant="ghost"
            onClick={() => setMagicLinkSent(false)}
          >
            Try another email
          </Button>
        </Card>
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
              onClick={() => window.location.href = '/'}
              icon={<ArrowLeft />}
            >
              Back to Home
            </Button>
          </div>

          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Welcome!</h1>
              <p className="text-white/70">Sign in to access your quizzes</p>
            </div>

            {/* Google Sign In */}
            <Button
              fullWidth
              size="xl"
              onClick={handleGoogleSignIn}
              loading={loading}
              disabled={loading}
              className="mb-6 bg-white text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-qb-darker text-white/60">Or</span>
              </div>
            </div>

            {/* Magic Link */}
            <form onSubmit={handleMagicLink}>
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Email Address
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
                Send Magic Link
              </Button>
            </form>

            <p className="text-center text-white/60 text-sm mt-6">
              For business accounts, please use your professional email
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
