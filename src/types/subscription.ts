
export interface PaymentMethod {
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
}

export interface Subscription {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  current_plan: string | null;
  cancel_at_period_end?: boolean;
  payment_method?: PaymentMethod | null;
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  interval?: string;
}

export type BillingCycle = 'monthly' | 'yearly';
