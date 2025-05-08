
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, navigate, isLoading]);

  const handleGoogleSignIn = async () => {
    try {
      const currentUrl = window.location.href;
      const baseUrl = currentUrl.split('/login')[0];
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: baseUrl,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error with Google sign in:', error);
      toast({
        title: "Authentication failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
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
              <CardTitle className="text-2xl">Log in to TRUSTY</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary-blue hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" type="password" />
                </div>
                <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Log in</Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-2 text-sm text-gray-500">or</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center py-6"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="h-6 w-6" />
                <span>Continue with Google</span>
              </Button>
            </CardContent>
            <CardFooter className="flex-col">
              <div className="text-center w-full mb-4">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
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

export default Login;
