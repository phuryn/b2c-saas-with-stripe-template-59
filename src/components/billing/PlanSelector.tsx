
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { STRIPE_CONFIG } from '@/config/stripe';

interface Tab {
  id: string;
  label: string;
}

interface BillingCycle {
  id: 'monthly' | 'yearly';
  label: string;
}

interface Plan {
  id: string;
  name: string;
  priceId: string;
  description: string;
  limits: string[];
  features: string[];
  recommended?: boolean;
  buttonText?: string;
  free?: boolean;
}

interface PlanSelectorProps {
  currentPlan?: string | null;
  isLoading?: boolean;
  cycle?: 'monthly' | 'yearly';
  onSelect: (planId: string, cycle: 'monthly' | 'yearly') => void;
  priceData?: Record<string, {
    id: string;
    unit_amount: number;
    currency: string;
    interval?: string;
  }>;
  showDowngrade?: boolean;
  onDowngrade?: () => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  currentPlan, 
  isLoading, 
  cycle = 'monthly', 
  onSelect,
  priceData = {},
  showDowngrade = false,
  onDowngrade
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>(cycle);

  const billingCycles: BillingCycle[] = [
    {
      id: 'monthly',
      label: 'Monthly',
    },
    {
      id: 'yearly',
      label: 'Yearly',
    },
  ];

  const tabs: Tab[] = billingCycles.map((cycle) => ({
    id: cycle.id,
    label: cycle.label,
  }));

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      priceId: 'free',
      description: 'Basic functionality for personal use.',
      limits: [
        '20 links / month',
        '1 QR code / month',
      ],
      features: [
        '30-days of click history',
        'Email support',
      ],
      free: true,
      buttonText: 'Current Plan'
    },
    {
      id: 'standard',
      name: 'Standard',
      priceId: selectedCycle === 'monthly' ? STRIPE_CONFIG.prices.standard.monthly : STRIPE_CONFIG.prices.standard.yearly,
      description: 'Great for professionals and small teams.',
      limits: [
        '200 links / month',
        '20 QR codes / month',
      ],
      features: [
        'Everything in Free, plus:',
        '6-months of click history',
        'Bulk link & QR Code creation',
        'Priority support',
      ],
      recommended: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      priceId: selectedCycle === 'monthly' ? STRIPE_CONFIG.prices.premium.monthly : STRIPE_CONFIG.prices.premium.yearly,
      description: 'For growing teams with advanced needs.',
      limits: [
        '5000 links / month',
        '500 QR codes / month',
      ],
      features: [
        'Everything in Standard, plus:',
        '2 years of click history',
        'City-level & device analytics',
        'API access',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceId: 'enterprise',
      description: 'For large organizations and complex needs.',
      limits: [
        'Custom number of QR codes and links',
      ],
      features: [
        'Everything in Premium, plus:',
        '99.9% SLA uptime',
        'Dedicated customer success manager',
        'Customized onboarding & priority support',
      ],
      buttonText: 'Get a Quote',
    }
  ];

  const formatPrice = (priceId: string): string => {
    if (priceId === 'free') return 'Free';
    if (priceId === 'enterprise') return 'Custom';
    
    const price = priceData[priceId];
    if (!price) {
      // Fallback prices if Stripe data isn't loaded
      if (priceId.includes('standard')) {
        return selectedCycle === 'monthly' ? '$29/month' : '$290/year';
      } else if (priceId.includes('premium')) {
        return selectedCycle === 'monthly' ? '$79/month' : '$790/year';
      }
      return 'Contact us';
    }

    const amount = price.unit_amount / 100;
    const currency = price.currency.toUpperCase();
    const interval = selectedCycle;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount) + `/${interval}`;
  };

  const renderFeature = (feature: string) => (
    <li key={feature} className="flex items-start gap-2">
      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
      <span>{feature}</span>
    </li>
  );

  const renderLimits = (limits: string[]) => (
    <ul className="list-none pl-0 space-y-2">
      {limits.map(renderFeature)}
    </ul>
  );

  const renderFeatures = (features: string[]) => (
    <ul className="list-none pl-0 space-y-2">
      {features.map((feature, index) => {
        if (index === 0 && feature.startsWith('Everything in')) {
          return <li key={feature} className="text-sm font-medium mt-4">{feature}</li>;
        }
        return renderFeature(feature);
      })}
    </ul>
  );

  const handlePlanSelection = (plan: Plan) => {
    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:contact@trusty.com?subject=Enterprise Plan Inquiry';
      return;
    }
    
    if (plan.free) {
      onDowngrade && onDowngrade();
      return;
    }
    
    onSelect(plan.priceId, selectedCycle);
  };

  const renderPlans = () => {
    return plans.filter(p => p.id !== 'free' || (p.id === 'free' && !showDowngrade)).map((plan) => {
      const isActive = currentPlan === plan.id || 
                      (currentPlan?.includes('standard') && plan.id === 'standard') || 
                      (currentPlan?.includes('premium') && plan.id === 'premium');
      
      let buttonText = plan.buttonText || 'Select Plan';
      if (isActive) {
        buttonText = 'Current Plan';
      }
      
      return (
        <div key={plan.id} className="relative">
          {plan.recommended && (
            <div className="absolute inset-x-0 -top-8 flex justify-center">
              <div className="bg-primary-blue text-white px-4 py-1 text-[12pt] font-medium rounded-t-md leading-6">
                RECOMMENDED
              </div>
            </div>
          )}
          <Card className={`flex h-full flex-col overflow-hidden ${isActive ? 'border-primary ring-1 ring-primary' : ''}`}>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <div className="text-2xl font-bold">{formatPrice(plan.priceId)}</div>
              <p className="text-gray-500 mt-2">{plan.description}</p>
            </CardHeader>
            <CardContent className="grow space-y-6">
              <div>
                {renderLimits(plan.limits)}
              </div>
              <div>
                {renderFeatures(plan.features)}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              <Button 
                onClick={() => handlePlanSelection(plan)}
                disabled={isLoading || isActive}
                className="w-full"
                variant={isActive ? "outline" : "default"}
              >
                {buttonText}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    });
  };

  return (
    <div>
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 bottom-1/2 h-6 bg-gray-100 rounded-full blur-lg opacity-30"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center rounded-full bg-muted p-1 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedCycle === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCycle(tab.id as 'monthly' | 'yearly')}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {renderPlans()}
      </div>
      
      {showDowngrade && (
        <div className="mt-10 text-center">
          <Button
            variant="link"
            onClick={onDowngrade}
            className="text-destructive"
          >
            Downgrade to free
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlanSelector;
