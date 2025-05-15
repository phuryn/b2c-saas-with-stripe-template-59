
export interface PaymentMethod {
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
}

export interface PendingChange {
  type: 'downgrade' | 'plan_change' | 'cycle_change' | null;
  effective_date: string | null;
  new_plan_id?: string;
  new_plan_name?: string;
}

export interface Subscription {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  current_plan: string | null;
  cancel_at_period_end?: boolean;
  payment_method?: PaymentMethod | null;
  pending_change?: PendingChange | null;
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  interval?: string;
}

export type BillingCycle = 'monthly' | 'yearly';
