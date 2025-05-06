import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  userRole: null,
  isLoading: true,
  userMetadata: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'administrator' | 'support' | 'user' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userMetadata, setUserMetadata] = useState<{
    avatar_url?: string;
    full_name?: string;
    name?: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set user metadata from Google auth
        if (session?.user) {
          const metadata = {
            avatar_url: session.user.user_metadata.avatar_url,
            full_name: session.user.user_metadata.full_name,
            name: session.user.user_metadata.name
          };
          setUserMetadata(metadata);
          
          // Fetch user role if we have a user
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);

          // Only redirect on explicit sign-in events, not on initial session check
          if (event === 'SIGNED_IN' && window.location.pathname === '/') {
            window.location.href = '/app';
          }
        } else {
          setUserRole(null);
          setUserMetadata(null);
          
          // If signed out, redirect to home
          if (event === 'SIGNED_OUT') {
            window.location.href = '/';
          }
        }
        
        // Show notification on specific auth events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Signed in successfully",
            description: `Welcome${session?.user?.email ? ', ' + session.user.email : ''}!`,
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been signed out.",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const metadata = {
          avatar_url: session.user.user_metadata.avatar_url,
          full_name: session.user.user_metadata.full_name,
          name: session.user.user_metadata.name
        };
        setUserMetadata(metadata);
        fetchUserRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }
      
      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Redirection will be handled by onAuthStateChange
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
