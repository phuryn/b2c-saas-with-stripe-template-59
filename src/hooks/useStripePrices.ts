
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STRIPE_CONFIG } from '@/config/stripe';
import { StripePrice } from '@/types/subscription';

export function useStripePrices() {
  const [stripePrices, setStripePrices] = useState<Record<string, StripePrice>>({});
  const [loading, setLoading] = useState(true);

  const fetchStripePrices = async () => {
    try {
      setLoading(true);
      // Collect all price IDs
      const priceIds = [
        STRIPE_CONFIG.prices.standard.monthly,
        STRIPE_CONFIG.prices.standard.yearly,
        STRIPE_CONFIG.prices.premium.monthly,
        STRIPE_CONFIG.prices.premium.yearly
      ];
      
      const { data, error } = await supabase.functions.invoke('get-prices', {
        body: { priceIds: priceIds.join(',') }
      });
      
      if (error) throw new Error(error.message);
      
      // Create a map of price IDs to price data
      const priceMap: Record<string, StripePrice> = {};
      data.prices.forEach((price: StripePrice) => {
        priceMap[price.id] = price;
      });
      
      setStripePrices(priceMap);
      return priceMap;
    } catch (err) {
      console.error('Error fetching prices from Stripe:', err);
      toast.error('Failed to fetch pricing information from Stripe.');
      return {};
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStripePrices();
  }, []);

  return {
    stripePrices,
    loading,
    fetchStripePrices
  };
}
