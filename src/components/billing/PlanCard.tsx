
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlanCardProps {
  name: string;
  description?: string;
  price: string;
  features?: string[];
  limits?: string[];
  buttonText?: string;
  isActive?: boolean;
  isRecommended?: boolean;
  onSelect?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  inBillingPage?: boolean;
}

// Helper hook to handle disabled state
export const usePlanCardHelpers = () => {
  const handleDisabledPlanClick = () => {
    toast.info("You have a pending plan change. Please cancel it first before making new changes.");
  };
  
  return {
    handleDisabledPlanClick
  };
};

// The actual component
const PlanCard: React.FC<PlanCardProps> = ({
  name,
  description,
  price,
  features = [],
  limits = [],
  buttonText = "Select Plan",
  isActive = false,
  isRecommended = false,
  onSelect,
  isLoading = false,
  disabled = false,
  inBillingPage = false
}) => {
  const handleClick = () => {
    if (disabled && !isActive) {
      const { handleDisabledPlanClick } = usePlanCardHelpers();
      handleDisabledPlanClick();
      return;
    }
    
    if (onSelect && !isLoading && (!isActive || inBillingPage)) {
      onSelect();
    }
  };

  return (
    <Card 
      className={`relative flex flex-col ${isRecommended ? 'border-primary' : ''} ${
        isActive ? 'ring-2 ring-primary' : ''
      } h-full`}
    >
      {isRecommended && (
        <div className="absolute top-0 translate-y-[-50%] left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-primary-foreground text-xs px-4 py-1 rounded-full">
            Recommended
          </div>
        </div>
      )}
      
      {isActive && !inBillingPage && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-md">
          Current
        </div>
      )}
      
      <CardHeader className="pb-2">
        <h3 className="text-xl font-medium text-center">{name}</h3>
        {description && <p className="text-center text-muted-foreground text-sm mt-1">{description}</p>}
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold">{price}</div>
        </div>
        
        {limits.length > 0 && (
          <div className="border-t border-b py-2 mb-4">
            {limits.map((limit, i) => (
              <div key={`limit-${i}`} className="text-sm flex items-center justify-center">
                <span>{limit}</span>
              </div>
            ))}
          </div>
        )}
        
        {features.length > 0 && (
          <ul className="space-y-1">
            {features.map((feature, i) => (
              <li key={`feature-${i}`} className="text-sm flex items-center">
                <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleClick} 
          className="w-full"
          disabled={isLoading || (isActive && !inBillingPage) || (disabled && !isActive)}
          variant={isActive && !inBillingPage ? "outline" : "default"}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
