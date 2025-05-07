
import Stripe from "https://esm.sh/stripe@14.21.0";
import { logStep } from "./utils.ts";

export async function getStripeCustomer(stripe: Stripe, email: string) {
  logStep("Searching for customer");
  const customers = await stripe.customers.list({ email, limit: 1 });
  
  if (customers.data.length > 0) {
    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });
    return customerId;
  } else {
    // Create a new customer if one doesn't exist
    logStep("No customer found, creating new customer");
    const newCustomer = await stripe.customers.create({
      email,
      metadata: {
        created_by: "update-subscription-function"
      }
    });
    logStep("New customer created", { customerId: newCustomer.id });
    return newCustomer.id;
  }
}

export async function getActiveSubscription(stripe: Stripe, customerId: string) {
  logStep("Searching for active subscription");
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return null;
  }

  const subscriptionId = subscriptions.data[0].id;
  logStep("Active subscription found", { subscriptionId });
  return subscriptions.data[0];
}

export async function createNewSubscription(stripe: Stripe, customerId: string, priceId: string) {
  logStep("No active subscription, creating new subscription");
  const newSubscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });

  const invoice = newSubscription.latest_invoice;
  let clientSecret = null;

  if (typeof invoice !== 'string' && 
      invoice?.payment_intent && 
      typeof invoice.payment_intent !== 'string') {
    clientSecret = invoice.payment_intent.client_secret;
  }

  return { 
    id: newSubscription.id, 
    status: newSubscription.status, 
    client_secret: clientSecret,
    action: "new_subscription"
  };
}
