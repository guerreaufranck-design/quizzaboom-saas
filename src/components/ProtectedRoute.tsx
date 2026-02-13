import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading, initialized } = useAuthStore();
  const location = useLocation();

  // Attendre que l'auth soit initialisée
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-qb-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-qb-cyan animate-spin mx-auto mb-4" />
          <p className="text-white/60">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Pas connecté → redirect vers /auth avec returnTo
  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
};
