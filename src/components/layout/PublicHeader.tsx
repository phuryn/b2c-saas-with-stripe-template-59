
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, userRole } = useAuth();

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
              src="/lovable-uploads/2d719fe8-edcb-42b6-a0ea-ca7e43cbe81c.png" 
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
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {user.email ? user.email.split('@')[0] : 'User'}
                      {userRole === 'administrator' && (
                        <span className="bg-primary-blue text-white text-xs px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                      {userRole === 'support' && (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Support
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    {(userRole === 'administrator' || userRole === 'support') && (
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2" onClick={signOut}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="outline">Sign in</Button>
                  </Link>
                </>
              )}
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
              {user ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
