
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Subscription } from '@/types/subscription';
import { fetchSubscriptionStatus } from '@/api/subscriptionApi';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { useAuth } from '@/context/AuthContext';
import { 
  shouldCheckSubscription,
  handleSubscriptionError,
  updateLastCheckTimestamp,
  getCachedSubscriptionData,
  isCheckInProgress,
  setCheckInProgress,
  CACHED_SUB_DATA_KEY,
  HAS_ACTIVE_SUB_KEY,
  trackSubscriptionChange
} from '@/utils/subscriptionRateLimit';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshing: boolean;
  subscriptionLoading: boolean;
  checkSubscriptionStatus: (force?: boolean) => Promise<Subscription | null>;
  refreshSubscriptionData: () => void;
  handleSelectPlan: (planId: string, cycle: 'monthly' | 'yearly') => Promise<any>;
  openCustomerPortal: () => Promise<boolean>;
  handleDowngrade: () => Promise<boolean>;
  handleRenewSubscription: () => Promise<boolean>;
  trackSubscriptionChange: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  
  // State
  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    return getCachedSubscriptionData();
  });
  const [loading, setLoading] = useState(!subscription);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  // Import subscription actions
  const { 
    subscriptionLoading,
    handleSelectPlan: baseHandleSelectPlan,
    openCustomerPortal,
    handleDowngrade: baseHandleDowngrade,
    handleRenewSubscription: baseHandleRenewSubscription 
  } = useSubscriptionActions();

  /**
   * Fetch subscription status from API with enhanced rate limiting
   */
  const checkSubscriptionStatus = useCallback(async (force = false) => {
    // Don't check subscription if user is not authenticated
    if (!user) {
      console.log('Skipping subscription check - user not authenticated');
      return subscription;
    }

    // Prevent multiple simultaneous checks
    if (isCheckInProgress()) {
      console.log('Subscription check already in progress, skipping');
      return subscription;
    }

    // Check if we should run the check based on timing and context
    if (!force && !shouldCheckSubscription(false, location.pathname)) {
      console.log('Skipping subscription check due to rate limiting', { path: location.pathname, time: new Date().toISOString() });
      return subscription;
    }

    try {
      setLoading(prev => !subscription && prev);
      setRefreshing(true);
      setCheckInProgress(true);
      
      console.log('Fetching subscription status...', { forced: force, path: location.pathname });
      const data = await fetchSubscriptionStatus();
      console.log('Subscription status fetched:', data);
      
      // Update last check timestamp
      updateLastCheckTimestamp();
      
      // Reset error state and retry count on success
      setErrorState(false);
      setRetryCount(0);
      setSubscription(data);
      
      // Store subscription state in localStorage for future reference
      if (data) {
        localStorage.setItem(CACHED_SUB_DATA_KEY, JSON.stringify(data));
        
        if (data?.subscribed) {
          localStorage.setItem(HAS_ACTIVE_SUB_KEY, 'true');
        } else {
          localStorage.removeItem(HAS_ACTIVE_SUB_KEY);
        }
      }
      
      return data;
    } catch (err) {
      setRetryCount(prev => prev + 1);
      
      // Get more detailed error information
      const errorDetails = err instanceof Error ? err.message : String(err);
      console.error(`Error checking subscription status: ${errorDetails}`, err);
      
      handleSubscriptionError(err, retryCount, setErrorState, !errorState);
      
      // Only show error toast on initial errors, not on every retry
      if (!errorState && retryCount > 1) {
        toast.error(`Failed to retrieve subscription information. ${errorDetails}`);
      }
      
      // Return cached subscription on error
      return subscription;
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCheckInProgress(false);
    }
  }, [errorState, subscription, user, location.pathname, retryCount]);

  /**
   * Refresh subscription data with debouncing
   */
  const refreshSubscriptionData = useCallback(() => {
    if (refreshing || !user) return;
    
    // Clear any existing debounce timer
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }
    
    // Set refreshing state immediately for UI feedback
    setRefreshing(true);
    
    // Debounce the actual API call
    const timer = window.setTimeout(async () => {
      try {
        // Reset error state when manually refreshing
        setErrorState(false);
        await checkSubscriptionStatus(true);
      } catch (err) {
        const errorDetails = err instanceof Error ? err.message : String(err);
        console.error('Error refreshing subscription data:', err);
        toast.error(`Could not refresh subscription information: ${errorDetails}`);
      } finally {
        setRefreshing(false);
        setDebounceTimer(null);
      }
    }, 300); // 300ms debounce
    
    setDebounceTimer(timer);
  }, [refreshing, user, checkSubscriptionStatus, debounceTimer]);

  // Enhanced handlers that track subscription changes
  const handleSelectPlan = async (planId: string, cycle: 'monthly' | 'yearly') => {
    const result = await baseHandleSelectPlan(planId, cycle);
    if (result?.success) {
      trackSubscriptionChange();
    }
    return result;
  };

  const handleDowngrade = async () => {
    const result = await baseHandleDowngrade();
    if (result) {
      trackSubscriptionChange();
    }
    return result;
  };

  const handleRenewSubscription = async () => {
    const result = await baseHandleRenewSubscription();
    if (result) {
      trackSubscriptionChange();
    }
    return result;
  };

  // Initial subscription check when auth state changes
  useEffect(() => {
    if (user && !authLoading) {
      console.log("Auth confirmed, checking subscription status once");
      checkSubscriptionStatus(false);
    } else if (!user && !authLoading) {
      // Clear subscription state when logged out
      setSubscription(null);
      localStorage.removeItem(CACHED_SUB_DATA_KEY);
      localStorage.removeItem(HAS_ACTIVE_SUB_KEY);
    }
    
    return () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
    };
  }, [user, authLoading]);

  // Listen for route changes to detect billing page navigation
  useEffect(() => {
    const isBillingPage = location.pathname.includes('/billing') || location.pathname.includes('/plan');
    if (isBillingPage && user && !authLoading) {
      console.log('Navigated to billing page, checking subscription if needed');
      checkSubscriptionStatus(false);
    }
  }, [location.pathname, user, authLoading]);
  
  const value = {
    subscription,
    loading: loading || (authLoading && !subscription),
    refreshing,
    subscriptionLoading,
    checkSubscriptionStatus,
    refreshSubscriptionData,
    handleSelectPlan,
    openCustomerPortal,
    handleDowngrade,
    handleRenewSubscription,
    trackSubscriptionChange
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
