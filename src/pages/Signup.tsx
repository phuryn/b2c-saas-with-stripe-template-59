
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";
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

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Only redirect if user explicitly signed up through this page, not for existing sessions
  useEffect(() => {
    // Checking URL parameter for direct signup attempt
    const params = new URLSearchParams(window.location.search);
    const directSignup = params.get('directSignup') === 'true';
    
    // Only redirect if this is a direct signup attempt and user is authenticated
    if (directSignup && user && !isLoading) {
      navigate("/app");
    }
  }, [user, navigate, isLoading]);

  const handleGoogleSignIn = async () => {
    try {
      const currentUrl = window.location.href;
      // Handle both cases: app.domain.com and domain.com
      const baseUrl = window.location.hostname.startsWith('app.')
        ? currentUrl.split('/signup')[0]
        : currentUrl.split('/signup')[0].replace('://', '://app.');
      
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
    } catch (error) {
      console.error("Error with Google sign in:", error);
      toast({
        title: "Authentication failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      const currentUrl = window.location.href;
      const baseUrl = window.location.hostname.startsWith('app.')
        ? currentUrl.split('/signup')[0]
        : currentUrl.split('/signup')[0].replace('://', '://app.');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
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
    } catch (error) {
      console.error("Error with LinkedIn sign in:", error);
      toast({
        title: "Authentication failed",
        description: "Could not sign in with LinkedIn. Please try again.",
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
                
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2 justify-center py-6"
                  onClick={handleLinkedInSignIn}
                >
                  <FaLinkedin className="h-6 w-6 text-[#0A66C2]" />
                  <span>Continue with LinkedIn</span>
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-center w-full">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/auth" className="text-primary-blue hover:underline">
                    Sign in
                  </Link>
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
