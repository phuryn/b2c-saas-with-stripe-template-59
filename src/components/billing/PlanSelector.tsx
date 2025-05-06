
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  limits: string[];
  features: string[];
  recommended?: boolean;
  isFree?: boolean;
  isEnterprise?: boolean;
  emailLink?: string;
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
    subscription_end: string | null;
    payment_method?: {
      brand?: string;
      last4?: string;
      exp_month?: number;
      exp_year?: number;
    } | null;
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
      limits: ["20 links / month", "1 QR code / month"],
      features: ["30-days of click history", "Email support"],
      isFree: true,
    },
    {
      id: "standard",
      name: "Standard",
      monthlyPriceId: STRIPE_CONFIG.prices.standard.monthly,
      yearlyPriceId: STRIPE_CONFIG.prices.standard.yearly,
      description: "Great for professionals and small teams.",
      limits: ["200 links / month", "20 QR codes / month"],
      features: ["Everything in Free, plus:", "6-months of click history", "Bulk link & QR Code creation", "Priority support"],
      recommended: true,
    },
    {
      id: "premium",
      name: "Premium",
      monthlyPriceId: STRIPE_CONFIG.prices.premium.monthly,
      yearlyPriceId: STRIPE_CONFIG.prices.premium.yearly,
      description: "Full-featured solution for businesses.",
      limits: ["5000 links / month", "500 QR codes / month"],
      features: ["Everything in Standard, plus:", "2 years of click history", "City-level & device analytics", "API access"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthlyPriceId: "", // No direct price ID
      yearlyPriceId: "", // No direct price ID
      description: "Customized solution for large organizations.",
      limits: ["Custom number of QR codes and links"],
      features: ["Everything in Premium, plus:", "99.9% SLA uptime", "Dedicated customer success manager", "Customized onboarding & priority support"],
      isEnterprise: true,
      emailLink: "mailto:contact@trusty.com",
    }
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
    if (plan.isEnterprise) return "Custom";
    
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
    
    if (plan.isEnterprise && plan.emailLink) {
      window.location.href = plan.emailLink;
      return;
    }
    
    if (subscription?.subscribed) {
      onUpdateSubscription(plan.id);
    } else {
      onSubscribe(plan.id);
    }
  };
  
  const formatCardBrand = (brand?: string) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {subscription?.subscribed && subscription.subscription_end && subscription.payment_method && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            Your subscription will auto-renew on {formatDate(subscription.subscription_end)}. On that date, the {formatCardBrand(subscription.payment_method?.brand)} card 
            (ending in {subscription.payment_method?.last4}) will be charged.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Plan Details</h3>
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="relative">
            {plan.recommended && (
              <div className="absolute inset-x-0 -top-6 flex justify-center">
                <div className="bg-primary text-white px-3 py-1 text-xs font-medium rounded-t-md">
                  RECOMMENDED
                </div>
              </div>
            )}
            <Card 
              className={`overflow-hidden ${isPlanActive(plan.name) ? 'border-primary border-2' : ''} ${plan.recommended ? 'ring-1 ring-blue-500' : ''}`}
            >
              <CardHeader className={`pb-3 ${plan.recommended ? 'bg-blue-50' : ''}`}>
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold">{getPrice(plan)}</span>
                  {!plan.isFree && !plan.isEnterprise && (
                    <span className="text-gray-500 ml-1">{getPricePeriod()}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="pb-0">
                <ul className="space-y-3 border-b border-gray-100 pb-4">
                  {plan.limits.map((limit, index) => (
                    <li key={`limit-${index}`} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{limit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col items-start pt-4">
                <div className="w-full mb-4">
                  {!plan.isEnterprise ? (
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
                      ) : plan.isFree ? (
                        'Free Plan'
                      ) : subscription?.subscribed ? (
                        'Switch Plan'
                      ) : (
                        'Select Plan'
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => handlePlanAction(plan)}
                    >
                      Get a Quote
                    </Button>
                  )}
                </div>
                <ul className="space-y-3 w-full">
                  {plan.features.map((feature, index) => (
                    <li key={`feature-${index}`} className="flex items-start">
                      {feature.startsWith("Everything in") ? (
                        <span className="text-sm font-medium">{feature}</span>
                      ) : (
                        <>
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanSelector;
