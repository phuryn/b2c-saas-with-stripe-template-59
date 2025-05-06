
import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Pricing: React.FC = () => {
  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans come with a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mb-6">Perfect for small teams getting started.</p>
              <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Start Free Trial</Button>
            </div>
            <div className="border-t p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Up to 5 team members</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>10 projects</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>5GB storage</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Basic support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border rounded-lg overflow-hidden shadow-sm relative">
            <div className="absolute top-0 right-0 bg-primary-blue text-white px-3 py-1 text-sm font-medium rounded-bl">
              Popular
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$79</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mb-6">For growing teams with advanced needs.</p>
              <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Start Free Trial</Button>
            </div>
            <div className="border-t p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Up to 20 team members</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>25GB storage</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Advanced analytics</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$199</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mb-6">For large organizations and complex needs.</p>
              <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Contact Sales</Button>
            </div>
            <div className="border-t p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited team members</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>100GB storage</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>24/7 dedicated support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>SLA guarantees</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
