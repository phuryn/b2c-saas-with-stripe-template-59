
/**
 * Stripe Configuration - Version 1.0.0
 * Last updated: 2025-05-22
 * Contains price IDs and customer portal URL
 */

export const STRIPE_CONFIG = {
  prices: {
    standard: {
      monthly: "price_1RRczPGYWeO9phTA4pg9WyoR",
      yearly: "price_1RRczPGYWeO9phTAFJIiJTwo",
      displayName: "Standard"
    },
    premium: {
      monthly: "price_1RRczQGYWeO9phTAWguc1JnN",
      yearly: "price_1RRczQGYWeO9phTA2BJ7YCyx",
      displayName: "Premium"
    }
  },
  customerPortalUrl: "https://billing.stripe.com/p/login/14AcN5amj66UbMW7NFcV200"
};
