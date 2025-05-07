
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { STRIPE_CONFIG } from '@/config/stripe';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

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
    current_plan: string | null;
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
  onRefreshSubscription?: () => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
  subscription,
  stripePrices,
  loading,
  onSubscribe,
  onUpdateSubscription,
  onRefreshSubscription
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    subscription?.current_plan?.includes('yearly') ? 'yearly' : 'monthly'
  );
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  
  const plans: PlanOption[] = [
    {
      id: "standard",
      name: "Standard",
      monthlyPriceId: STRIPE_CONFIG.prices.standard.monthly,
      yearlyPriceId: STRIPE_CONFIG.prices.standard.yearly,
      description: "Great for professionals and small teams.",
      limits: ["200 links / month", "20 QR codes / month"],
      features: ["Everything in Free, plus:", "6-months of click history", "Bulk link & QR Code creation", "Priority support"],
    },
    {
      id: "premium",
      name: "Premium",
      monthlyPriceId: STRIPE_CONFIG.prices.premium.monthly,
      yearlyPriceId: STRIPE_CONFIG.prices.premium.yearly,
      description: "Full-featured solution for businesses.",
      limits: ["5000 links / month", "500 QR codes / month"],
      features: ["Everything in Standard, plus:", "2 years of click history", "City-level & device analytics", "API access"],
      recommended: true,
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

  // Free plan details - used for displaying on paid plans or if user is on free plan
  const freePlan = {
    id: "free",
    name: "Free",
    monthlyPriceId: "", // No price ID for free plan
    yearlyPriceId: "", // No price ID for free plan
    description: "Basic functionality for personal use.",
    limits: ["20 links / month", "1 QR code / month"],
    features: ["30-days of click history", "Email support"],
    isFree: true,
  };

  const isPlanActive = (plan: PlanOption): boolean => {
    if (!subscription?.subscribed || !subscription.current_plan) return false;
    
    // Get the current price ID that would be active for this plan and billing period
    const currentPriceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;
    
    // Check if this exact price ID matches the user's current plan
    return subscription.current_plan === currentPriceId;
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
    if (plan.isEnterprise && plan.emailLink) {
      window.location.href = plan.emailLink;
      return;
    }

    const priceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;
    
    // If user is not subscribed, use the onSubscribe method to start a subscription
    if (!subscription?.subscribed) {
      onSubscribe(priceId);
      return;
    }
    
    // If this is the active plan, no action needed
    if (isPlanActive(plan)) {
      return;
    }
    
    // For existing subscribers trying to change plans, let's open the confirmation dialog
    setSelectedPlanId(priceId);
    setConfirmDialogOpen(true);
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

  const handlePlanChange = async () => {
    if (!selectedPlanId) return;
    
    try {
      setChangingPlan(true);
      
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { newPriceId: selectedPlanId }
      });
      
      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast.success("Subscription updated successfully!");
        
        // If the action was updating the subscription, or if there was no change needed
        if (data.subscription.action === "updated_subscription" || data.subscription.action === "no_change") {
          if (onRefreshSubscription) {
            onRefreshSubscription();
          }
        } 
        // If a new subscription was created and we need to collect payment details
        else if (data.subscription.action === "new_subscription" && data.subscription.client_secret) {
          // For now, we'll handle this by redirecting to the customer portal
          // In a future version, we could implement Stripe Elements to collect payment details directly
          window.location.href = STRIPE_CONFIG.customerPortalUrl;
          return;
        }
      } else {
        throw new Error("Failed to update subscription");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error updating subscription:", err);
      toast.error(`Failed to update subscription: ${errorMessage}`);
    } finally {
      setChangingPlan(false);
      setConfirmDialogOpen(false);
    }
  };

  const openCustomerPortal = () => {
    window.location.href = STRIPE_CONFIG.customerPortalUrl;
  };

  const getConfirmationPlanDetails = () => {
    if (!selectedPlanId) return { name: "", price: "" };
    
    // Find the plan that matches the selected price ID
    const selectedPlan = plans.find(plan => 
      plan.monthlyPriceId === selectedPlanId || plan.yearlyPriceId === selectedPlanId
    );
    
    if (!selectedPlan) return { name: "", price: "" };
    
    const price = stripePrices[selectedPlanId]?.unit_amount 
      ? formatCurrency(stripePrices[selectedPlanId].unit_amount) 
      : "Price not available";
    
    const period = selectedPlanId.includes("yearly") ? "yearly" : "monthly";
    
    return {
      name: selectedPlan.name,
      price: `${price}/${period === "yearly" ? "year" : "month"}`
    };
  };

  const planDetails = getConfirmationPlanDetails();

  return (
    <div className="space-y-6">
      {/* Subscription Status Message */}
      {subscription?.subscribed && subscription.subscription_end && subscription.payment_method && (
        <div className="rounded-lg p-4 mb-6 border border-blue-100 bg-blue-50/50">
          <p className="text-blue-800">
            Your subscription will auto-renew on {formatDate(subscription.subscription_end)}. On that date, the {formatCardBrand(subscription.payment_method?.brand)} card 
            (ending in {subscription.payment_method?.last4}) will be charged.
          </p>
        </div>
      )}

      {/* Free plan message */}
      {!subscription?.subscribed && (
        <div className="rounded-lg p-4 mb-6 border border-gray-100 bg-gray-50/50">
          <p>You're a free subscriber</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
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
      
      {/* Mobile-friendly plan grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isActive = isPlanActive(plan);
          
          return (
          <div key={plan.id} className="relative">
            {plan.recommended && (
              <div className="absolute inset-x-0 -top-6 flex justify-center">
                <div className="bg-primary text-white px-3 py-1 text-xs font-medium rounded-t-md">
                  RECOMMENDED
                </div>
              </div>
            )}
            <Card 
              className={`overflow-hidden ${isActive ? 'border-primary border-2' : ''} ${plan.recommended ? 'ring-1 ring-blue-500' : ''}`}
            >
              <CardHeader className={plan.recommended ? '' : ''}>
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
                      variant={isActive ? "outline" : "default"}
                      disabled={isActive || loading || changingPlan}
                      onClick={() => handlePlanAction(plan)}
                    >
                      {loading || changingPlan ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
                      ) : isActive ? (
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
        )})}
      </div>

      {/* Free plan downgrade option when on paid plan */}
      {subscription?.subscribed && (
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-base font-medium mb-3">Other Options</h4>
          <Button 
            variant="outline" 
            className="text-gray-600"
            onClick={openCustomerPortal}
          >
            Downgrade to Free Plan
          </Button>
          <div className="mt-3">
            <p className="text-sm text-gray-500">
              Free plan includes:
            </p>
            <ul className="space-y-1 mt-2">
              {freePlan.limits.concat(freePlan.features).map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Subscription Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to switch to the {planDetails.name} plan at {planDetails.price}.
              {subscription?.subscribed ? 
                " Your subscription will be updated immediately with a prorated charge." : 
                " You'll be asked to enter your payment details to complete this subscription."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingPlan}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePlanChange}
              disabled={changingPlan}
            >
              {changingPlan ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                'Confirm Change'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlanSelector;
