
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/lovable-uploads/e78a0b1d-9beb-4669-af36-a6999daa3bd3.png" 
              alt="TRUSTY" 
              className="h-7 w-auto" 
              width={120}
              height={28}
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-6">
              <Link 
                to="/" 
                className="text-gray-text hover:text-primary-blue transition-colors"
              >
                Platform
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-text hover:text-primary-blue transition-colors"
              >
                Pricing
              </Link>
            </nav>
            
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button 
                  className="bg-primary-blue hover:bg-primary-blue/90 text-white"
                >
                  Sign up Free
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu} 
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-text hover:text-primary-blue transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Platform
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-text hover:text-primary-blue transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
            </nav>
            
            <div className="flex flex-col space-y-3 mt-4">
              <Link to="/login">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  className="bg-primary-blue hover:bg-primary-blue/90 text-white w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
