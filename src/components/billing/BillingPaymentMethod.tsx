
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface BillingPaymentMethodProps {
  subscription: {
    subscribed: boolean;
    payment_method?: {
      brand?: string;
      last4?: string;
      exp_month?: number;
      exp_year?: number;
    } | null;
  } | null;
}

const BillingPaymentMethod = ({ subscription }: BillingPaymentMethodProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Format card brand (capitalize first letter)
  const formatCardBrand = (brand?: string) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  // Format card expiry date as MM/YY
  const formatExpiryDate = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year % 100}`;
  };

  // Get card icon based on brand
  const getCardIcon = (brand?: string) => {
    if (brand === 'visa') {
      return <img src="/visa.svg" alt="Visa" className="h-12 w-auto" />;
    } else if (brand === 'mastercard') {
      return <img src="/mastercard.svg" alt="Mastercard" className="h-12 w-auto" />;
    } else {
      return <CreditCard className="h-12 w-12 text-gray-500" />;
    }
  };

  const openPaymentMethodPortal = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { flow: 'payment_method_update' }
      });
      
      if (error) throw new Error(error.message);
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      console.error('Error opening payment method portal:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open payment management portal',
      });
    } finally {
      setLoading(false);
    }
  };

  // Hide the component if the user doesn't have an active subscription
  if (!subscription?.subscribed) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Method</h3>
      
      <Card>
        <CardContent className="pt-6">
          {subscription?.payment_method ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getCardIcon(subscription.payment_method.brand)}
                <div>
                  <p className="font-medium">
                    {formatCardBrand(subscription.payment_method.brand)} •••• {subscription.payment_method.last4}
                  </p>
                  {subscription.payment_method.exp_month && subscription.payment_method.exp_year && (
                    <p className="text-sm text-gray-500">
                      Expires {formatExpiryDate(subscription.payment_method.exp_month, subscription.payment_method.exp_year)}
                    </p>
                  )}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={openPaymentMethodPortal} 
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Manage Payment Method
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No payment method on file.</p>
              <Button 
                variant="outline" 
                onClick={openPaymentMethodPortal} 
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPaymentMethod;
