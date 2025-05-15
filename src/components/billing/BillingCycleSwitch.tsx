
import React from 'react';
import { toast } from '@/hooks/use-toast';

interface BillingCycleSwitchProps {
  selectedCycle: 'monthly' | 'yearly';
  onChange: (cycle: 'monthly' | 'yearly') => void;
  disabled?: boolean;
}

// Helper hook to handle disabled state
export const useBillingSwitchHelpers = () => {
  const handleDisabledCycleChange = () => {
    toast.info("You have a pending plan change. Please cancel it first before changing billing cycle.");
  };
  
  return {
    handleDisabledCycleChange
  };
};

// The actual component
const BillingCycleSwitch: React.FC<BillingCycleSwitchProps> = ({
  selectedCycle,
  onChange,
  disabled = false
}) => {
  const handleCycleChange = (cycle: 'monthly' | 'yearly') => {
    if (!disabled) {
      onChange(cycle);
    }
  };

  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center border border-input rounded-lg overflow-hidden bg-background">
        <button
          type="button"
          className={`px-4 py-2 text-sm transition-colors ${
            selectedCycle === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent'
          }`}
          onClick={() => handleCycleChange('monthly')}
          disabled={disabled}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm transition-colors ${
            selectedCycle === 'yearly'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent'
          }`}
          onClick={() => handleCycleChange('yearly')}
          disabled={disabled}
        >
          Yearly <span className="text-xs opacity-75 ml-1">Save 20%</span>
        </button>
      </div>
    </div>
  );
};

export default BillingCycleSwitch;
