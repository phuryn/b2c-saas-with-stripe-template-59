
export const STRIPE_CONFIG = {
  prices: {
    standard: {
      monthly: "price_1RLoRrLdL9hht8n4LZcdyKQt", // This is actually the $20 premium plan
      yearly: "price_1RLoScLdL9hht8n4hSQtsOte", 
      displayName: "Standard"
    },
    premium: {
      monthly: "price_1RLoRRLdL9hht8n4Gcqi3p2b", // This is actually the $10 standard plan
      yearly: "price_1RLoT5LdL9hht8n4n87AoFtZ",
      displayName: "Premium"
    }
  },
  customerPortalUrl: "https://billing.stripe.com/p/login/7sIaER27X5UWdaMeUU"
};
