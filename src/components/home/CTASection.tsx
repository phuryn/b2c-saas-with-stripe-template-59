
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const CTASection: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <section className="bg-primary-blue text-white section-padding">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-bold text-white mb-6">More Than App Building</h2>
          <p className="text-xl mb-8">
            With TRUSTY, you're not just building an application - you're crafting experiences, 
            solving real problems, and bringing your vision to life with enterprise-grade tools 
            and support that grows with your business.
          </p>
          {user ? (
            <Link to="/app">
              <Button size="lg" className="bg-white text-primary-blue hover:bg-gray-100">
                Your Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/signup">
              <Button size="lg" className="bg-white text-primary-blue hover:bg-gray-100">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
