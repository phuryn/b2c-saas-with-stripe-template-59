
import React from 'react';
import { Button } from '@/components/ui/button';
import { Subscription, PaymentMethod } from '@/types/subscription';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/pricing';

interface SubscriptionInfoProps {
  subscription: Subscription | null;
  onRenewSubscription?: () => Promise<boolean>;
  subscriptionLoading?: boolean;
}

const getFormattedCardInfo = (paymentMethod?: PaymentMethod | null) => {
  if (!paymentMethod) return null;
  const {
    brand,
    last4,
    exp_month,
    exp_year
  } = paymentMethod;
  if (!brand || !last4) return null;
  return {
    name: brand.charAt(0).toUpperCase() + brand.slice(1),
    last4,
    exp: exp_month && exp_year ? `${exp_month.toString().padStart(2, '0')}/${exp_year % 100}` : null
  };
};

const SubscriptionInfo: React.FC<SubscriptionInfoProps> = ({
  subscription,
  onRenewSubscription,
  subscriptionLoading = false
}) => {
  const isSubscriptionCanceling = subscription?.cancel_at_period_end === true;
  const cardInfo = getFormattedCardInfo(subscription?.payment_method);
  
  if (!subscription) return null;
  
  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-muted-foreground/20 mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {isSubscriptionCanceling ? (
            <p className="text-sm text-muted-foreground">
              Your subscription cancels on {formatDate(subscription.subscription_end)}.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your subscription will auto-renew on {formatDate(subscription.subscription_end)}.
              {cardInfo && ` On that date, the ${cardInfo.name} card (ending in ${cardInfo.last4}) will be charged.`}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {isSubscriptionCanceling && onRenewSubscription && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={onRenewSubscription} 
              disabled={subscriptionLoading} 
              className="shrink-0"
            >
              {subscriptionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Renew Subscription
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionInfo;
