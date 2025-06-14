
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { resetSubscriptionRateLimiting, forceNextSubscriptionCheck } from '@/utils/subscriptionRateLimit';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  userRole: 'administrator' | 'support' | 'user' | null;
  isLoading: boolean;
  userMetadata: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
  } | null;
  profile: {
    id: string;
    display_name: string | null;
    updated_at: string | null;
  } | null;
  updateProfile: (data: { display_name: string }) => Promise<void>;
  authProvider: 'email' | 'google' | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  userRole: null,
  isLoading: true,
  userMetadata: null,
  profile: null,
  updateProfile: async () => {},
  authProvider: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'administrator' | 'support' | 'user' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleCheckFailed, setRoleCheckFailed] = useState(false);
  const [userMetadata, setUserMetadata] = useState<{
    avatar_url?: string;
    full_name?: string;
    name?: string;
  } | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    display_name: string | null;
    updated_at: string | null;
  } | null>(null);
  const [authProvider, setAuthProvider] = useState<'email' | 'google' | null>(null);
  const { toast: shadcnToast } = useToast();

  // Function to safely fetch user role with error handling
  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching user role for:", userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        setRoleCheckFailed(true);
        return null;
      }
      
      if (data) {
        console.log("User role fetched successfully:", data.role);
        setUserRole(data.role);
        setRoleCheckFailed(false);
        return data.role;
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      setRoleCheckFailed(true);
      return null;
    }
  };

  // Function to safely fetch user profile with error handling
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (data) {
        console.log("User profile fetched successfully");
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set user metadata from auth provider
        if (session?.user) {
          const metadata = {
            avatar_url: session.user.user_metadata.avatar_url,
            full_name: session.user.user_metadata.full_name,
            name: session.user.user_metadata.name
          };
          setUserMetadata(metadata);
          
          // Determine auth provider
          if (session.user.app_metadata?.provider) {
            setAuthProvider(
              session.user.app_metadata.provider === 'google' ? 'google' : 'email'
            );
          } else {
            setAuthProvider('email');
          }
          
          // Fetch user role and profile data with setTimeout to avoid auth deadlocks
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("User authenticated, fetching role and profile data");
            setTimeout(() => {
              fetchUserRole(session.user.id);
              fetchUserProfile(session.user.id);
            }, 1000);
            
            // For explicit sign in events, force a subscription check
            if (event === 'SIGNED_IN') {
              console.log("Explicit sign in detected, resetting subscription rate limiting");
              
              // Force a new subscription check on the next request
              setTimeout(() => {
                forceNextSubscriptionCheck(session.user.id);
              }, 1500);
            }
          }

          // Show sign-in toast only for explicit sign-in events
          if (event === 'SIGNED_IN') {
            const params = new URLSearchParams(window.location.search);
            const isDirect = params.get('directLogin') === 'true';
            
            if (isDirect) {
              toast.success(`Welcome${session.user.email ? ', ' + session.user.email : ''}!`);
            }
          }
        } else {
          setUserRole(null);
          setUserMetadata(null);
          setProfile(null);
          setAuthProvider(null);
          
          // Remove "You have been signed out" toast - This is the first part we're removing
          if (event === 'SIGNED_OUT') {
            // Clear any stored login timestamps
            localStorage.removeItem('recentLogin');
            
            // Reset application state after sign out
            setUserRole(null);
            setUserMetadata(null);
            setProfile(null);
            setAuthProvider(null);
            
            // Clear subscription data
            resetSubscriptionRateLimiting();
          }
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("Found existing session for user:", session.user.id);
          
          const metadata = {
            avatar_url: session.user.user_metadata.avatar_url,
            full_name: session.user.user_metadata.full_name,
            name: session.user.user_metadata.name
          };
          setUserMetadata(metadata);
          
          // Determine auth provider
          if (session.user.app_metadata?.provider) {
            setAuthProvider(
              session.user.app_metadata.provider === 'google' ? 'google' : 'email'
            );
          } else {
            setAuthProvider('email');
          }
          
          // Fetch additional user data with a delay to ensure auth is ready
          setTimeout(async () => {
            await fetchUserRole(session.user.id);
            await fetchUserProfile(session.user.id);
          }, 1000);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Retry fetching user role if it failed initially
    if (user && roleCheckFailed) {
      const retryInterval = setInterval(() => {
        if (user && roleCheckFailed) {
          console.log("Retrying to fetch user role");
          fetchUserRole(user.id);
        } else {
          clearInterval(retryInterval);
        }
      }, 5000); // Retry every 5 seconds
      
      return () => {
        clearInterval(retryInterval);
        subscription.unsubscribe();
      };
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [roleCheckFailed]);

  const updateProfile = async (data: { display_name: string }) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh profile data
      await fetchUserProfile(user.id);
      
      toast.success("Your profile has been updated successfully");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "There was a problem updating your profile");
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user");
      
      // Clear local storage items first
      localStorage.removeItem('recentLogin');
      
      // Reset subscription rate limiting before sign out
      resetSubscriptionRateLimiting();
      
      // Force token refresh before sign out to ensure we have a valid token
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        console.warn('Session refresh failed:', refreshError);
        // Continue with signout anyway
      }
      
      // Try local sign out first
      try {
        await supabase.auth.signOut({ scope: 'local' });
        console.log('Local sign out successful');
      } catch (localError) {
        console.warn('Local sign out failed:', localError);
        // Continue with navigation anyway
      }
      
      // Remove "You have been signed out" toast here as well
      // Force navigation after sign out regardless of API response
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("There was a problem signing you out. Please try refreshing the page.");
      
      // Force navigation even if there was an error
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signOut,
        userRole,
        isLoading,
        userMetadata,
        profile,
        updateProfile,
        authProvider,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
