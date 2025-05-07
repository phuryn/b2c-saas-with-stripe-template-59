
import React from "react";
import { useAuth } from "@/context/AuthContext";
import PlanSelector from "@/components/billing/PlanSelector";

const Pricing: React.FC = () => {
  const { user } = useAuth();
  
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
          />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
