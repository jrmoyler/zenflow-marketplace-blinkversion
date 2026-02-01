import { motion } from 'framer-motion';
import { Sparkles, Twitter, Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass border-t border-border/50 pt-16 pb-8 px-4 md:px-0 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-gradient">Zenflow</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The world's first decentralized marketplace for AI Agents and Workflows. 
              Built for the next generation of digital automation.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg glass border border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold mb-6">Marketplace</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">AI Agents</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Workflows</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Automations</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Custom Bots</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Community Forum</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Zenflow Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-6">Join the Revolution</h4>
            <p className="text-sm text-muted-foreground mb-4">Subscribe to get the latest AI drops and platform updates.</p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full px-4 py-2 rounded-lg glass border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <button className="w-full py-2 rounded-lg bg-primary text-white font-medium text-sm hover:scale-105 active:scale-95 transition-all shadow-lg">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Zenflow Marketplace. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <a href="#" className="hover:text-foreground">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}