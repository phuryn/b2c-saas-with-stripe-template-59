
import React, { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface BillingCycleSwitchProps {
  selectedCycle: 'monthly' | 'yearly';
  onChange: (cycle: 'monthly' | 'yearly') => void;
}

const BillingCycleSwitch: React.FC<BillingCycleSwitchProps> = ({ 
  selectedCycle, 
  onChange 
}) => {
  const isMobile = useIsMobile();

  // Log when the selected cycle changes
  useEffect(() => {
    console.log('BillingCycleSwitch: selectedCycle prop is', selectedCycle);
  }, [selectedCycle]);

  // Using the Switch's checked state - true for monthly, false for yearly
  const isMonthly = selectedCycle === 'monthly';

  return (
    <div className={`${isMobile ? 'mb-5' : 'mb-12'}`}>
      <div className="relative">
        <div className="flex items-center justify-center rounded-full p-2">
          <div className="flex items-center">
            <Badge 
              className={cn(
                "mr-2 text-xs font-medium pointer-events-none",
                !isMonthly 
                  ? "bg-[#F2FCE2] text-primary-green" 
                  : "bg-[#F7F7F7] text-gray-500"
              )}
            >
              Save up to 17%
            </Badge>
            <span className={`font-medium text-sm mr-2 ${!isMonthly ? 'text-gray-800' : 'text-gray-500'}`}>
              Annually
            </span>
          </div>
          <Switch
            checked={isMonthly}
            onCheckedChange={(checked) => onChange(checked ? 'monthly' : 'yearly')}
            className="mx-2"
          />
          <span className={`font-medium text-sm ml-2 ${isMonthly ? 'text-gray-800' : 'text-gray-500'}`}>
            Monthly
          </span>
        </div>
      </div>
    </div>
  );
};

export default BillingCycleSwitch;
