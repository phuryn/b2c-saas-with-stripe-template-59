
import React, { useState } from 'react';
import { Plan, getPlans } from '@/config/plans';
import { formatPrice } from '@/utils/pricing';
import BillingCycleSwitch from './BillingCycleSwitch';
import PlanCard from './PlanCard';

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
  cycle = 'yearly', 
  onSelect,
  priceData = {},
  showDowngrade = false,
  onDowngrade
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('yearly');
  const plans = getPlans(selectedCycle);

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
    return plans.map((plan) => {
      // Check if this is the current plan by comparing price IDs directly
      const isActive = currentPlan === plan.priceId || 
                      (plan.id !== 'free' && currentPlan?.includes(plan.id));
      
      let buttonText = plan.buttonText || 'Select Plan';
      if (isActive) {
        buttonText = 'Current Plan';
      }
      
      return (
        <PlanCard
          key={plan.id}
          name={plan.name}
          description={plan.description}
          price={formatPrice(plan.priceId, selectedCycle, priceData)}
          limits={plan.limits}
          features={plan.features}
          isActive={isActive}
          isRecommended={plan.recommended}
          buttonText={buttonText}
          onSelect={() => handlePlanSelection(plan)}
          isLoading={isLoading}
        />
      );
    });
  };

  const handleCycleChange = (cycle: 'monthly' | 'yearly') => {
    setSelectedCycle(cycle);
  };

  return (
    <div>
      <BillingCycleSwitch 
        selectedCycle={selectedCycle}
        onChange={handleCycleChange}
      />
      
      {/* Added 1rem margin-top (mt-4) between switcher and plans */}
      <div className="grid gap-6 md:grid-cols-3 mt-4">
        {renderPlans()}
      </div>
      
      {showDowngrade && (
        <div className="mt-10 text-center">
          <button
            onClick={onDowngrade}
            className="text-destructive underline hover:text-destructive/80"
          >
            Downgrade to free
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanSelector;
