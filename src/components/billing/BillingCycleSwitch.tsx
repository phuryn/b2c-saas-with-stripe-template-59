
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BillingCycleSwitchProps {
  selectedCycle: 'monthly' | 'yearly';
  onChange: (cycle: 'monthly' | 'yearly') => void;
}

const BillingCycleSwitch: React.FC<BillingCycleSwitchProps> = ({ 
  selectedCycle, 
  onChange 
}) => {
  return (
    <div className="mb-12">
      <div className="relative">
        <div className="flex items-center justify-center rounded-full p-2">
          <div className="flex items-center">
            <Badge 
              className={cn(
                "mr-2 text-xs font-medium",
                selectedCycle === 'yearly' 
                  ? "bg-[#F2FCE2] text-primary-green" 
                  : "bg-[#F1F0FB] text-gray-500"
              )}
            >
              Save up to 17%
            </Badge>
            <span className={`font-medium text-sm mr-2 ${selectedCycle === 'yearly' ? 'text-gray-800' : 'text-gray-500'}`}>
              Annually
            </span>
          </div>
          <Switch
            checked={selectedCycle === 'monthly'}
            onCheckedChange={(checked) => onChange(checked ? 'monthly' : 'yearly')}
            className="mx-2"
          />
          <span className={`font-medium text-sm ml-2 ${selectedCycle === 'monthly' ? 'text-gray-800' : 'text-gray-500'}`}>
            Monthly
          </span>
        </div>
      </div>
    </div>
  );
};

export default BillingCycleSwitch;
