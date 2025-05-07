
import React, { useState, forwardRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

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
      tax_id?: string;
      name?: string;
    } | null;
  } | null;
}

const BillingAddress = forwardRef<HTMLDivElement, BillingAddressProps>(({ subscription: initialSubscription }, ref) => {
  const [subscription, setSubscription] = useState(initialSubscription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Debug logging for tax ID
  useEffect(() => {
    if (subscription?.billing_address) {
      console.log('Tax ID in billing address:', subscription.billing_address.tax_id);
      console.log('Customer name in billing address:', subscription.billing_address.name);
    }
  }, [subscription]);

  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Error opening customer portal:', error);
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error('No portal URL returned:', data);
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

  // Hide the component if the user doesn't have an active subscription
  if (!subscription?.subscribed) {
    return null;
  }

  // Log the billing address to see what we're getting from Supabase
  console.log('Billing address data:', subscription?.billing_address);

  return (
    <div className="space-y-4" ref={ref}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Billing Information</h3>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-2">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-red-500 mb-4">{error}</p>
            </div>
          ) : subscription?.billing_address ? (
            <div className="space-y-4">
              {/* Customer Name (if available) */}
              {subscription.billing_address.name && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Customer</span>
                  </div>
                  <p className="font-medium">{subscription.billing_address.name}</p>
                </div>
              )}
              
              {/* Address Section */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">Address</span>
                </div>
                <p>{subscription.billing_address.line1}</p>
                {subscription.billing_address.line2 && <p>{subscription.billing_address.line2}</p>}
                <p>
                  {subscription.billing_address.city}, {subscription.billing_address.state} {subscription.billing_address.postal_code}
                </p>
                <p>{subscription.billing_address.country}</p>
              </div>
              
              {/* Tax ID (if available) - with separator */}
              {subscription.billing_address.tax_id && (
                <>
                  <Separator />
                  <div className="space-y-1 pt-1">
                    <p className="text-sm font-medium">Tax ID: <span className="font-normal">{subscription.billing_address.tax_id}</span></p>
                  </div>
                </>
              )}
              
              <div className="mt-4 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={openCustomerPortal} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Edit Billing Information
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No billing information on file.</p>
              <Button variant="outline" onClick={openCustomerPortal} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Billing Information
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

BillingAddress.displayName = 'BillingAddress';

export default BillingAddress;
