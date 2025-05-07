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
  features: string[];
  recommended?: boolean;
}

interface PlanSelectorProps {
  currentPlan?: string | null;
  isLoading?: boolean;
  cycle?: 'monthly' | 'yearly';
  onSelect: (planId: string, cycle: string) => void;
  priceData?: Record<string, {
    id: string;
    unit_amount: number;
    currency: string;
    interval?: string;
  }>;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  currentPlan, 
  isLoading, 
  cycle = 'monthly', 
  onSelect,
  priceData = {}
}) => {
  const [selectedCycle, setSelectedCycle] = useState(cycle);

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
      id: 'standard',
      name: 'Standard',
      priceId: selectedCycle === 'monthly' ? STRIPE_CONFIG.prices.standard.monthly : STRIPE_CONFIG.prices.standard.yearly,
      description: 'Great for getting started',
      features: [
        'Unlimited links',
        'Custom domains',
        'Advanced analytics',
      ],
      recommended: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      priceId: selectedCycle === 'monthly' ? STRIPE_CONFIG.prices.premium.monthly : STRIPE_CONFIG.prices.premium.yearly,
      description: 'For power users',
      features: [
        'Everything in Standard',
        'Priority support',
        'Team collaboration',
        'White-labeling',
      ],
    },
  ];

  const formatPrice = (priceId: string): string => {
    const price = priceData[priceId];
    if (!price) return 'Contact us';

    const amount = price.unit_amount / 100;
    const currency = price.currency.toUpperCase();
    const interval = price.interval;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount) + (interval ? `/${interval}` : '');
  };

  const renderFeature = (feature: string) => (
    <li key={feature} className="flex items-center space-x-2">
      <Check className="h-4 w-4 text-green-500" />
      <span>{feature}</span>
    </li>
  );

  const renderFeatures = (features: string[]) => (
    <ul className="list-none pl-0 space-y-2">
      {features.map(renderFeature)}
    </ul>
  );

  const renderPlans = () => {
    return plans.map((plan) => {
      const isActive = currentPlan === plan.id;
      
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
          </CardHeader>
          <CardContent className="grow">
            <div className="mb-4">
              <p className="text-gray-500">{plan.description}</p>
            </div>
            {renderFeatures(plan.features)}
          </CardContent>
          <CardFooter className="flex flex-col items-center">
            <div className="text-2xl font-bold mb-2">{formatPrice(plan.priceId)}</div>
            <Button 
              onClick={() => onSelect(plan.id, selectedCycle)}
              disabled={isLoading}
              className="w-full"
            >
              {isActive ? 'Current Plan' : 'Select Plan'}
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
                  onClick={() => setSelectedCycle(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {renderPlans()}
      </div>
    </div>
  );
};

export default PlanSelector;
