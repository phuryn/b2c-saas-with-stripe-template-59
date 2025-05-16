
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from 'date-fns';

interface PortalConfigViewProps {
  config: any;
  isLoading?: boolean;
  isEditing?: boolean;
  onToggleFeature?: (feature: string, enabled: boolean) => void;
}

const PortalConfigView: React.FC<PortalConfigViewProps> = ({ 
  config, 
  isLoading = false,
  isEditing = false,
  onToggleFeature
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portal Configuration</CardTitle>
        </CardHeader>
        <CardContent className="min-h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Loading configuration...</p>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portal Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No portal configuration has been set up yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  const createdAt = config.created_at ? new Date(config.created_at) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Customer Portal Configuration</CardTitle>
          {config.config_id && (
            <Badge variant="outline" className="text-xs">ID: {config.config_id.substring(0, 12)}...</Badge>
          )}
        </div>
        {createdAt && (
          <p className="text-sm text-muted-foreground">
            Created {formatDistanceToNow(createdAt, { addSuffix: true })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Application URL</h3>
          <p className="px-3 py-2 bg-muted rounded text-sm">{config.app_url}</p>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium mb-2">Portal Features</h3>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Invoice history</Label>
                <p className="text-sm text-muted-foreground">Show past invoices to customers</p>
              </div>
              {isEditing ? (
                <Switch 
                  checked={config.features?.invoice_history?.enabled ?? false}
                  onCheckedChange={(checked) => onToggleFeature?.('invoice_history', checked)}
                />
              ) : (
                <FeatureStatus enabled={config.features?.invoice_history?.enabled} />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Payment method updates</Label>
                <p className="text-sm text-muted-foreground">Allow customers to update payment methods</p>
              </div>
              {isEditing ? (
                <Switch 
                  checked={config.features?.payment_method_update?.enabled ?? false}
                  onCheckedChange={(checked) => onToggleFeature?.('payment_method_update', checked)}
                />
              ) : (
                <FeatureStatus enabled={config.features?.payment_method_update?.enabled} />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Customer information updates</Label>
                <p className="text-sm text-muted-foreground">Allow customers to update their details</p>
              </div>
              {isEditing ? (
                <Switch 
                  checked={config.features?.customer_update?.enabled ?? false}
                  onCheckedChange={(checked) => onToggleFeature?.('customer_update', checked)}
                />
              ) : (
                <FeatureStatus enabled={config.features?.customer_update?.enabled} />
              )}
            </div>
            
            {config.features?.customer_update?.enabled && (
              <div className="ml-6 flex items-center space-x-1">
                <p className="text-sm">Editable fields:</p>
                <div className="flex flex-wrap gap-1 ml-2">
                  {config.features.customer_update.allowed_updates?.map((field: string) => (
                    <Badge key={field} variant="secondary" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Subscription cancellation</Label>
                <p className="text-sm text-muted-foreground">Allow customers to cancel subscriptions</p>
              </div>
              {isEditing ? (
                <Switch 
                  checked={config.features?.subscription_cancel?.enabled ?? false}
                  onCheckedChange={(checked) => onToggleFeature?.('subscription_cancel', checked)}
                />
              ) : (
                <FeatureStatus enabled={config.features?.subscription_cancel?.enabled} />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Plan changes</Label>
                <p className="text-sm text-muted-foreground">Allow customers to change subscription plans</p>
              </div>
              {isEditing ? (
                <Switch 
                  checked={config.features?.subscription_update?.enabled ?? false}
                  onCheckedChange={(checked) => onToggleFeature?.('subscription_update', checked)}
                />
              ) : (
                <FeatureStatus enabled={config.features?.subscription_update?.enabled} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FeatureStatus: React.FC<{ enabled?: boolean }> = ({ enabled }) => {
  return enabled ? (
    <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Enabled
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
      <X className="h-3.5 w-3.5 mr-1" /> Disabled
    </Badge>
  );
};

export default PortalConfigView;
