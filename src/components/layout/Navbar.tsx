import { Search, Sparkles, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAIConciergeOpen: () => void;
}

export default function Navbar({ searchQuery, onSearchChange, onAIConciergeOpen }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSearchChange('')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gradient">Zenflow</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </a>
            <button 
              onClick={onAIConciergeOpen}
              className="text-sm font-medium text-primary hover:text-primary-glow transition-colors flex items-center gap-1"
            >
              AI Concierge
            </button>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Enterprise
            </a>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md ml-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search agents, workflows, automations..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 text-sm font-medium hover:bg-primary/10 hover:border-primary/30 transition-all">
              <User className="w-4 h-4" />
              Sign In
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-sm font-medium text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
              <Sparkles className="w-4 h-4" />
              Get Started
            </button>
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Marketplace
              </a>
              <button 
                onClick={() => {
                  onAIConciergeOpen();
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-sm font-medium text-primary hover:text-primary-glow transition-colors py-2"
              >
                AI Concierge
              </button>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                Enterprise
              </a>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 text-sm font-medium justify-center hover:bg-primary/10 transition-all">
                <User className="w-4 h-4" />
                Sign In
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-sm font-medium text-white justify-center shadow-lg">
                <Sparkles className="w-4 h-4" />
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}