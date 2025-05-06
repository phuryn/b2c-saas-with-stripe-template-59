
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gray-highlight section-padding">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-bold mb-6 animate-fade-up">
            Start Building. Stop theorizing.
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mb-8 text-gray-600 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            TRUSTY provides all the tools you need to transform your ideas into reality, with enterprise-grade reliability and security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <Link to="/signup">
              <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" className="text-lg px-8 py-6">
                View Pricing
              </Button>
            </Link>
          </div>
          <div className="mt-12 w-full max-w-4xl animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <img 
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80" 
              alt="TRUSTY Dashboard Preview" 
              className="w-full h-auto rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
