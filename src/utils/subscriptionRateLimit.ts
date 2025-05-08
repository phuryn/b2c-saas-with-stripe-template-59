
/**
 * Utility functions for subscription rate limiting and error handling
 */

// Constants for rate limiting
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 5000; // 5 seconds between retries

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
  
  // Only show error toast when specifically requested
  if (showErrorToast) {
    setErrorState(true);
  }
};
