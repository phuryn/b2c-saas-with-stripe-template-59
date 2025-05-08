
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SubscriptionHeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
}

const SubscriptionHeader: React.FC<SubscriptionHeaderProps> = ({
  onRefresh,
  refreshing
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-medium">Select Your Plan</h2>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh} 
        disabled={refreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};

export default SubscriptionHeader;
