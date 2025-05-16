
import { STRIPE_CONFIG } from '@/config/stripe';

export interface Plan {
  id: string;
  name: string;
  priceId: string;
  description: string;
  limits: string[];
  features: string[];
  recommended?: boolean;
  buttonText?: string;
  free?: boolean;
  showUpgrade?: boolean;
  price?: {
    monthly: number;
    yearly: number;
    currency: string;
  };
}

/**
 * Gets the plans configuration based on the selected billing cycle
 */
export const getPlans = (cycle: 'monthly' | 'yearly'): Plan[] => {
  return [
    {
      id: 'free',
      name: 'Free',
      priceId: 'free',
      description: 'Basic functionality for personal use.',
      limits: [
        '20 links / month',
        '1 QR code / month',
      ],
      features: [
        'Includes:',
        '30-days of click history',
        'Email support',
      ],
      buttonText: 'Sign Up Free',
      free: true,
      showUpgrade: true,
      price: {
        monthly: 0,
        yearly: 0,
        currency: 'USD'
      }
    },
    {
      id: 'standard',
      name: 'Standard',
      priceId: cycle === 'monthly' ? STRIPE_CONFIG.prices.standard.monthly : STRIPE_CONFIG.prices.standard.yearly,
      description: 'Great for professionals and small teams.',
      limits: [
        '200 links / month',
        '20 QR codes / month',
      ],
      features: [
        'Everything in Free, plus:',
        '6-months of click history',
        'Bulk link & QR Code creation',
        'Priority support',
      ],
      showUpgrade: true,
      price: {
        monthly: 10,
        yearly: 100,
        currency: 'USD'
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      priceId: cycle === 'monthly' ? STRIPE_CONFIG.prices.premium.monthly : STRIPE_CONFIG.prices.premium.yearly,
      description: 'For growing teams with advanced needs.',
      limits: [
        '5000 links / month',
        '500 QR codes / month',
      ],
      features: [
        'Everything in Standard, plus:',
        '2 years of click history',
        'City-level & device analytics',
        'API access',
      ],
      // Only recommend Premium annual plan
      recommended: cycle === 'yearly',
      showUpgrade: true,
      price: {
        monthly: 20,
        yearly: 200,
        currency: 'USD'
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceId: 'enterprise',
      description: 'For large organizations with special needs.',
      limits: [
        'Custom number of links',
        'Custom number of QR codes',
      ],
      features: [
        'Everything in Premium, plus:',
        '99.9% SLA uptime',
        'Dedicated customer success manager',
        'Customized onboarding & priority support',
      ],
      buttonText: 'Get a Quote',
      showUpgrade: false,
    }
  ];
};
