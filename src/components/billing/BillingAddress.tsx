
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface BillingAddressProps {
  subscription: {
    subscribed: boolean;
    billing_address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    } | null;
  } | null;
}

const BillingAddress: React.FC<BillingAddressProps> = ({ subscription: initialSubscription }) => {
  const [subscription, setSubscription] = useState(initialSubscription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSubscription(data);
      toast({
        description: "Billing address information updated.",
      });
    } catch (err) {
      console.error('Error refreshing subscription data:', err);
      setError('Failed to refresh billing information');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update billing address information',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw new Error(error.message);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open customer portal',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!subscription?.subscribed) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Billing Address</h3>
        {!loading && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshSubscriptionData}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={refreshSubscriptionData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </div>
          ) : subscription?.billing_address ? (
            <div className="space-y-2">
              <p>{subscription.billing_address.line1}</p>
              {subscription.billing_address.line2 && <p>{subscription.billing_address.line2}</p>}
              <p>
                {subscription.billing_address.city}, {subscription.billing_address.state} {subscription.billing_address.postal_code}
              </p>
              <p>{subscription.billing_address.country}</p>
              
              <div className="mt-4">
                <Button variant="outline" onClick={openCustomerPortal} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Edit Billing Address
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No billing address on file.</p>
              <Button variant="outline" onClick={openCustomerPortal} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Billing Address
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingAddress;
