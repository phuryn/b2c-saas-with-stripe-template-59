
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
  }> = {}
): string => {
  if (priceId === 'free') return 'Free';
  if (priceId === 'enterprise') return 'Custom';
  
  const price = priceData[priceId];
  if (!price) {
    // Fallback prices if Stripe data isn't loaded
    if (priceId.includes('standard')) {
      return cycle === 'monthly' ? '$29/month' : '$290/year';
    } else if (priceId.includes('premium')) {
      return cycle === 'monthly' ? '$79/month' : '$790/year';
    }
    return 'Contact us';
  }

  const amount = price.unit_amount / 100;
  const currency = price.currency.toUpperCase();
  const interval = cycle;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount) + `/${interval}`;
};
