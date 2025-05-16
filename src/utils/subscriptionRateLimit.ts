
/**
 * Utility functions for subscription rate limiting and error handling
 */

// Constants for rate limiting
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 5000; // 5 seconds between retries
export const DEBOUNCE_DELAY = 300; // 300ms debounce period
export const CHECK_INTERVAL = 300000; // 5 minutes (300,000ms) between subscription checks

/**
 * Checks if a request should be rate-limited based on last attempt time
 */
export const shouldSkipRequest = (
  lastAttempt: number,
  isErrorState: boolean,
  retryDelay: number = RETRY_DELAY
): boolean => {
  const now = Date.now();
  return isErrorState && now - lastAttempt < retryDelay;
};

/**
 * Debounces function calls
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number = DEBOUNCE_DELAY
) => {
  let timeout: number;
  
  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = window.setTimeout(() => {
        const result = func(...args) as ReturnType<F>;
        resolve(result);
      }, waitFor);
    });
  };
};

/**
 * Checks if enough time has passed since last subscription check
 */
export const shouldCheckSubscription = (forceCheck: boolean = false): boolean => {
  try {
    if (forceCheck) return true;
    
    // Special case: Always check on billing pages
    if (window.location.pathname.includes('/billing') || 
        window.location.pathname.includes('/plan')) {
      return true;
    }
    
    const lastCheck = Number(localStorage.getItem('last_subscription_check') || 0);
    const now = Date.now();
    
    // Allow checking if:
    // 1. Never checked before (lastCheck is 0)
    // 2. Enough time has passed since last check
    return lastCheck === 0 || (now - lastCheck) > CHECK_INTERVAL;
  } catch (e) {
    return true;
  }
};

/**
 * Updates the last check timestamp
 */
export const updateLastCheckTimestamp = (): void => {
  try {
    localStorage.setItem('last_subscription_check', Date.now().toString());
  } catch (e) {
    console.warn('Could not update last subscription check timestamp:', e);
  }
};

/**
 * Handles subscription error state
 */
export const handleSubscriptionError = (
  error: unknown, 
  retryCount: number,
  setErrorState: (state: boolean) => void,
  showErrorToast: boolean = false
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Error checking subscription status:', errorMessage);
  
  // Only set error state if retry count exceeds threshold
  if (retryCount >= MAX_RETRIES) {
    setErrorState(true);
  }
  
  // Only show error toast when specifically requested
  // This is handled by the calling code
};

/**
 * Get cached subscription data
 */
export const getCachedSubscriptionData = () => {
  try {
    const cachedData = localStorage.getItem('last_known_subscription');
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (e) {
    console.warn('Error reading cached subscription data:', e);
    return null;
  }
};

/**
 * Reset subscription rate limiting state
 */
export const resetSubscriptionRateLimiting = () => {
  localStorage.removeItem('last_subscription_check');
};
