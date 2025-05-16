
export const STRIPE_CONFIG = {
  prices: {
    standard: {
      monthly: "price_1RLoRRLdL9hht8n4Gcqi3p2b", // $10/month standard plan
      yearly: "price_1RLoT5LdL9hht8n4n87AoFtZ",  // $100/year standard plan
      displayName: "Standard"
    },
    premium: {
      monthly: "price_1RLoRrLdL9hht8n4LZcdyKQt", // $20/month premium plan
      yearly: "price_1RLoScLdL9hht8n4hSQtsOte",  // $200/year premium plan
      displayName: "Premium"
    }
  },
  customerPortalUrl: "https://billing.stripe.com/p/login/7sIaER27X5UWdaMeUU"
};
