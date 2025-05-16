import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
const HeroSection: React.FC = () => {
  const {
    user
  } = useAuth();
  return <section className="bg-gray-highlight section-padding">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <h1 className="font-bold mb-6 animate-fade-up">Start building. Stop theorizing.</h1>
          <p className="text-xl md:text-2xl max-w-3xl mb-8 text-gray-600 animate-fade-up" style={{
          animationDelay: "0.2s"
        }}>
            TRUSTY provides all the tools you need to transform your ideas into reality, with enterprise-grade reliability and security.
          </p>
          {!user && <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{
          animationDelay: "0.4s"
        }}>
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
            </div>}
          {user && <div className="animate-fade-up" style={{
          animationDelay: "0.4s"
        }}>
              <Link to="/app">
                <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white text-lg px-8 py-6">
                  Your Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>}
          <div style={{
          animationDelay: "0.6s"
        }} className="mt-12 w-full max-w-4xl animate-fade-up">
            <img alt="TRUSTY Dashboard Preview" className="w-full h-auto rounded-lg shadow-xl" src="/lovable-uploads/58997b93-31dd-4c45-87e8-379dbe417a75.png" />
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;