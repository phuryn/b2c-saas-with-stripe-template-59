
import React from 'react';
import { Button } from '@/components/ui/button';
import BillingCycleSwitch from './BillingCycleSwitch';
import PlanCard from './PlanCard';
import { getPlans } from '@/config/plans';
import { formatPrice } from '@/utils/pricing';
import { BillingCycle } from '@/types/subscription';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlanSelectorProps {
  currentPlan: string | null;
  isLoading: boolean;
  priceData: Record<string, any>;
  cycle: BillingCycle;
  onCycleChange?: (cycle: BillingCycle) => void;
  onSelect: (plan: string, price: string) => void;
  showDowngrade?: boolean;
  onDowngrade?: () => void;
  activePlanIndex?: number; // New prop for mobile view
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
  currentPlan,
  isLoading,
  priceData,
  cycle = 'monthly',
  onCycleChange,
  onSelect,
  showDowngrade = false,
  onDowngrade,
  activePlanIndex
}) => {
  const isMobile = useIsMobile();
  
  // Get plans from our config
  const plans = getPlans(cycle);

  // Only show the plan at activePlanIndex on mobile if specified
  const displayedPlans = activePlanIndex !== undefined && isMobile
    ? [plans[activePlanIndex]]
    : plans;

  return (
    <div className="space-y-6">
      {/* Billing Cycle Toggle */}
      {onCycleChange && (
        <div className="flex justify-center mb-8">
          <BillingCycleSwitch cycle={cycle} onChange={onCycleChange} />
        </div>
      )}
      
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {displayedPlans.map((plan) => {
          const isActivePlan = currentPlan?.includes(plan.id);
          
          // Determine button text
          let buttonText = "Select Plan";
          if (isActivePlan) buttonText = "Current Plan";
          if (plan.id === 'standard' && isActivePlan && showDowngrade) buttonText = "Downgrade";
          
          // Set price display using formatter
          const price = plan.free ? 'Free' : formatPrice(plan.priceId, cycle, priceData, plans);
          
          return (
            <PlanCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              price={price}
              limits={plan.limits}
              features={plan.features}
              isActive={isActivePlan}
              isRecommended={plan.recommended}
              buttonText={buttonText}
              onSelect={() => {
                // Handle downgrades differently
                if (isActivePlan && plan.id === 'standard' && showDowngrade && onDowngrade) {
                  onDowngrade();
                } else if (!isActivePlan) {
                  onSelect(plan.id, plan.priceId);
                }
              }}
              isLoading={isLoading}
            />
          );
        })}
      </div>
      
      {/* Downgrade button for Premium users */}
      {currentPlan?.includes('premium') && showDowngrade && onDowngrade && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDowngrade}
            disabled={isLoading}
          >
            Downgrade to Standard Plan
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlanSelector;
