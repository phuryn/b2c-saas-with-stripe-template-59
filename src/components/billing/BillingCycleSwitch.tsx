
import React from 'react';
import { Switch } from '@/components/ui/switch';

interface BillingCycleSwitchProps {
  selectedCycle: 'monthly' | 'yearly';
  onChange: (cycle: 'monthly' | 'yearly') => void;
}

const BillingCycleSwitch: React.FC<BillingCycleSwitchProps> = ({ 
  selectedCycle, 
  onChange 
}) => {
  return (
    <div className="mb-8">
      <div className="relative">
        <div className="flex items-center justify-center bg-gray-100 rounded-full p-2">
          <div className="flex items-center">
            <span className="text-xs font-medium text-primary-green mr-2">
              Save up to 17%
            </span>
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
