
import React, { useState } from 'react';
import { Plan, getPlans } from '@/config/plans';
import { formatPrice } from '@/utils/pricing';
import BillingCycleSwitch from './BillingCycleSwitch';
import PlanCard from './PlanCard';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlanSelectorProps {
  currentPlan?: string | null;
  isLoading?: boolean;
  cycle?: 'monthly' | 'yearly';
  onSelect?: (planId: string, cycle: 'monthly' | 'yearly') => void;
  priceData?: Record<string, {
    id: string;
    unit_amount: number;
    currency: string;
    interval?: string;
  }>;
  showDowngrade?: boolean;
  onDowngrade?: () => void;
  isPublicPage?: boolean;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  currentPlan, 
  isLoading, 
  cycle = 'yearly', 
  onSelect,
  priceData = {},
  showDowngrade = false,
  onDowngrade,
  isPublicPage = false
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('yearly');
  const plans = getPlans(selectedCycle);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const handlePlanSelection = (plan: Plan) => {
    // On public page, redirect to appropriate location based on user and plan
    if (isPublicPage) {
      if (plan.id === 'enterprise') {
        window.location.href = 'mailto:contact@trusty.com?subject=Enterprise Plan Inquiry';
        return;
      }
      
      if (user) {
        // If user is logged in on public page, redirect to billing settings
        window.location.href = '/app/settings/billing';
        return;
      } else {
        // If not logged in on public page, redirect to signup
        window.location.href = '/signup';
        return;
      }
    }
    
    // Normal app flow below
    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:contact@trusty.com?subject=Enterprise Plan Inquiry';
      return;
    }
    
    if (plan.free) {
      onDowngrade && onDowngrade();
      return;
    }
    
    onSelect && onSelect(plan.priceId, selectedCycle);
  };

  const renderPlans = () => {
    // Filter out the free plan if not on the public page
    const filteredPlans = isPublicPage ? plans : plans.filter(plan => !plan.free);
    
    return filteredPlans.map((plan) => {
      // Check if this is the current plan by comparing price IDs directly
      // Only show active state if not on public page
      const isActive = !isPublicPage && (
        currentPlan === plan.priceId || 
        (plan.id !== 'free' && currentPlan?.includes(plan.id))
      );
      
      let buttonText = plan.buttonText || 'Select Plan';
      
      if (isPublicPage) {
        // Custom button text for public page
        if (plan.id === 'free') {
          buttonText = user ? 'Manage Your Plan' : 'Sign Up Free';
        } else if (user) {
          buttonText = 'Manage Your Plan';
        } else {
          buttonText = 'Try Now';
        }
      } else if (isActive) {
        // For app settings page
        buttonText = 'Current Plan';
      }
      
      return (
        <PlanCard
          key={plan.id}
          name={plan.name}
          description={plan.description}
          price={formatPrice(plan.priceId, selectedCycle, priceData, plans)}
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
      
      {/* Updated grid with responsive layout for mobile and desktop */}
      <div 
        className={`mt-4 grid gap-6 ${
          isMobile ? 'grid-cols-1' : 'grid-template-columns: repeat(auto-fit, minmax(210px, 1fr))'
        }`}
        style={{
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))',
        }}
      >
        {renderPlans()}
      </div>
      
      {showDowngrade && !isPublicPage && (
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
