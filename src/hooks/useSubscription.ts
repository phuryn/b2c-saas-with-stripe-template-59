
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Subscription } from '@/types/subscription';
import { fetchSubscriptionStatus } from '@/api/subscriptionApi';
import { useSubscriptionActions } from './useSubscriptionActions';
import { useAuth } from '@/context/AuthContext';
import { 
  shouldSkipRequest, 
  handleSubscriptionError,
  shouldCheckSubscription,
  updateLastCheckTimestamp,
  MAX_RETRIES,
  RETRY_DELAY 
} from '@/utils/subscriptionRateLimit';

// Store last known subscription state in localStorage
const SUBSCRIPTION_STORAGE_KEY = 'last_known_subscription';

/**
 * Hook for managing subscription state and operations
 */
export function useSubscription() {
  // Get auth context to check if user is authenticated
  const { user, isLoading: authLoading } = useAuth();
  
  // State
  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    // Try to initialize from localStorage if available
    try {
      const storedSubscription = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      return storedSubscription ? JSON.parse(storedSubscription) : null;
    } catch (e) {
      console.warn('Error reading subscription from localStorage:', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(!subscription); // Only show loading if no cached data
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(false);
  
  // Tracking for rate limiting
  const lastAttemptRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const debounceTimerRef = useRef<number | null>(null);

  /**
   * Fetch subscription status from API
   */
  const checkSubscriptionStatus = useCallback(async (force = false) => {
    // Don't check subscription if user is not authenticated
    if (!user) {
      console.log('Skipping subscription check - user not authenticated');
      return subscription;  // Return cached subscription
    }

    // Rate limiting and debouncing protection
    if (!force && !shouldCheckSubscription(force)) {
      console.log('Skipping subscription check due to rate limiting', new Date().toISOString());
      return subscription;  // Return cached subscription
    }
    
    // Additional rate limiting protection
    if (shouldSkipRequest(lastAttemptRef.current, errorState)) {
      console.log('Skipping subscription check due to recent error');
      return subscription;  // Return cached subscription
    }

    try {
      setLoading(prev => !subscription && prev); // Only show loading if no cached data
      lastAttemptRef.current = Date.now();
      
      const data = await fetchSubscriptionStatus();
      
      // Update last check timestamp
      updateLastCheckTimestamp();
      
      // Reset error state and retry count on success
      setErrorState(false);
      retryCountRef.current = 0;
      setSubscription(data);
      
      // Store subscription state in localStorage for future reference
      if (data) {
        localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(data));
        
        if (data?.subscribed) {
          localStorage.setItem('hasActiveSubscription', 'true');
        } else {
          localStorage.removeItem('hasActiveSubscription');
        }
      }
      
      return data;
    } catch (err) {
      retryCountRef.current++;
      
      // Get more detailed error information
      const errorDetails = err instanceof Error ? err.message : String(err);
      console.error(`Error checking subscription status: ${errorDetails}`, err);
      
      handleSubscriptionError(err, retryCountRef.current, setErrorState, !errorState);
      
      // Only show error toast on initial errors, not on every retry
      if (!errorState && retryCountRef.current > 1) {
        toast.error(`Failed to retrieve subscription information. ${errorDetails}`);
      }
      
      // Return cached subscription on error
      return subscription;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [errorState, subscription, user]);

  /**
   * Refresh subscription data with debouncing
   */
  const refreshSubscriptionData = useCallback(() => {
    if (refreshing || !user) return;
    
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    // Set refreshing state immediately for UI feedback
    setRefreshing(true);
    
    // Debounce the actual API call
    debounceTimerRef.current = window.setTimeout(async () => {
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
        debounceTimerRef.current = null;
      }
    }, 300); // 300ms debounce
    
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [refreshing, user, checkSubscriptionStatus]);

  // Import subscription actions
  const { 
    subscriptionLoading,
    handleSelectPlan,
    openCustomerPortal,
    handleDowngrade,
    handleRenewSubscription 
  } = useSubscriptionActions();

  // Initial subscription check when auth state changes
  useEffect(() => {
    // Only check subscription if user is authenticated and auth loading is complete
    if (user && !authLoading) {
      console.log("Auth confirmed, checking subscription status once");
      checkSubscriptionStatus(false);
    } else if (!user && !authLoading) {
      // Clear subscription state when logged out
      setSubscription(null);
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      localStorage.removeItem('hasActiveSubscription');
    }
    
    // Cleanup debounce timer
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user, authLoading, checkSubscriptionStatus]);

  return {
    subscription,
    loading: loading || (authLoading && !subscription),
    refreshing,
    subscriptionLoading,
    checkSubscriptionStatus,
    refreshSubscriptionData,
    handleSelectPlan,
    openCustomerPortal,
    handleDowngrade,
    handleRenewSubscription
  };
}
