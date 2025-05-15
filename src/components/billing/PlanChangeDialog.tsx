
import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';

interface PlanChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  newPlanName: string;
  willTakeEffectAtEndOfCycle?: boolean;
}

const PlanChangeDialog: React.FC<PlanChangeDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
  newPlanName,
  willTakeEffectAtEndOfCycle = false
}) => {
  const handleConfirm = () => {
    try {
      onConfirm();
      // Don't automatically close the dialog - it will be closed by the parent component
      // after the operation completes successfully
    } catch (err) {
      console.error('Error during plan change:', err);
      toast.error("An error occurred while changing plans. Please try again.");
      // Still allow the dialog to close on error
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change to {newPlanName} Plan?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change to the {newPlanName} plan?
            
            {willTakeEffectAtEndOfCycle ? (
              <p className="mt-2">
                This change will take effect at the end of your current billing cycle.
                You'll continue to have access to your current plan until then.
              </p>
            ) : (
              <p className="mt-2">This will take effect immediately and you will be charged accordingly.</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={loading}
            className="relative"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Confirm Plan Change"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PlanChangeDialog;
