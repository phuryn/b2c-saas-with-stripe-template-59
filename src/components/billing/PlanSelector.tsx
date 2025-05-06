
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { STRIPE_CONFIG } from '@/config/stripe';

interface PlanOption {
  id: string;
  name: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  description: string;
  features: string[];
  popular?: boolean;
  isFree?: boolean;
}

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  interval?: string;
}

interface PlanSelectorProps {
  subscription: {
    subscribed: boolean;
    subscription_tier: string | null;
  } | null;
  stripePrices: Record<string, StripePrice>;
  loading: boolean;
  onSubscribe: (planId: string) => void;
  onUpdateSubscription: (planId: string) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
  subscription,
  stripePrices,
  loading,
  onSubscribe,
  onUpdateSubscription
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  const plans: PlanOption[] = [
    {
      id: "free",
      name: "Free",
      monthlyPriceId: "", // No price ID for free plan
      yearlyPriceId: "", // No price ID for free plan
      description: "Basic functionality for personal use.",
      features: ["1 project", "5 links", "Basic analytics", "Email support"],
      isFree: true,
    },
    {
      id: "standard",
      name: "Standard",
      monthlyPriceId: STRIPE_CONFIG.prices.standard.monthly,
      yearlyPriceId: STRIPE_CONFIG.prices.standard.yearly,
      description: "Great for professionals and small teams.",
      features: ["10 projects", "Unlimited links", "Advanced analytics", "Priority support", "API access"],
      popular: true, // Marking Standard as the most commonly chosen plan
    },
    {
      id: "premium",
      name: "Premium",
      monthlyPriceId: STRIPE_CONFIG.prices.premium.monthly,
      yearlyPriceId: STRIPE_CONFIG.prices.premium.yearly,
      description: "Full-featured solution for businesses.",
      features: ["Unlimited projects", "Unlimited links", "Custom analytics", "24/7 support", "API access", "White-labeling", "Custom integrations"],
    },
  ];

  const isPlanActive = (planName: string): boolean => {
    if (!subscription?.subscribed) return planName === "Free";
    return subscription.subscription_tier === planName;
  };

  const formatCurrency = (amount: number | undefined, currency: string = 'usd'): string => {
    if (amount === undefined) return '$0';
    
    // Convert cents to dollars
    const dollars = amount / 100;
    
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency.toUpperCase(),
      minimumFractionDigits: dollars % 1 === 0 ? 0 : 2
    }).format(dollars);
  };

  const getPrice = (plan: PlanOption): string => {
    if (plan.isFree) return "$0";
    
    const priceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;
    const price = stripePrices[priceId];
    
    if (!price) {
      return billingPeriod === 'monthly' ? '$9' : '$90'; // Fallback
    }
    
    return formatCurrency(price.unit_amount, price.currency);
  };

  const getPricePeriod = (): string => {
    return billingPeriod === 'monthly' ? '/month' : '/year';
  };

  const handlePlanAction = (plan: PlanOption) => {
    if (isPlanActive(plan.name)) return; // Already on this plan
    
    if (subscription?.subscribed) {
      onUpdateSubscription(plan.id);
    } else {
      onSubscribe(plan.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Available Plans</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="billing-period" className={`text-sm ${billingPeriod === 'monthly' ? 'font-medium' : ''}`}>
            Monthly
          </Label>
          <Switch 
            id="billing-period" 
            checked={billingPeriod === 'yearly'}
            onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
          />
          <Label htmlFor="billing-period" className={`text-sm ${billingPeriod === 'yearly' ? 'font-medium' : ''}`}>
            Yearly <span className="text-green-600 font-medium">(Save 16%)</span>
          </Label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`overflow-hidden ${isPlanActive(plan.name) ? 'border-primary-blue border-2' : ''}`}
          >
            {plan.popular && (
              <div className="bg-primary text-white px-3 py-1 text-xs font-medium absolute right-0 top-0 rounded-bl-md">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription className="flex items-baseline mt-2">
                <span className="text-3xl font-bold">{getPrice(plan)}</span>
                {!plan.isFree && (
                  <span className="text-gray-500 ml-1">{getPricePeriod()}</span>
                )}
              </CardDescription>
              <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {!plan.isFree ? (
                <Button
                  className="w-full"
                  variant={isPlanActive(plan.name) ? "outline" : "default"}
                  disabled={isPlanActive(plan.name) || loading}
                  onClick={() => handlePlanAction(plan)}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
                  ) : isPlanActive(plan.name) ? (
                    'Current Plan'
                  ) : subscription?.subscribed ? (
                    'Switch Plan'
                  ) : (
                    'Select Plan'
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={isPlanActive("Free") ? "outline" : "default"}
                  disabled={isPlanActive("Free") || loading}
                >
                  {isPlanActive("Free") ? 'Current Plan' : 'Free Plan'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlanSelector;
