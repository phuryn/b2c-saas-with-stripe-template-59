
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    
    // Get the price IDs from the request query params
    const url = new URL(req.url);
    const priceIds = url.searchParams.get("priceIds")?.split(",") || [];
    
    if (priceIds.length === 0) {
      throw new Error("No price IDs provided");
    }
    
    // Retrieve the prices from Stripe
    const prices = await Promise.all(
      priceIds.map(async (priceId) => {
        try {
          const price = await stripe.prices.retrieve(priceId);
          return price;
        } catch (error) {
          console.error(`Error fetching price ${priceId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any null values and format the response
    const formattedPrices = prices
      .filter((price) => price !== null)
      .map((price) => ({
        id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
      }));

    return new Response(JSON.stringify({ prices: formattedPrices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
