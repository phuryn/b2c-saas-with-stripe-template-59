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
  RETRY_DELAY,
  getCachedSubscriptionData
} from '@/utils/subscriptionRateLimit';

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
      const storedSubscription = localStorage.getItem('last_known_subscription');
      return storedSubscription ? JSON.parse(storedSubscription) : null;
    } catch (e) {
      console.warn('Error reading subscription from localStorage:', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(!subscription); // Only show loading if no cached data
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [pageInitialLoad, setPageInitialLoad] = useState(true);
  
  // Tracking for rate limiting
  const lastAttemptRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const debounceTimerRef = useRef<number | null>(null);
  const checkInProgressRef = useRef<boolean>(false); // Track if a check is already in progress
  const lastCheckedUserIdRef = useRef<string | null>(null); // Track the last user ID that was checked

  /**
   * Fetch subscription status from API
   */
  const checkSubscriptionStatus = useCallback(async (force = false) => {
    // Don't check subscription if user is not authenticated
    if (!user) {
      console.log('Skipping subscription check - user not authenticated');
      return subscription;  // Return cached subscription
    }

    // Don't allow concurrent checks
    if (checkInProgressRef.current) {
      console.log('Skipping subscription check - another check already in progress');
      return subscription;
    }
    
    // Check if this is a different user than last time - if so, force a check
    const userIdChanged = lastCheckedUserIdRef.current && lastCheckedUserIdRef.current !== user.id;
    if (userIdChanged) {
      console.log(`User changed from ${lastCheckedUserIdRef.current} to ${user.id}, forcing check`);
      force = true;
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
      checkInProgressRef.current = true;
      setLoading(prev => !subscription && prev); // Only show loading if no cached data
      setRefreshing(true);
      lastAttemptRef.current = Date.now();
      lastCheckedUserIdRef.current = user.id; // Update last checked user ID
      
      console.log('Fetching subscription status...');
      const data = await fetchSubscriptionStatus();
      console.log('Subscription status fetched:', data);
      
      // Update last check timestamp
      updateLastCheckTimestamp();
      
      // Reset error state and retry count on success
      setErrorState(false);
      retryCountRef.current = 0;
      setSubscription(data);
      
      // Store subscription state in localStorage for future reference
      if (data) {
        localStorage.setItem('last_known_subscription', JSON.stringify(data));
        
        if (data?.subscribed) {
          localStorage.setItem('hasActiveSubscription', 'true');
        } else {
          localStorage.removeItem('hasActiveSubscription');
        }
      }
      
      // Clear page initial load flag
      setPageInitialLoad(false);
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
      checkInProgressRef.current = false;
    }
  }, [errorState, subscription, user, pageInitialLoad]);

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

  // Check for URL changes to detect billing/plan page navigation
  useEffect(() => {
    const isBillingPage = window.location.pathname.includes('/billing');
    const isPlanPage = window.location.pathname.includes('/plan');
    
    // Only check on first visit to billing/plan pages in this session
    if ((isBillingPage || isPlanPage) && pageInitialLoad) {
      // Force check on billing/plan page navigation
      setPageInitialLoad(true);
      if (user && !authLoading && !checkInProgressRef.current) {
        console.log(`Navigated to ${isBillingPage ? 'billing' : 'plan'} page, forcing subscription check`);
        checkSubscriptionStatus(true);
      }
    }
  }, [window.location.pathname, user, authLoading, checkSubscriptionStatus, pageInitialLoad]);

  // Initial subscription check when auth state changes
  useEffect(() => {
    // Only check subscription if user is authenticated and auth loading is complete
    if (user && !authLoading && pageInitialLoad && !checkInProgressRef.current) {
      console.log("Auth confirmed, checking subscription status once");
      // Check if user has changed since last check - we need the localStorage value here as well
      const storedLastUserId = localStorage.getItem('last_checked_user_id');
      const forceCheck = storedLastUserId !== user.id;
      
      if (forceCheck) {
        console.log(`User changed from ${storedLastUserId} to ${user.id}, forcing check`);
      }
      
      checkSubscriptionStatus(forceCheck);
      
      // Update localStorage with current user ID
      localStorage.setItem('last_checked_user_id', user.id);
    } else if (!user && !authLoading) {
      // Clear subscription state when logged out
      setSubscription(null);
      localStorage.removeItem('last_known_subscription');
      localStorage.removeItem('hasActiveSubscription');
      localStorage.removeItem('last_checked_user_id');
    }
    
    // Cleanup debounce timer
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user, authLoading, checkSubscriptionStatus, pageInitialLoad]);

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
