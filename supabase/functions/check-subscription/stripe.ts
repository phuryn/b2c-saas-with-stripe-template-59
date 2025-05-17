
import Stripe from "https://esm.sh/stripe@14.21.0";
import { logStep } from "./logger.ts";
import { STRIPE_CONFIG } from "../shared/stripe-config.ts";

/**
 * Returns an initialized Stripe client
 */
export const getStripeClient = async (): Promise<Stripe> => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
  logStep("Stripe key verified");
  
  return new Stripe(stripeKey, { apiVersion: "2023-10-16" });
};

// Export STRIPE_CONFIG for use in other files
export { STRIPE_CONFIG };
