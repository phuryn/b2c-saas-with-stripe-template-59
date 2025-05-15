
import React, { useState, useEffect } from 'react';
import { Plan, getPlans } from '@/config/plans';
import { formatPrice } from '@/utils/pricing';
import { useBillingSwitchHelpers } from './BillingCycleSwitch';
import { usePlanCardHelpers } from './PlanCard';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import PlanChangeDialog from './PlanChangeDialog';
import { toast } from '@/hooks/use-toast';

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
  disableControls?: boolean;
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
  onCycleChange,
  disableControls = false
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>(cycle);
  const [showPlanChangeDialog, setShowPlanChangeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const plans = getPlans(selectedCycle);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { handleDisabledCycleChange } = useBillingSwitchHelpers();
  const { handleDisabledPlanClick } = usePlanCardHelpers();
  
  // Effect to update the selected cycle if the prop changes
  useEffect(() => {
    if (cycle) {
      console.log('PlanSelector: Cycle prop changed to', cycle);
      setSelectedCycle(cycle);
    }
  }, [cycle]);

  const handlePlanSelection = (plan: Plan) => {
    // If controls are disabled due to pending change, don't allow selection
    if (disableControls) {
      handleDisabledPlanClick();
      return;
    }
    
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
    
    // Show confirmation dialog for plan changes if not currently on this plan
    const currentPlanIncludesId = currentPlan && currentPlan.includes(plan.id);
    const isCurrentPlan = currentPlan === plan.priceId || currentPlanIncludesId;
    
    if (!isCurrentPlan) {
      setSelectedPlan(plan);
      setShowPlanChangeDialog(true);
    }
  };
  
  const confirmPlanChange = () => {
    if (selectedPlan && onSelect) {
      onSelect(selectedPlan.priceId, selectedCycle);
    }
    setShowPlanChangeDialog(false);
    setSelectedPlan(null);
  };

  const handleCycleChange = (cycle: 'monthly' | 'yearly') => {
    // If controls are disabled due to pending changes, don't allow cycle changes
    if (disableControls) {
      handleDisabledCycleChange();
      return;
    }
    
    console.log('BillingCycleSwitch: Cycle changed to', cycle);
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
        disabled={disableControls}
      />
      
      {disableControls && (
        <div className="mt-2 mb-4 text-sm text-warning-foreground bg-warning/20 p-2 rounded">
          Plan changes are disabled while you have a pending change scheduled. Cancel the pending change first to make new changes.
        </div>
      )}
      
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
      
      {showDowngrade && !isPublicPage && !disableControls && (
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
