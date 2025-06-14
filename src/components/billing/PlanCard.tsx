
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlanFeature {
  text: string;
  isHeader?: boolean;
}

interface PlanCardProps {
  name: string;
  description: string;
  price: string;
  limits: string[];
  features: string[];
  isActive: boolean;
  isRecommended?: boolean;
  buttonText: string;
  onSelect: () => void;
  isLoading?: boolean;
  inBillingPage?: boolean; // New prop to determine if the component is used in BillingSettings
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  description,
  price,
  limits,
  features,
  isActive,
  isRecommended = false,
  buttonText,
  onSelect,
  isLoading = false,
  inBillingPage = false,
}) => {
  const isMobile = useIsMobile();
  
  // Split the price string to separate the amount and interval
  const priceMatch = price.match(/^(\$[\d,\.]+)(\/\w+)$/);
  const priceAmount = priceMatch ? priceMatch[1] : price;
  const priceInterval = priceMatch ? priceMatch[2] : '';
  
  // For the Free plan, ensure we always show $0/month format
  const displayPrice = name === 'Free' && price === 'Free' ? '$0/month' : price;
  const displayPriceMatch = displayPrice.match(/^(\$[\d,\.]+)(\/\w+)$/);
  const displayPriceAmount = displayPriceMatch ? displayPriceMatch[1] : displayPrice;
  const displayPriceInterval = displayPriceMatch ? displayPriceMatch[2] : '';
  
  const renderFeature = (feature: string) => (
    <li key={feature} className="flex items-start gap-2">
      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
      <span className="break-words">{feature}</span>
    </li>
  );

  const renderFeatures = (featuresList: string[]) => (
    <ul className="list-none pl-0 space-y-2">
      {featuresList.map((feature) => {
        // Check if this feature is a header (like "Includes:" or "Everything in X, plus:")
        if (feature === "Includes:" || feature.toLowerCase().includes("plus:") || feature.toLowerCase().includes("everything in")) {
          return <li key={feature} className="text-sm font-medium mt-4">{feature}</li>;
        }
        return renderFeature(feature);
      })}
    </ul>
  );

  return (
    <div className={`relative min-w-[210px] ${isMobile && isRecommended ? 'mt-7' : ''}`}>
      {isRecommended && (
        <div className="absolute inset-x-0 -top-8 flex justify-center">
          <div className="bg-primary-blue text-white px-4 py-1 text-[12pt] font-medium rounded-t-md leading-6">
            RECOMMENDED
          </div>
        </div>
      )}
      <Card className={`flex h-full flex-col overflow-hidden ${isRecommended ? 'border-primary-blue ring-1 ring-primary-blue' : ''}`}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold break-words">{name}</CardTitle>
          <div className="flex items-baseline">
            {displayPriceMatch ? (
              <>
                <span className="text-2xl font-bold text-primary-blue">{displayPriceAmount}</span>
                <span className="text-[#292929] text-sm ml-0.5">{displayPriceInterval}</span>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary-blue">{displayPrice}</span>
            )}
          </div>
          <p className="text-gray-500 mt-2 break-words">{description}</p>
        </CardHeader>
        
        {/* Only render CardContent if not in billing page */}
        {!inBillingPage && (
          <CardContent className="grow space-y-6">
            <div>
              <ul className="list-none pl-0 space-y-2">
                {limits.map(renderFeature)}
              </ul>
            </div>
            <div>
              {renderFeatures(features)}
            </div>
          </CardContent>
        )}
        
        <CardFooter className={`${inBillingPage ? "flex justify-start" : "flex flex-col items-center"} ${!inBillingPage ? "mt-auto" : ""}`}>
          <Button 
            onClick={onSelect}
            disabled={isLoading || (isActive && !inBillingPage)} // Enable button in BillingSettings even for active plan
            className={inBillingPage ? "" : "w-full"} // Remove full width for BillingSettings
            variant={isActive ? "outline" : "default"}
          >
            {buttonText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PlanCard;
