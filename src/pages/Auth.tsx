import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FcGoogle } from 'react-icons/fc';
import { FaLinkedin } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { toast: shadcnToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the return path from location state
  const from = location.state?.from || "/app";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated - but be careful to prevent loops
  useEffect(() => {
    // Log authentication state for debugging
    console.log("Auth page - Authentication state:", { 
      user: !!user,
      isLoading,
      from 
    });
    
    // Only redirect if user is authenticated and we're not still loading
    if (user && !isLoading) {
      console.log(`User is already authenticated, redirecting to: ${from}`);
      // Use a short delay to avoid potential race conditions
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
        toast.success("You are already signed in");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, navigate, from]);

  // Don't show sign-in form while we're checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  // If user is authenticated, show a simple message while redirecting
  if (user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">You are already signed in</h2>
          <p className="text-gray-500 mb-4">Redirecting you to the application...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue mx-auto"></div>
        </div>
      </div>
    );
  }

  const handleEmailLogin = async (values: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Attempting email login for:", values.email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      console.log("Login successful, redirecting to:", from);
      
      // Add directLogin parameter to track explicit login attempts
      const params = new URLSearchParams();
      params.set('directLogin', 'true');
      
      // Navigate to the path they were trying to access or default to /app
      navigate(from + (from.includes('?') ? '&' : '?') + params.toString(), { replace: true });
      
    } catch (error: any) {
      console.error('Error with email login:', error);
      toast.error(error.message || "Could not sign in with email and password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Attempting Google sign-in");
      
      // Add directLogin parameter to track explicit login attempts
      const currentUrl = window.location.href;
      const baseUrl = window.location.hostname.startsWith('app.')
        ? currentUrl.split('/auth')[0]
        : currentUrl.split('/auth')[0].replace('://', '://app.');
      
      // Pass the 'from' path as a state parameter so we can redirect back after auth
      const redirectPath = from !== "/app" ? from : "/app";
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}${redirectPath}?directLogin=true`,
          queryParams: {
            // Force a fresh login prompt even if the user is already logged in
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error with Google sign in:', error);
      toast.error("Could not sign in with Google. Please try again.");
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      console.log("Attempting LinkedIn sign-in");
      
      const currentUrl = window.location.href;
      const baseUrl = window.location.hostname.startsWith('app.')
        ? currentUrl.split('/auth')[0]
        : currentUrl.split('/auth')[0].replace('://', '://app.');
      
      // Pass the 'from' path as a state parameter so we can redirect back after auth
      const redirectPath = from !== "/app" ? from : "/app";
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${baseUrl}${redirectPath}?directLogin=true`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error with LinkedIn sign in:', error);
      toast.error("Could not sign in with LinkedIn. Please try again.");
    }
  };

  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" placeholder="name@example.com" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          <Link to="/forgot-password" className="text-sm text-primary-blue hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                        <Input id="password" type="password" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-blue hover:bg-primary-blue/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>

              <div className="relative my-6">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-2 text-sm text-gray-500">or</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-center py-6"
                  onClick={handleGoogleSignIn}
                >
                  <FcGoogle className="h-6 w-6" />
                  <span>Continue with Google</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-center py-6"
                  onClick={handleLinkedInSignIn}
                >
                  <FaLinkedin className="h-6 w-6 text-[#0A66C2]" />
                  <span>Continue with LinkedIn</span>
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex-col">
              <div className="text-center w-full mb-4">
                <p className="text-sm text-gray-500">
                  Don't have an account yet?{" "}
                  <Link to="/signup" className="text-primary-blue hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
              <div className="text-center w-full">
                <p className="text-xs text-gray-500">
                  Please read the <Link to="/terms" target="_blank" className="text-primary-blue hover:underline">Terms of Service</Link> and <Link to="/privacy_policy" target="_blank" className="text-primary-blue hover:underline">Privacy Policy</Link> carefully. By continuing, you are indicating your agreement.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Auth;
