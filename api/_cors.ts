import type { VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  process.env.ALLOWED_ORIGIN || 'https://quizzaboom.com',
  'https://www.quizzaboom.com',
  'https://quizzaboom.app',
  'https://www.quizzaboom.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function setCorsHeaders(res: VercelResponse, origin?: string) {
  const requestOrigin = origin || '';
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
