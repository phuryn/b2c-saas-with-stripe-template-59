import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mb-6">Basic functionality for personal use.</p>
              {user ? (
                <Link to="/app/settings/billing">
                  <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Manage Your Plan</Button>
                </Link>
              ) : (
                <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Try Now</Button>
              )}
            </div>
            <div className="border-t p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>20 links / month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>1 QR code / month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>30-days of click history</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Standard Plan */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Standard</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mb-6">Great for professionals and small teams.</p>
              {user ? (
                <Link to="/app/settings/billing">
                  <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Manage Your Plan</Button>
                </Link>
              ) : (
                <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Try Now</Button>
              )}
            </div>
            <div className="border-t p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>200 links / month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>20 QR codes / month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sm font-medium">Everything in Free, plus:</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>6-months of click history</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Bulk link & QR Code creation</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Premium Plan with RECOMMENDED tag */}
          <div className="border rounded-lg overflow-hidden shadow-sm relative">
            <div className="absolute inset-x-0 -top-6 flex justify-center">
              <div className="bg-primary text-white px-3 py-1 text-xs font-medium rounded-t-md">
                RECOMMENDED
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Premium</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$79</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mb-6">For growing teams with advanced needs.</p>
              {user ? (
                <Link to="/app/settings/billing">
                  <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Manage Your Plan</Button>
                </Link>
              ) : (
                <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Try Now</Button>
              )}
            </div>
            <div className="border-t p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>5000 links / month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>500 QR codes / month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sm font-medium">Everything in Standard, plus:</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>2 years of click history</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>City-level & device analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>API access</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">Custom</span>
              </div>
              <p className="text-gray-600 mb-6">For large organizations and complex needs.</p>
              {user ? (
                <Link to="/app/settings/billing">
                  <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Manage Your Plan</Button>
                </Link>
              ) : (
                <Button className="w-full bg-primary-blue hover:bg-primary-blue/90">Get a Quote</Button>
              )}
            </div>
            <div className="border-t p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Custom number of QR codes and links</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sm font-medium">Everything in Premium, plus:</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>99.9% SLA uptime</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Dedicated customer success manager</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-green mr-2 mt-0.5 flex-shrink-0" />
                  <span>Customized onboarding & priority support</span>
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
