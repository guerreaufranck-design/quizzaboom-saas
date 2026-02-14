import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

const VIEW_TO_PATH: Record<string, string> = {
  home: '/',
  pricing: '/pricing',
  auth: '/auth',
  dashboard: '/dashboard',
  create: '/create',
  join: '/join',
  lobby: '/lobby',
  playing: '/play',
  results: '/results',
  'pro-signup': '/pro-signup',
  'pro-dashboard': '/pro-dashboard',
  settings: '/settings',
  tutorial: '/tutorial',
  guide: '/',
  offer: '/offer',
};

export function useAppNavigate() {
  const navigate = useNavigate();

  const appNavigate = useCallback(
    (view: string) => {
      const path = VIEW_TO_PATH[view] || '/';
      navigate(path);
    },
    [navigate]
  );

  return appNavigate;
}
