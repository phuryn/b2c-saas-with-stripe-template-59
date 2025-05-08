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
  return <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-medium">Select Your Plan</h2>
      
    </div>;
};
export default SubscriptionHeader;