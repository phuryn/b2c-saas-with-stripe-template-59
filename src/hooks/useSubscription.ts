
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Subscription } from '@/types/subscription';
import { fetchSubscriptionStatus } from '@/api/subscriptionApi';
import { useSubscriptionActions } from './useSubscriptionActions';
import { 
  shouldSkipRequest, 
  handleSubscriptionError,
  MAX_RETRIES,
  RETRY_DELAY 
} from '@/utils/subscriptionRateLimit';

/**
 * Hook for managing subscription state and operations
 */
export function useSubscription() {
  // State
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState(false);
  
  // Tracking for rate limiting
  const lastAttemptRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  
  // Import subscription actions
  const { 
    subscriptionLoading,
    handleSelectPlan,
    openCustomerPortal,
    handleDowngrade,
    handleRenewSubscription 
  } = useSubscriptionActions();

  /**
   * Fetch subscription status from API
   */
  const checkSubscriptionStatus = useCallback(async () => {
    // Rate limiting protection
    if (shouldSkipRequest(lastAttemptRef.current, errorState)) {
      console.log('Skipping subscription check due to recent error');
      return null;
    }

    try {
      setLoading(true);
      lastAttemptRef.current = Date.now();
      
      const data = await fetchSubscriptionStatus();
      
      // Reset error state and retry count on success
      setErrorState(false);
      retryCountRef.current = 0;
      setSubscription(data);
      
      // Store subscription state in localStorage for future reference
      if (data?.subscribed) {
        localStorage.setItem('hasActiveSubscription', 'true');
      } else {
        localStorage.removeItem('hasActiveSubscription');
      }
      
      return data;
    } catch (err) {
      retryCountRef.current++;
      
      // Get more detailed error information
      const errorDetails = err instanceof Error ? err.message : String(err);
      console.error(`Error checking subscription status: ${errorDetails}`, err);
      
      handleSubscriptionError(err, retryCountRef.current, setErrorState, !errorState);
      
      // Only show error toast on initial errors, not on every retry
      if (!errorState) {
        toast.error(`Failed to retrieve subscription information. ${errorDetails}`);
      }
      
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [errorState]);

  /**
   * Refresh subscription data
   */
  const refreshSubscriptionData = async () => {
    if (refreshing) return;
    
    // Reset error state when manually refreshing
    setErrorState(false);
    setRefreshing(true);
    
    try {
      const data = await checkSubscriptionStatus();
      if (data) {
        toast.success('Subscription info refreshed');
      }
    } catch (err) {
      const errorDetails = err instanceof Error ? err.message : String(err);
      console.error('Error refreshing subscription data:', err);
      toast.error(`Could not refresh subscription information: ${errorDetails}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial subscription check
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  return {
    subscription,
    loading,
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
