
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getPlans } from '@/config/plans';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, CheckCircle2, Copy, File, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  configureStripeCustomerPortal, 
  checkStripeSecretConfigured,
  getStripePortalConfig 
} from '@/api/stripePortalConfig';
import { initializeStripeProducts } from '@/api/stripeProductsConfig';
import PortalConfigView from '@/components/admin/PortalConfigView';
import PortalConfigForm from '@/components/admin/PortalConfigForm';

const AdminHome: React.FC = () => {
  const [productsLoading, setProductsLoading] = useState(false);
  const [resultPriceIds, setResultPriceIds] = useState<Record<string, string>>({});
  const [isSecretKeySet, setIsSecretKeySet] = useState<boolean | null>(null);
  const { userRole } = useAuth();
  
  // Portal configuration state
  const [portalConfigLoading, setPortalConfigLoading] = useState(true);
  const [portalConfig, setPortalConfig] = useState<any>(null);
  const [isEditingPortalConfig, setIsEditingPortalConfig] = useState(false);
  const [isSavingPortalConfig, setIsSavingPortalConfig] = useState(false);
  
  // Check if Stripe secret key is set and load portal configuration
  useEffect(() => {
    async function initialize() {
      try {
        const isConfigured = await checkStripeSecretConfigured();
        setIsSecretKeySet(isConfigured);
        
        if (isConfigured) {
          await loadPortalConfig();
        }
      } catch (err) {
        console.error('Failed to initialize admin panel:', err);
      }
    }
    
    if (userRole === 'administrator') {
      initialize();
    }
  }, [userRole]);
  
  // Load portal configuration
  const loadPortalConfig = async () => {
    setPortalConfigLoading(true);
    try {
      const result = await getStripePortalConfig();
      
      if (result.success && result.configExists) {
        setPortalConfig(result.config);
      } else {
        setPortalConfig(null);
      }
    } catch (err) {
      console.error('Error loading portal configuration:', err);
      toast.error('Failed to load portal configuration');
    } finally {
      setPortalConfigLoading(false);
    }
  };
  
  // Function to initialize Stripe products and prices
  const handleInitializeProducts = async () => {
    if (userRole !== 'administrator') {
      toast.error("Only administrators can perform this action");
      return;
    }

    if (!isSecretKeySet) {
      toast.error("Stripe Secret Key is not set in Supabase");
      return;
    }

    setProductsLoading(true);
    try {
      const result = await initializeStripeProducts();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to initialize products");
      }
      
      setResultPriceIds(result.priceIds || {});
      toast.success("Products and prices initialized successfully!");
    } catch (err) {
      console.error('Error initializing products:', err);
      toast.error(err instanceof Error ? err.message : "Failed to initialize products");
    } finally {
      setProductsLoading(false);
    }
  };
  
  // Function to save portal configuration
  const handleSavePortalConfig = async (config: any) => {
    if (userRole !== 'administrator') {
      toast.error("Only administrators can perform this action");
      return;
    }

    if (!isSecretKeySet) {
      toast.error("Stripe Secret Key is not set in Supabase");
      return;
    }

    setIsSavingPortalConfig(true);
    try {
      const result = await configureStripeCustomerPortal(config.app_url, config.features);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to configure customer portal");
      }
      
      setPortalConfig(result.config);
      setIsEditingPortalConfig(false);
      toast.success("Customer portal configured successfully!");
    } catch (err) {
      console.error('Error configuring portal:', err);
      toast.error(err instanceof Error ? err.message : "Failed to configure customer portal");
    } finally {
      setIsSavingPortalConfig(false);
    }
  };
  
  // Format plans data for display
  const formatPlansForDisplay = () => {
    const plansCopy = JSON.parse(JSON.stringify(getPlans('monthly')));
    // Replace price IDs with asterisks for display
    plansCopy.forEach((plan: any) => {
      if (plan.priceId && plan.priceId !== 'free' && plan.priceId !== 'enterprise') {
        plan.priceId = '******';
      }
    });
    return JSON.stringify(plansCopy, null, 2);
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
  
  if (userRole !== 'administrator') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Only administrators can access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Stripe Administration</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Stripe Configuration</CardTitle>
          <CardDescription>
            Manage Stripe integration for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Your Stripe secret key must be configured in Supabase before using this page.</p>
                <p className="text-sm text-muted-foreground">
                  Go to Supabase Dashboard → Project Settings → Functions → Secrets and add your 
                  <code className="bg-muted px-1 py-0.5 rounded mx-1">STRIPE_SECRET_KEY</code>
                </p>
                <div className="flex items-center mt-1">
                  {isSecretKeySet === true && (
                    <span className="flex items-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> 
                      Secret key is configured
                    </span>
                  )}
                  {isSecretKeySet === false && (
                    <span className="flex items-center text-red-500">
                      <AlertCircle className="h-4 w-4 mr-1" /> 
                      Secret key is not configured
                    </span>
                  )}
                  {isSecretKeySet === null && (
                    <span className="text-muted-foreground text-sm">Checking secret configuration...</span>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="portal">
        <TabsList className="mb-6">
          <TabsTrigger value="portal">Customer Portal</TabsTrigger>
          <TabsTrigger value="products">Products & Prices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="portal" className="space-y-6">
          <div className="flex justify-end mb-4">
            {!isEditingPortalConfig && (
              <Button 
                onClick={() => setIsEditingPortalConfig(true)}
                variant="outline"
                disabled={!isSecretKeySet}
              >
                {portalConfig ? "Edit Configuration" : "Create Configuration"}
              </Button>
            )}
            {isEditingPortalConfig && (
              <Button 
                onClick={() => setIsEditingPortalConfig(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            )}
          </div>
          
          {isEditingPortalConfig ? (
            <PortalConfigForm 
              defaultConfig={portalConfig} 
              onSubmit={handleSavePortalConfig}
              isSubmitting={isSavingPortalConfig}
            />
          ) : (
            <PortalConfigView 
              config={portalConfig}
              isLoading={portalConfigLoading}
            />
          )}
          
          <div className="text-sm text-muted-foreground mt-4 bg-muted p-4 rounded-md">
            <p className="mb-2 font-medium">Technical details:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>These settings configure what customers can do in the Stripe Customer Portal</li>
              <li>The configuration is stored in Stripe and cached in your database</li>
              <li>Changes take effect immediately for all new portal sessions</li>
              <li>Your customer-portal edge function automatically uses this configuration</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="products">
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
                disabled={productsLoading || !isSecretKeySet}
                className="mr-2"
              >
                {productsLoading ? "Initializing..." : "Initialize Products and Prices"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHome;
