
import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarClock, RefreshCw, XCircle } from 'lucide-react';
import { formatDate } from './SubscriptionInfo';
import { PendingChange } from '@/types/subscription';
import { toast } from '@/hooks/use-toast';

interface PendingChangeInfoProps {
  pendingChange: PendingChange;
  onCancelPendingChange: () => Promise<boolean>;
  isLoading: boolean;
}

const getChangeTypeText = (type: string | null) => {
  switch (type) {
    case 'downgrade':
      return 'Downgrade to free plan';
    case 'plan_change':
      return 'Plan change';
    case 'cycle_change':
      return 'Billing cycle change';
    default:
      return 'Subscription change';
  }
};

const PendingChangeInfo: React.FC<PendingChangeInfoProps> = ({
  pendingChange,
  onCancelPendingChange,
  isLoading
}) => {
  const handleCancelChange = async () => {
    try {
      const success = await onCancelPendingChange();
      if (success) {
        toast.success('Pending change cancelled successfully');
      } else {
        toast.error('Failed to cancel pending change');
      }
    } catch (err) {
      console.error('Error cancelling pending change:', err);
      toast.error('An error occurred while cancelling the pending change');
    }
  };

  if (!pendingChange || !pendingChange.type) {
    return null;
  }

  return (
    <div className="bg-muted/80 rounded-lg p-4 border border-warning text-warning-foreground mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-start md:items-center gap-2 mb-3 md:mb-0">
          <CalendarClock className="h-5 w-5 flex-shrink-0 mt-0.5 md:mt-0" />
          <div>
            <p className="font-medium">
              {getChangeTypeText(pendingChange.type)}
              {pendingChange.new_plan_name && `: ${pendingChange.new_plan_name}`}
            </p>
            <p className="text-sm text-muted-foreground">
              Scheduled to take effect on {formatDate(pendingChange.effective_date)}
            </p>
          </div>
        </div>
        <Button 
          variant="outline"
          size="sm" 
          onClick={handleCancelChange}
          disabled={isLoading}
          className="flex-shrink-0"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Cancelling...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Change
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PendingChangeInfo;
