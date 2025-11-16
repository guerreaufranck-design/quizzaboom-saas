import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const getStripe = () => stripePromise;

export interface CheckoutSessionParams {
  plan: string;
  type: 'b2b' | 'b2c';
  organizationId?: string;
  quizId?: string;
}

export const createCheckoutSession = async (
  params: CheckoutSessionParams
): Promise<string> => {
  // This will be implemented with your Stripe backend/edge function
  // For now, returning a placeholder
  console.log('Creating checkout session:', params);
  return '/checkout?session_id=placeholder';
};

export const createPortalSession = async (
  customerId: string
): Promise<string> => {
  // This will be implemented with your Stripe backend/edge function
  console.log('Creating portal session:', customerId);
  return '/billing-portal?session_id=placeholder';
};
