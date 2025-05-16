
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { Key, Copy, File, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { configureStripeProducts, configureStripePortal, checkSecretsReady } from '@/api/subscriptionApi';
import { Badge } from "@/components/ui/badge";

const AdminStripeConfig: React.FC = () => {
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [secretsReady, setSecretsReady] = useState(false);
  const [resultPriceIds, setResultPriceIds] = useState<Record<string, string>>({});
  const [portalConfig, setPortalConfig] = useState<any>(null);
  
  useEffect(() => {
    const checkSecrets = async () => {
      const ready = await checkSecretsReady();
      setSecretsReady(ready);
    };
    checkSecrets();
  }, []);
  
  // Function to initialize Stripe products and prices
  const handleInitializeProducts = async () => {
    if (!stripeSecretKey.trim() && !secretsReady) {
      toast.error("Please enter your Stripe Secret Key");
      return;
    }

    setProductsLoading(true);
    try {
      const result = await configureStripeProducts(
        !secretsReady ? stripeSecretKey : undefined
      );
      
      setResultPriceIds(result.priceIds || {});
      toast.success("Products and prices initialized successfully!");
      setSecretsReady(true);
    } catch (err) {
      console.error('Error initializing products:', err);
      toast.error(err instanceof Error ? err.message : "Failed to initialize products");
    } finally {
      setProductsLoading(false);
    }
  };
  
  // Function to initialize Stripe customer portal
  const handleInitializePortal = async () => {
    if (!stripeSecretKey.trim() && !secretsReady) {
      toast.error("Please enter your Stripe Secret Key");
      return;
    }

    setLoading(true);
    try {
      const result = await configureStripePortal(
        !secretsReady ? stripeSecretKey : undefined
      );
      
      setPortalConfig(result.configuration);
      toast.success("Customer portal configured successfully!");
      console.log('Portal configuration result:', result);
      setSecretsReady(true);
    } catch (err) {
      console.error('Error configuring portal:', err);
      toast.error(err instanceof Error ? err.message : "Failed to configure customer portal");
    } finally {
      setLoading(false);
    }
  };
  
  // Format plans data for display
  const formatPlansForDisplay = () => {
    return JSON.stringify([
      {
        "id": "standard",
        "name": "Standard",
        "description": "Great for professionals and small teams",
        "features": ["Feature 1", "Feature 2", "Feature 3"],
        "priceId": "******",
        "amount": 10,
        "interval": "monthly"
      },
      {
        "id": "premium",
        "name": "Premium",
        "description": "For growing teams with advanced needs",
        "features": ["All Standard features", "Feature 4", "Feature 5"],
        "priceId": "******",
        "amount": 20, 
        "interval": "monthly"
      }
    ], null, 2);
  };
  
  // Copy generated price IDs to clipboard
  const copyPriceIdsToClipboard = () => {
    if (Object.keys(resultPriceIds).length === 0) {
      toast.error("No price IDs generated yet");
      return;
    }
    
    const formattedConfig = `export const STRIPE_CONFIG = {
  prices: {
    standard: {
      monthly: "${resultPriceIds.standard_monthly || 'price_xxx'}",
      yearly: "${resultPriceIds.standard_yearly || 'price_xxx'}",
      displayName: "Standard"
    },
    premium: {
      monthly: "${resultPriceIds.premium_monthly || 'price_xxx'}",
      yearly: "${resultPriceIds.premium_yearly || 'price_xxx'}",
      displayName: "Premium"
    }
  },
  customerPortalUrl: "https://billing.stripe.com/p/login/your-link"
};`;

    navigator.clipboard.writeText(formattedConfig)
      .then(() => toast.success("Price IDs copied to clipboard"))
      .catch(() => toast.error("Failed to copy to clipboard"));
  };
  
  // Determine path to config file for display
  const plansConfigPath = "src/config/plans.ts";
  const stripeConfigPath = "src/config/stripe.ts";

  // Helper to render setting status
  const renderSettingStatus = (enabled: boolean, label: string) => (
    <div className="flex items-center space-x-2 text-sm">
      {enabled ? (
        <ToggleRight className="h-4 w-4 text-green-500" />
      ) : (
        <ToggleLeft className="h-4 w-4 text-red-500" />
      )}
      <span>{label}:</span>
      <Badge variant={enabled ? "success" : "secondary"}>
        {enabled ? "Enabled" : "Disabled"}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Stripe Configuration</CardTitle>
          <CardDescription>
            {secretsReady ? (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Stripe API key is configured
              </div>
            ) : (
              "Enter your Stripe Secret Key to initialize products and portal"
            )}
          </CardDescription>
        </CardHeader>
        {!secretsReady && (
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-key" className="flex items-center">
                  <Key className="h-4 w-4 mr-2" /> 
                  Stripe Secret Key
                </Label>
                <Textarea 
                  id="stripe-key"
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  placeholder="sk_test_..."
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Your Stripe Secret Key is required for initializing products and portal configuration
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products & Prices</TabsTrigger>
          <TabsTrigger value="portal">Customer Portal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Initialize Stripe Products and Prices</CardTitle>
              <CardDescription>
                This will create products and prices in your Stripe account based on the plans configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Plans Configuration Preview</Label>
                  <div className="mt-2 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        File path: <code className="bg-muted px-1 py-0.5 rounded">{plansConfigPath}</code>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(plansConfigPath);
                        toast.success("Path copied to clipboard");
                      }}>
                        <File className="h-4 w-4 mr-1" /> Copy Path
                      </Button>
                    </div>
                    <pre className="p-4 bg-slate-100 text-sm rounded-md overflow-auto max-h-[400px]">
                      {formatPlansForDisplay()}
                    </pre>
                  </div>
                </div>
                
                {Object.keys(resultPriceIds).length > 0 && (
                  <div className="mt-6">
                    <Label>Generated Price IDs</Label>
                    <div className="mt-2 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Update these in: <code className="bg-muted px-1 py-0.5 rounded">{stripeConfigPath}</code>
                        </span>
                        <Button variant="outline" size="sm" onClick={copyPriceIdsToClipboard}>
                          <Copy className="h-4 w-4 mr-1" /> Copy Config
                        </Button>
                      </div>
                      <pre className="p-4 bg-slate-100 text-sm rounded-md overflow-auto">
{`export const STRIPE_CONFIG = {
  prices: {
    standard: {
      monthly: "${resultPriceIds.standard_monthly || 'price_xxx'}",
      yearly: "${resultPriceIds.standard_yearly || 'price_xxx'}",
      displayName: "Standard"
    },
    premium: {
      monthly: "${resultPriceIds.premium_monthly || 'price_xxx'}",
      yearly: "${resultPriceIds.premium_yearly || 'price_xxx'}",
      displayName: "Premium"
    }
  },
  customerPortalUrl: "https://billing.stripe.com/p/login/your-link"
};`}
                      </pre>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>You'll need to manually update the stripe.ts file with these values.</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleInitializeProducts} 
                disabled={productsLoading}
                className="mr-2"
              >
                {productsLoading ? "Initializing..." : "Initialize Products and Prices"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="portal" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configure Customer Portal</CardTitle>
              <CardDescription>
                Configure the Stripe Customer Portal settings in your Stripe account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Portal Configuration Details:</h3>
                <div className="mt-4 p-4 rounded-md border">
                  <div className="space-y-3">
                    {renderSettingStatus(false, "Allow cancel subscriptions")}
                    {renderSettingStatus(false, "Allow manage subscriptions")}
                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Allow customer to update:</h4>
                      <div className="space-y-1 pl-2">
                        {renderSettingStatus(true, "Name")}
                        {renderSettingStatus(true, "Address")}
                        {renderSettingStatus(true, "Tax ID")}
                      </div>
                    </div>
                  </div>
                </div>

                {portalConfig && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Current Configuration:</h4>
                    <pre className="p-3 bg-slate-100 text-xs rounded-md overflow-auto">
                      {JSON.stringify(portalConfig, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleInitializePortal} 
                disabled={loading}
                className="mr-2"
              >
                {loading ? "Configuring Portal..." : "Configure Customer Portal"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStripeConfig;
