
import React, { useState, useEffect } from 'react';
import { Plan, getPlans } from '@/config/plans';
import { formatPrice } from '@/utils/pricing';
import BillingCycleSwitch from './BillingCycleSwitch';
import PlanCard from './PlanCard';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import PlanChangeDialog from './PlanChangeDialog';
import { toast } from '@/hooks/use-toast';
import { STRIPE_CONFIG } from '@/config/stripe';

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
  onCycleChange?: (cycle: 'monthly' | 'yearly') => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  currentPlan, 
  isLoading, 
  cycle = 'yearly', 
  onSelect,
  priceData = {},
  showDowngrade = false,
  onDowngrade,
  isPublicPage = false,
  onCycleChange
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>(cycle);
  const [showPlanChangeDialog, setShowPlanChangeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const plans = getPlans(selectedCycle);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Effect to update the selected cycle if the prop changes
  useEffect(() => {
    if (cycle) {
      console.log('PlanSelector: Cycle prop changed to', cycle);
      setSelectedCycle(cycle);
    }
  }, [cycle]);

  // Helper function to check if a plan is the current plan
  const isPlanActive = (planId: string): boolean => {
    if (!currentPlan) return false;
    
    // For standard plan
    if (planId === 'standard') {
      return currentPlan === STRIPE_CONFIG.prices.standard.monthly || 
             currentPlan === STRIPE_CONFIG.prices.standard.yearly;
    }
    
    // For premium plan
    if (planId === 'premium') {
      return currentPlan === STRIPE_CONFIG.prices.premium.monthly || 
             currentPlan === STRIPE_CONFIG.prices.premium.yearly;
    }
    
    return false;
  };

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
    
    // Enterprise plan always goes to email
    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:contact@trusty.com?subject=Enterprise Plan Inquiry';
      return;
    }
    
    // Handle downgrade to free plan
    if (plan.free) {
      onDowngrade && onDowngrade();
      return;
    }
    
    // Get subscription status from localStorage
    const hasActiveSubscription = localStorage.getItem('hasActiveSubscription') === 'true';
    
    // Check if this is the current plan
    const isCurrentPlan = isPlanActive(plan.id);
    
    if (isCurrentPlan) {
      // This is already the current plan
      toast.info("You are already subscribed to this plan");
      return;
    }
    
    if (hasActiveSubscription) {
      // Show dialog only when changing from one paid plan to another
      setSelectedPlan(plan);
      setShowPlanChangeDialog(true);
    } else {
      // Free user subscribing - go directly to checkout without dialog
      if (onSelect) {
        console.log('Free user subscribing, going directly to checkout with cycle:', selectedCycle);
        onSelect(plan.priceId, selectedCycle);
      }
    }
  };
  
  const confirmPlanChange = () => {
    if (selectedPlan && onSelect) {
      console.log('Confirming plan change with cycle:', selectedCycle);
      onSelect(selectedPlan.priceId, selectedCycle);
    }
    setShowPlanChangeDialog(false);
    setSelectedPlan(null);
  };

  const renderPlans = () => {
    // Filter out the free plan if not on the public page
    const filteredPlans = isPublicPage ? plans : plans.filter(plan => !plan.free);
    
    return filteredPlans.map((plan) => {
      // Check if this is the current plan
      const isActive = !isPublicPage && isPlanActive(plan.id);
      
      // Log active plans for debugging
      if (isActive) {
        console.log(`Marked ${plan.id} plan as active based on price ID match`);
      }
      
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
    console.log('PlanSelector: Cycle changed to', cycle);
    setSelectedCycle(cycle);
    // Call the parent's onCycleChange if provided
    if (onCycleChange) {
      onCycleChange(cycle);
    }
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
      
      {/* Plan Change Confirmation Dialog */}
      {selectedPlan && (
        <PlanChangeDialog
          open={showPlanChangeDialog}
          onOpenChange={setShowPlanChangeDialog}
          onConfirm={confirmPlanChange}
          loading={isLoading || false}
          newPlanName={selectedPlan.name}
        />
      )}
    </div>
  );
};

export default PlanSelector;
