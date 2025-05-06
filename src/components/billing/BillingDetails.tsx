
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, CreditCard } from 'lucide-react';
import { STRIPE_CONFIG } from '@/config/stripe';

interface BillingDetailsProps {
  subscription: {
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
    current_plan: string | null;
    payment_method?: {
      brand?: string;
      last4?: string;
      exp_month?: number;
      exp_year?: number;
    } | null;
  } | null;
  loading: boolean;
  onOpenCustomerPortal: () => void;
}

const BillingDetails: React.FC<BillingDetailsProps> = ({ 
  subscription, 
  loading, 
  onOpenCustomerPortal 
}) => {
  const formatCardBrand = (brand?: string) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatExpiryDate = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year % 100}`;
  };

  const renderActiveSubscription = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-md">Current Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Plan</h4>
              <p className="font-medium">{subscription?.subscription_tier}</p>
            </div>
            
            {subscription?.payment_method && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" /> Payment Method
                </h4>
                <p className="font-medium">
                  {formatCardBrand(subscription.payment_method?.brand)} •••• {subscription.payment_method?.last4}
                  {subscription.payment_method?.exp_month && (
                    <span className="text-sm text-gray-500 ml-1">
                      (Expires {formatExpiryDate(subscription.payment_method?.exp_month, subscription.payment_method?.exp_year)})
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {subscription?.subscription_end && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" /> Next Renewal
                </h4>
                <p className="font-medium">
                  {new Date(subscription.subscription_end).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={onOpenCustomerPortal}
              disabled={loading}
            >
              Update Payment Method
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderInactiveSubscription = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-md">Subscription Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">You currently don't have an active subscription.</p>
          <p className="text-sm text-gray-500">Choose a plan below to subscribe or access the customer portal for more options.</p>
          
          <Separator className="my-4" />
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={onOpenCustomerPortal}
              disabled={loading}
            >
              Access Customer Portal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 mb-8">
      <h3 className="text-lg font-medium">Your Billing Details</h3>
      {subscription?.subscribed ? renderActiveSubscription() : renderInactiveSubscription()}
    </div>
  );
};

export default BillingDetails;
