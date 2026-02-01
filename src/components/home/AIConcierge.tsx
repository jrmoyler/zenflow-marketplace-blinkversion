import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, Zap, Globe, Mail } from 'lucide-react';
import { useState } from 'react';
import { Product } from '../../types/marketplace';

interface AIConciergeProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function AIConcierge({ isOpen, onClose, products, onProductClick }: AIConciergeProps) {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  const analyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setRecommendations([]);

    // Simulate AI thinking
    setTimeout(() => {
      const keywords = query.toLowerCase().split(' ');
      const filtered = products.filter(p => {
        const text = (p.title + p.description + p.tags.join(' ')).toLowerCase();
        return keywords.some(k => k.length > 3 && text.includes(k));
      }).slice(0, 3);

      setRecommendations(filtered.length > 0 ? filtered : products.slice(0, 3));
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl glass border border-primary/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)]"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl">Zenflow AI Concierge</h2>
                  <p className="text-xs text-muted-foreground">Describe your business needs and I'll find the perfect solutions.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {!recommendations.length && !isAnalyzing ? (
                <div className="text-center py-10">
                  <Bot className="w-16 h-16 text-primary mx-auto mb-6 animate-float" />
                  <h3 className="text-xl font-display font-semibold mb-4">How can I help you today?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                    {[
                      { icon: <Mail className="w-4 h-4" />, text: "Automate email outreach" },
                      { icon: <Zap className="w-4 h-4" />, text: "Scale my support team" },
                      { icon: <Globe className="w-4 h-4" />, text: "Global market analysis" },
                      { icon: <Bot className="w-4 h-4" />, text: "Build custom chatbots" }
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(suggestion.text)}
                        className="flex items-center gap-2 p-3 rounded-xl glass border border-border/50 hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-all"
                      >
                        {suggestion.icon}
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : isAnalyzing ? (
                <div className="py-20 text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg font-medium animate-pulse">Analyzing Zenflow ecosystem...</h3>
                  <p className="text-sm text-muted-foreground mt-2">Matching your needs with our 1,000+ AI solutions.</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground">
                      Based on your request: <span className="text-primary font-medium italic">"{query}"</span>, 
                      I've curated this high-performance bundle for you:
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {recommendations.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => onProductClick(product)}
                        className="group flex items-center gap-4 p-4 rounded-2xl glass border border-border/50 hover:border-primary/50 cursor-pointer transition-all"
                      >
                        <img src={product.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{product.title}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
                            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                            <span className="text-xs font-bold text-primary">${product.price}</span>
                          </div>
                        </div>
                        <Zap className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      setRecommendations([]);
                      setQuery('');
                    }}
                    className="w-full py-3 rounded-xl glass border border-border/50 hover:bg-white/5 text-sm font-medium transition-all"
                  >
                    Start New Analysis
                  </button>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-border/50 bg-background/50">
              <form onSubmit={analyze} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="E.g. 'I need a system to automate my daily reports and social media posts'"
                  className="w-full pl-6 pr-14 py-4 rounded-2xl glass border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isAnalyzing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-primary text-white shadow-lg disabled:opacity-50 disabled:grayscale transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}