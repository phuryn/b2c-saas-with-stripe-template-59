
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface PortalConfigFormProps {
  defaultConfig?: any;
  onSubmit: (config: any) => Promise<void>;
  isSubmitting?: boolean;
}

const PortalConfigForm: React.FC<PortalConfigFormProps> = ({ 
  defaultConfig,
  onSubmit,
  isSubmitting = false
}) => {
  const [appUrl, setAppUrl] = useState(defaultConfig?.app_url || 'https://yourapp.com');
  
  const [features, setFeatures] = useState({
    invoice_history: {
      enabled: defaultConfig?.features?.invoice_history?.enabled ?? true
    },
    payment_method_update: {
      enabled: defaultConfig?.features?.payment_method_update?.enabled ?? true
    },
    customer_update: {
      enabled: defaultConfig?.features?.customer_update?.enabled ?? true,
      allowed_updates: defaultConfig?.features?.customer_update?.allowed_updates ?? ['email', 'address', 'tax_id']
    },
    subscription_cancel: {
      enabled: defaultConfig?.features?.subscription_cancel?.enabled ?? true
    },
    subscription_update: {
      enabled: defaultConfig?.features?.subscription_update?.enabled ?? false
    }
  });

  const updateCustomerFields = (field: string, checked: boolean) => {
    setFeatures(prev => {
      const allowedUpdates = [...prev.customer_update.allowed_updates];
      
      if (checked && !allowedUpdates.includes(field)) {
        allowedUpdates.push(field);
      } else if (!checked && allowedUpdates.includes(field)) {
        const index = allowedUpdates.indexOf(field);
        if (index !== -1) {
          allowedUpdates.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        customer_update: {
          ...prev.customer_update,
          allowed_updates: allowedUpdates
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appUrl.trim()) {
      toast.error("Please enter a valid application URL");
      return;
    }
    
    try {
      await onSubmit({
        app_url: appUrl,
        features: features
      });
    } catch (error) {
      console.error("Error submitting configuration:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Customer Portal Configuration</CardTitle>
          <CardDescription>
            Configure the settings for your Stripe Customer Portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="app-url">Application URL</Label>
            <Input 
              id="app-url"
              value={appUrl} 
              onChange={(e) => setAppUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-sm text-muted-foreground">
              Used to construct Terms of Service and Privacy Policy links in the portal
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="font-medium">Portal Features</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="invoice-history">Invoice history</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to view past invoices</p>
                </div>
                <Switch 
                  id="invoice-history"
                  checked={features.invoice_history.enabled}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({
                      ...prev, 
                      invoice_history: { ...prev.invoice_history, enabled: checked }
                    }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="payment-method">Payment method update</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to update their payment methods</p>
                </div>
                <Switch 
                  id="payment-method"
                  checked={features.payment_method_update.enabled}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({
                      ...prev, 
                      payment_method_update: { ...prev.payment_method_update, enabled: checked }
                    }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="customer-update">Customer information update</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to update their information</p>
                </div>
                <Switch 
                  id="customer-update"
                  checked={features.customer_update.enabled}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({
                      ...prev, 
                      customer_update: { ...prev.customer_update, enabled: checked }
                    }))
                  }
                />
              </div>
              
              {features.customer_update.enabled && (
                <div className="ml-6 space-y-2">
                  <p className="text-sm font-medium">Editable fields:</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="email" 
                        checked={features.customer_update.allowed_updates.includes("email")}
                        onCheckedChange={(checked) => updateCustomerFields("email", !!checked)}
                      />
                      <Label htmlFor="email" className="text-sm font-normal">Email address</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="address" 
                        checked={features.customer_update.allowed_updates.includes("address")}
                        onCheckedChange={(checked) => updateCustomerFields("address", !!checked)}
                      />
                      <Label htmlFor="address" className="text-sm font-normal">Billing address</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tax_id" 
                        checked={features.customer_update.allowed_updates.includes("tax_id")}
                        onCheckedChange={(checked) => updateCustomerFields("tax_id", !!checked)}
                      />
                      <Label htmlFor="tax_id" className="text-sm font-normal">Tax ID</Label>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="subscription-cancel">Subscription cancellation</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to cancel their subscriptions</p>
                </div>
                <Switch 
                  id="subscription-cancel"
                  checked={features.subscription_cancel.enabled}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({
                      ...prev, 
                      subscription_cancel: { ...prev.subscription_cancel, enabled: checked }
                    }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="subscription-update">Plan changes</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to change their subscription plans</p>
                </div>
                <Switch 
                  id="subscription-update"
                  checked={features.subscription_update.enabled}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({
                      ...prev, 
                      subscription_update: { ...prev.subscription_update, enabled: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="ml-auto"
          >
            {isSubmitting ? "Saving..." : "Save Configuration"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default PortalConfigForm;
