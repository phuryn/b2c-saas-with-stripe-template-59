
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";

const signupFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be less than 64 characters"),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect logic - enhanced to ensure it happens only once and reliably
  useEffect(() => {
    if (isLoading || hasRedirected) return;
    
    if (user && !hasRedirected) {
      setHasRedirected(true);
      console.log("User authenticated, redirecting to app");
      
      // Store login timestamp to prevent redirect loops
      localStorage.setItem('recentLogin', Date.now().toString());
      
      // Force navigation to app with window.location for a clean state
      window.location.href = "/app";
    }
  }, [user, isLoading, navigate, hasRedirected]);

  const handleGoogleSignIn = async () => {
    try {
      const currentUrl = window.location.href;
      // Handle both cases: app.domain.com and domain.com
      const baseUrl = window.location.hostname.startsWith('app.')
        ? currentUrl.split('/signup')[0]
        : currentUrl.split('/signup')[0].replace('://', '://app.');
      
      // Store login timestamp to prevent redirect loops
      localStorage.setItem('recentLogin', Date.now().toString());
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/app?directSignup=true`,
          queryParams: {
            prompt: "select_account"
          }
        }
      });

      if (error) {
        throw error;
      }
      
      // No need to redirect here - the OAuth flow will handle it
      // The directSignup=true parameter will be used to show success toast after redirect
    } catch (error) {
      console.error("Error with Google sign in:", error);
      toast({
        title: "Authentication failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignUp = async (values: SignupFormValues) => {
    try {
      setIsSubmitting(true);
      const currentUrl = window.location.href;
      const baseUrl = window.location.hostname.startsWith('app.')
        ? currentUrl.split('/signup')[0]
        : currentUrl.split('/signup')[0].replace('://', '://app.');
      
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${baseUrl}/app?directSignup=true`,
          data: {
            signup_method: 'email',
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Signup successful",
        description: "Please check your email to verify your account.",
      });
      
    } catch (error: any) {
      console.error("Error with email sign up:", error);
      toast({
        title: "Signup failed",
        description: error.message || "Could not sign up with email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  // If user is already authenticated and we're waiting for redirect, show loading
  if (user && !hasRedirected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <section className="section-padding">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>Sign up to start using TRUSTY</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEmailSignUp)} className="space-y-4">
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
                        <Label htmlFor="password">Password</Label>
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
                    {isSubmitting ? "Creating Account..." : "Sign Up"}
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
                  className="w-full flex items-center gap-2 justify-center py-6"
                  onClick={handleGoogleSignIn}
                >
                  <FcGoogle className="h-6 w-6" />
                  <span>Continue with Google</span>
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex-col">
              <div className="text-center w-full mb-4">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/auth" className="text-primary-blue hover:underline">
                    Sign in
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

export default Signup;
