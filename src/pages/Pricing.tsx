import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import PlanSelector from "@/components/billing/PlanSelector";
import { Button } from "@/components/ui/button"; 
import { toast } from "sonner";

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleSelectPlan = (planId: string, priceId: string) => {
    // If user is logged in, navigate to the plan settings page
    if (user) {
      navigate("/app/settings/plan");
    } else {
      // Otherwise, navigate to signup
      navigate("/signup?plan=" + planId);
      toast("Please create an account to continue with your plan selection.");
    }
  };
  
  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans come with a 14-day free trial.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <PlanSelector 
            isPublicPage={true}
            onSelect={handleSelectPlan}
          />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
