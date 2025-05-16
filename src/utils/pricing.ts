import { Plan } from "@/config/plans";

/**
 * Formats a date for display in a consistent format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

/**
 * Formats a price for display based on price data and cycle
 */
export const formatPrice = (
  priceId: string, 
  cycle: 'monthly' | 'yearly',
  priceData: Record<string, {
    id: string;
    unit_amount: number;
    currency: string;
    interval?: string;
  }> = {},
  plansData?: Plan[]
): string => {
  if (priceId === 'free') return '$0/month';
  if (priceId === 'enterprise') return 'Custom';
  
  // First try to get price from the plans configuration
  if (plansData) {
    const plan = plansData.find(p => p.priceId === priceId);
    if (plan?.price) {
      const amount = cycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
      const currency = plan.price.currency || 'USD';
      const interval = cycle === 'monthly' ? 'month' : 'year';

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount) + `/${interval}`;
    }
  }
  
  // Fallback to Stripe price data
  const price = priceData[priceId];
  if (!price) {
    // Fallback prices if Stripe data isn't loaded
    if (priceId.includes('standard')) {
      return cycle === 'monthly' ? '$10/month' : '$100/year';
    } else if (priceId.includes('premium')) {
      return cycle === 'monthly' ? '$20/month' : '$200/year';
    }
    return 'Contact us';
  }

  const amount = price.unit_amount / 100;
  const currency = price.currency.toUpperCase();
  const interval = cycle === 'monthly' ? 'month' : 'year';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount) + `/${interval}`;
};
