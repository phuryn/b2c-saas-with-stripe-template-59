
import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface BillingDetailsDialogProps {
  title: string;
  description: string;
  buttonText: string;
  triggerButtonText: string;
  triggerButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  isLoading?: boolean;
  onAction: () => Promise<void>;
}

const BillingDetailsDialog: React.FC<BillingDetailsDialogProps> = ({
  title,
  description,
  buttonText,
  triggerButtonText,
  triggerButtonVariant = 'outline',
  isLoading = false,
  onAction,
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      await onAction();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerButtonVariant} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAction} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDetailsDialog;
