
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

export async function scheduleSubscriptionUpdate(
  stripe: Stripe,
  subscriptionId: string,
  subscriptionItemId: string,
  newPriceId: string
) {
  logStep("Scheduling subscription update for end of billing cycle", { newPriceId });
  
  // Get current subscription to determine the end date
  const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(currentSubscription.current_period_end * 1000);
  
  // Update with proration_behavior set to none to take effect at the end of billing cycle
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscriptionItemId,
      price: newPriceId,
    }],
    proration_behavior: "none",
    billing_cycle_anchor: "unchanged",
    // Set metadata for tracking pending changes
    metadata: {
      pending_change: "true",
      pending_change_type: "plan_change",
      pending_new_price_id: newPriceId,
      pending_effective_date: currentPeriodEnd.toISOString()
    }
  });
  
  // Get the name of the new plan for display purposes
  const newPrice = await stripe.prices.retrieve(newPriceId, {
    expand: ['product']
  });
  
  // @ts-ignore - product may be expanded
  const newPlanName = newPrice.product?.name || "Updated plan";
  
  logStep("Subscription update scheduled for end of billing cycle", {
    subscriptionId,
    newPriceId,
    effectiveDate: currentPeriodEnd
  });

  return { 
    id: updatedSubscription.id,
    current_period_end: currentPeriodEnd,
    pending_change: {
      type: "plan_change",
      effective_date: currentPeriodEnd.toISOString(),
      new_plan_id: newPriceId,
      new_plan_name: newPlanName
    },
    action: "scheduled_update"
  };
}

export async function scheduleCycleChange(
  stripe: Stripe,
  subscriptionId: string,
  subscriptionItemId: string,
  newPriceId: string
) {
  logStep("Scheduling billing cycle change for end of billing period", { newPriceId });
  
  // Essentially the same implementation as scheduleSubscriptionUpdate
  // but with a different change type in metadata
  const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(currentSubscription.current_period_end * 1000);
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscriptionItemId,
      price: newPriceId,
    }],
    proration_behavior: "none",
    billing_cycle_anchor: "unchanged",
    metadata: {
      pending_change: "true",
      pending_change_type: "cycle_change",
      pending_new_price_id: newPriceId,
      pending_effective_date: currentPeriodEnd.toISOString()
    }
  });
  
  // Get the new plan details
  const newPrice = await stripe.prices.retrieve(newPriceId, {
    expand: ['product']
  });
  
  // @ts-ignore - product may be expanded
  const newPlanName = newPrice.product?.name || "Updated plan";
  const newCycle = newPrice.recurring?.interval === 'year' ? 'yearly' : 'monthly';
  
  logStep("Billing cycle change scheduled for end of billing period", {
    subscriptionId,
    newPriceId,
    newCycle,
    effectiveDate: currentPeriodEnd
  });

  return { 
    id: updatedSubscription.id,
    current_period_end: currentPeriodEnd,
    pending_change: {
      type: "cycle_change",
      effective_date: currentPeriodEnd.toISOString(),
      new_plan_id: newPriceId,
      new_plan_name: `${newPlanName} (${newCycle})`
    },
    action: "scheduled_cycle_change"
  };
}

export async function cancelPendingChanges(
  stripe: Stripe,
  subscriptionId: string
) {
  logStep("Canceling pending subscription changes");
  
  // Get current subscription
  const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Check if there's actually a pending change
  if (!currentSubscription.metadata?.pending_change) {
    logStep("No pending changes found to cancel");
    return {
      id: subscriptionId,
      action: "no_changes_to_cancel"
    };
  }
  
  // Get the current item and price to remain with the same plan
  const currentItem = currentSubscription.items.data[0];
  
  // Update subscription to cancel the pending change
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: currentItem.id,
      price: currentItem.price.id, // Keep the same price
    }],
    proration_behavior: "none",
    metadata: {
      pending_change: null,
      pending_change_type: null,
      pending_new_price_id: null,
      pending_effective_date: null
    }
  });
  
  logStep("Pending changes successfully canceled");
  
  return { 
    id: updatedSubscription.id,
    action: "canceled_pending_changes"
  };
}

export function checkIfPriceChanged(subscription: Stripe.Subscription, newPriceId: string): boolean {
  return subscription.items.data[0].price.id !== newPriceId;
}

export function hasPendingChanges(subscription: Stripe.Subscription): boolean {
  return Boolean(subscription.metadata?.pending_change === "true");
}

export function getPendingChangeInfo(subscription: Stripe.Subscription) {
  if (!subscription.metadata?.pending_change) {
    return null;
  }
  
  return {
    type: subscription.metadata.pending_change_type as 'downgrade' | 'plan_change' | 'cycle_change',
    effective_date: subscription.metadata.pending_effective_date,
    new_plan_id: subscription.metadata.pending_new_price_id,
  };
}
