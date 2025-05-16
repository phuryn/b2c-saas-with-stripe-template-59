import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    signOut,
    userMetadata,
    profile
  } = useAuth();
  const handleSignOut = async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      toast.info("Signing you out...");

      // Call the signOut function from AuthContext
      await signOut();

      // The redirection will be handled by the signOut function
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error("There was a problem signing you out. Please try again.");
      setIsSigningOut(false);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    const name = profile?.display_name || userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0] || 'U';
    return name.substring(0, 2).toUpperCase();
  };
  const menuItems = [{
    label: "Home",
    href: "/"
  }, {
    label: "Pricing",
    href: "/pricing"
  }];
  const isActive = (path: string) => location.pathname === path;
  return <header className="sticky top-0 z-40 w-full bg-background border-b border-gray-200">
      <nav className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/primary-logo.svg" alt="TRUSTY" className="h-[28px] w-[120px] object-contain" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {menuItems.map(item => <Link key={item.label} to={item.href} className={cn("px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary-blue", isActive(item.href) ? "text-primary-blue" : "text-gray-700")}>
              {item.label}
            </Link>)}
        </div>

        {/* CTA Buttons / User Menu */}
        <div className="flex items-center">
          {user ? <>
              <Link to="/app" className="hidden md:inline-flex mr-4">
                <Button className="bg-primary-blue hover:bg-primary-blue/90">Open Your App</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none">
                    <Avatar className="h-9 w-9 cursor-pointer">
                      <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
                      <AvatarFallback>
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="font-medium" disabled>
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/app/settings/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className={isSigningOut ? "opacity-50 cursor-not-allowed" : ""}>
                    {isSigningOut ? "Signing Out..." : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </> : <>
              <Link to="/auth" className="hidden md:inline-flex">
                <Button variant="outline" className="mr-2">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-primary-blue hover:bg-primary-blue/90">Sign Up Free</Button>
              </Link>
            </>}

          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] md:w-[350px]">
              <div className="flex flex-col space-y-4 mt-6">
                {menuItems.map(item => <Link key={item.label} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("px-3 py-2 rounded-md text-base font-medium transition-colors hover:text-primary-blue", isActive(item.href) ? "text-primary-blue" : "text-gray-700")}>
                    {item.label}
                  </Link>)}
                {!user && <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full mt-4">Log In</Button>
                  </Link>}
                {user && <Link to="/app" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full mt-4 bg-primary-blue hover:bg-primary-blue/90">Open Your App</Button>
                  </Link>}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>;
};
export default PublicHeader;