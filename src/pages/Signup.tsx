
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already authenticated, redirect to app
    if (user && !isLoading) {
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
          redirectTo: baseUrl + '/app',
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
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center py-6"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="h-6 w-6" />
                <span>Continue with Google</span>
              </Button>
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
