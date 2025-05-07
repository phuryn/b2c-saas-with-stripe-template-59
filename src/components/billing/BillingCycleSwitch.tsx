
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BillingCycle } from '@/types/subscription';

interface BillingCycleSwitchProps {
  selectedCycle?: 'monthly' | 'yearly';
  cycle?: BillingCycle;
  onChange: (cycle: 'monthly' | 'yearly' | BillingCycle) => void;
}

const BillingCycleSwitch: React.FC<BillingCycleSwitchProps> = ({ 
  selectedCycle, 
  cycle,
  onChange 
}) => {
  // Use either selectedCycle or cycle prop (for backward compatibility)
  const currentCycle = selectedCycle || cycle || 'monthly';
  
  return (
    <div className="mb-12">
      <div className="relative">
        <div className="flex items-center justify-center rounded-full p-2">
          <div className="flex items-center">
            <Badge 
              className={cn(
                "mr-2 text-xs font-medium pointer-events-none",
                currentCycle === 'yearly' 
                  ? "bg-[#F2FCE2] text-primary-green" 
                  : "bg-[#F7F7F7] text-gray-500"
              )}
            >
              Save up to 17%
            </Badge>
            <span className={`font-medium text-sm mr-2 ${currentCycle === 'yearly' ? 'text-gray-800' : 'text-gray-500'}`}>
              Annually
            </span>
          </div>
          <Switch
            checked={currentCycle === 'monthly'}
            onCheckedChange={(checked) => onChange(checked ? 'monthly' : 'yearly')}
            className="mx-2"
          />
          <span className={`font-medium text-sm ml-2 ${currentCycle === 'monthly' ? 'text-gray-800' : 'text-gray-500'}`}>
            Monthly
          </span>
        </div>
      </div>
    </div>
  );
};

export default BillingCycleSwitch;
