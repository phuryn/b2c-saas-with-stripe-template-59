
import React from 'react';
import { Subscription } from '@/types/subscription';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/utils/pricing';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BillingDetailsDialog from './BillingDetailsDialog';

interface SubscriptionInfoProps {
  subscription: Subscription | null;
  onRenewSubscription?: () => Promise<boolean>;
  subscriptionLoading?: boolean;
}

const SubscriptionInfo: React.FC<SubscriptionInfoProps> = ({
  subscription,
  onRenewSubscription,
  subscriptionLoading = false,
}) => {
  // Function to get payment method display text
  const getPaymentMethodText = () => {
    const { payment_method } = subscription || {};
    
    if (!payment_method) return 'No payment method on file';
    
    const { brand, last4 } = payment_method;
    if (!brand || !last4) return 'No payment method on file';
    
    return `${brand.charAt(0).toUpperCase() + brand.slice(1)} ending in ${last4}`;
  };
  
  // Function to get subscription status text and color
  const getSubscriptionStatus = () => {
    if (!subscription) return { text: 'Unknown', colorClass: 'text-gray-500' };
    
    const isCanceling = subscription.cancel_at_period_end === true;
    if (isCanceling) {
      return { 
        text: 'Cancels at end of billing period', 
        colorClass: 'text-orange-600'
      };
    }
    
    return { 
      text: 'Active', 
      colorClass: 'text-green-600'
    };
  };

  if (!subscription) return null;
  
  const status = getSubscriptionStatus();
  const isSubscriptionCanceling = subscription.cancel_at_period_end === true;
  
  return (
    <Card className="mb-4 border border-muted">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Column */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Current Plan</h3>
            <p className="text-md font-semibold">
              {subscription.subscription_tier || 'Free'}
            </p>
            
            <h3 className="font-medium text-sm text-muted-foreground mt-4 mb-1">Status</h3>
            <p className={`text-md font-medium ${status.colorClass}`}>
              {status.text}
            </p>
            
            {subscription.subscription_end && (
              <>
                <h3 className="font-medium text-sm text-muted-foreground mt-4 mb-1">
                  {isSubscriptionCanceling ? 'Access Until' : 'Current Period Ends'}
                </h3>
                <p className="text-md">
                  {formatDate(subscription.subscription_end)}
                </p>
              </>
            )}
          </div>
          
          {/* Second Column */}
          <div className="flex flex-col justify-between items-start md:items-end">
            {/* Payment Method */}
            <div className="mb-4 md:text-right w-full">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Payment Method</h3>
              <p className="text-md">{getPaymentMethodText()}</p>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-2 justify-start md:justify-end w-full">
              {/* Only show the renew button when subscription is set to cancel */}
              {onRenewSubscription && isSubscriptionCanceling && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={subscriptionLoading}
                  onClick={onRenewSubscription}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  {subscriptionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Renew Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionInfo;
