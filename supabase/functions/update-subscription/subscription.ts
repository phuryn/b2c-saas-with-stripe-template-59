
import Stripe from "https://esm.sh/stripe@14.21.0";
import { logStep } from "./utils.ts";

export async function cancelSubscription(stripe: Stripe, subscriptionId: string) {
  logStep("Scheduling subscription for cancellation at period end");
  const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  
  logStep("Subscription scheduled for cancellation at period end", {
    subscriptionId,
    cancel_at_period_end: canceledSubscription.cancel_at_period_end,
    current_period_end: new Date(canceledSubscription.current_period_end * 1000)
  });
  
  return { 
    id: canceledSubscription.id,
    current_period_end: new Date(canceledSubscription.current_period_end * 1000),
    cancel_at_period_end: canceledSubscription.cancel_at_period_end,
    action: "canceled_subscription"
  };
}

export async function renewSubscription(stripe: Stripe, subscriptionId: string) {
  logStep("Renewing subscription");
  const renewedSubscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  
  logStep("Subscription renewed", {
    subscriptionId,
    cancel_at_period_end: renewedSubscription.cancel_at_period_end,
    current_period_end: new Date(renewedSubscription.current_period_end * 1000)
  });
  
  return { 
    id: renewedSubscription.id,
    current_period_end: new Date(renewedSubscription.current_period_end * 1000),
    cancel_at_period_end: renewedSubscription.cancel_at_period_end,
    action: "renewed_subscription"
  };
}

export async function updateSubscriptionPrice(
  stripe: Stripe, 
  subscriptionId: string, 
  subscriptionItemId: string,
  newPriceId: string
) {
  logStep("Updating subscription with new price", { newPriceId });
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscriptionItemId,
      price: newPriceId,
    }],
    proration_behavior: "create_prorations",
  });
  logStep("Subscription updated successfully");

  return { 
    id: updatedSubscription.id,
    current_period_end: new Date(updatedSubscription.current_period_end * 1000),
    plan: updatedSubscription.items.data[0].price.id,
    action: "updated_subscription"
  };
}

export function checkIfPriceChanged(subscription: Stripe.Subscription, newPriceId: string): boolean {
  return subscription.items.data[0].price.id !== newPriceId;
}
