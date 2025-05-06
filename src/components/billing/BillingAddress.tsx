
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STRIPE_CONFIG } from '@/config/stripe';

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

const BillingAddress: React.FC<BillingAddressProps> = ({ subscription }) => {
  const openCustomerPortal = () => {
    window.open(STRIPE_CONFIG.customerPortalUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Billing Address</h3>
      
      <Card>
        <CardContent className="pt-6">
          {subscription?.subscribed && subscription?.billing_address ? (
            <div className="space-y-2">
              <p>{subscription.billing_address.line1}</p>
              {subscription.billing_address.line2 && <p>{subscription.billing_address.line2}</p>}
              <p>
                {subscription.billing_address.city}, {subscription.billing_address.state} {subscription.billing_address.postal_code}
              </p>
              <p>{subscription.billing_address.country}</p>
              
              <div className="mt-4">
                <Button variant="outline" onClick={openCustomerPortal}>
                  Edit Billing Address
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No billing address on file.</p>
              {subscription?.subscribed && (
                <Button variant="outline" onClick={openCustomerPortal}>
                  Add Billing Address
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingAddress;
