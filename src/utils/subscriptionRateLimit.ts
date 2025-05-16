
/**
 * Utility functions for subscription rate limiting and error handling
 */

// Constants for rate limiting - updated for optimized caching strategy
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 5000; // 5 seconds between retries
export const DEBOUNCE_DELAY = 300; // 300ms debounce period

// Tiered caching strategy
export const SHORT_CACHE_INTERVAL = 60000; // 1 minute (for billing pages)
export const MEDIUM_CACHE_INTERVAL = 300000; // 5 minutes (after subscription changes)
export const LONG_CACHE_INTERVAL = 600000; // 10 minutes (normal operations)

// Default check interval now 10 minutes instead of 5
export const CHECK_INTERVAL = LONG_CACHE_INTERVAL;

// Storage keys
export const LAST_CHECK_KEY = 'last_subscription_check';
export const LAST_SUB_CHANGE_KEY = 'last_subscription_change';
export const CACHED_SUB_DATA_KEY = 'last_known_subscription';
export const HAS_ACTIVE_SUB_KEY = 'hasActiveSubscription';

/**
 * Tracks when subscription changes occur
 */
export const trackSubscriptionChange = (): void => {
  try {
    localStorage.setItem(LAST_SUB_CHANGE_KEY, Date.now().toString());
    // Force a check on the next page load
    localStorage.removeItem(LAST_CHECK_KEY);
  } catch (e) {
    console.warn('Could not track subscription change:', e);
  }
};

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
 * Determines appropriate check interval based on context
 */
export const getCheckInterval = (pathname: string): number => {
  // Recently made subscription changes get medium cache
  try {
    const lastSubChange = Number(localStorage.getItem(LAST_SUB_CHANGE_KEY) || 0);
    if (lastSubChange > 0) {
      const timeSinceChange = Date.now() - lastSubChange;
      // If change was made in the last 30 minutes, use medium cache interval
      if (timeSinceChange < 1800000) { // 30 minutes
        return MEDIUM_CACHE_INTERVAL;
      }
    }
  } catch (e) {
    // Ignore storage errors and continue with checks
  }
  
  // Special case: Billing pages get short cache
  if (pathname.includes('/billing') || 
      pathname.includes('/plan') || 
      pathname.includes('/subscribe')) {
    return SHORT_CACHE_INTERVAL;
  }
  
  // Default to long cache for regular app usage
  return LONG_CACHE_INTERVAL;
};

/**
 * Checks if enough time has passed since last subscription check
 */
export const shouldCheckSubscription = (forceCheck: boolean = false, pathname: string = window.location.pathname): boolean => {
  try {
    if (forceCheck) return true;
    
    // Special case: Always check on billing pages on initial load
    if ((pathname.includes('/billing') || pathname.includes('/plan')) && 
        !sessionStorage.getItem('billing_page_checked')) {
      sessionStorage.setItem('billing_page_checked', 'true');
      return true;
    }
    
    const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
    const now = Date.now();
    const interval = getCheckInterval(pathname);
    
    // Allow checking if:
    // 1. Never checked before (lastCheck is 0)
    // 2. Enough time has passed since last check based on context
    // 3. Force check is requested
    return lastCheck === 0 || (now - lastCheck) > interval;
  } catch (e) {
    return true;
  }
};

/**
 * Updates the last check timestamp
 */
export const updateLastCheckTimestamp = (): void => {
  try {
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
    
    // Clear billing page check flag when updating timestamp
    // This allows for fresh checks when revisiting billing pages
    if (window.location.pathname.includes('/billing') || 
        window.location.pathname.includes('/plan')) {
      sessionStorage.removeItem('billing_page_checked');
    }
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
    const cachedData = localStorage.getItem(CACHED_SUB_DATA_KEY);
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
  localStorage.removeItem(LAST_CHECK_KEY);
};

/**
 * Check if subscription check is currently in progress
 * Used to prevent multiple simultaneous checks
 */
let checkInProgress = false;

export const isCheckInProgress = (): boolean => {
  return checkInProgress;
};

export const setCheckInProgress = (value: boolean): void => {
  checkInProgress = value;
};
