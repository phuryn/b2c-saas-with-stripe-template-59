
/**
 * Get the subdomain from the current hostname
 */
export const getSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  
  // If we're on localhost, subdomain handling is different
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Extract subdomain from hostname
  const parts = hostname.split('.');
  
  // If we have at least 3 parts (subdomain.domain.tld)
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
};

/**
 * Check if the current domain is an app subdomain
 */
export const isAppDomain = (): boolean => {
  return getSubdomain() === 'app';
};
