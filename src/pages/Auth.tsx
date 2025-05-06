
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '@/components/ui/use-toast';

const Auth: React.FC = () => {
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
      // Get the current URL's origin to use as the redirect URL
      const redirectTo = window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            // Force a fresh login prompt even if the user is already logged in
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
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Continue with your Google account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-center py-6"
                  onClick={handleGoogleSignIn}
                >
                  <FcGoogle className="h-6 w-6" />
                  <span>Continue with Google</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Auth;
