import { useState, useMemo, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import FilterSidebar from './components/layout/FilterSidebar';
import Footer from './components/layout/Footer';
import Hero from './components/home/Hero';
import BentoGrid from './components/marketplace/BentoGrid';
import CategoryRail from './components/marketplace/CategoryRail';
import AIConcierge from './components/home/AIConcierge';
import ProductDetail from './components/marketplace/ProductDetail';
import { generateMockData, getCategoryRails } from './data/mockData';
import { Product, FilterState } from './types/marketplace';
import { Sparkles, Bot, Zap, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIConciergeOpen, setIsAIConciergeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    categories: ['agents', 'workflows', 'automations', 'bots'],
    priceRange: [0, 500],
    minRating: 0,
    complexity: [],
    searchQuery: ''
  });

  const products = useMemo(() => generateMockData(), []);
  const allProducts = useMemo(() => [
    ...products.agents,
    ...products.workflows,
    ...products.automations,
    ...products.bots
  ], [products]);

  const rails = useMemo(() => getCategoryRails(products), [products]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchCategory = filters.categories.includes(p.category);
      const matchPrice = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
      const matchRating = p.rating >= filters.minRating;
      const matchComplexity = filters.complexity.length === 0 || filters.complexity.includes(p.complexity);
      const matchSearch = p.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      return matchCategory && matchPrice && matchRating && matchComplexity && matchSearch;
    });
  }, [allProducts, filters]);

  // Is filtering active?
  const isFiltering = filters.complexity.length > 0 || 
                      filters.minRating > 0 || 
                      filters.priceRange[0] > 0 || 
                      filters.priceRange[1] < 500 ||
                      filters.categories.length < 4 ||
                      filters.searchQuery.length > 0;

  const resetFilters = () => {
    setFilters({
      categories: ['agents', 'workflows', 'automations', 'bots'],
      priceRange: [0, 500],
      minRating: 0,
      complexity: [],
      searchQuery: ''
    });
  };

  return (
    <div className="min-h-screen aurora-bg text-foreground selection:bg-primary/30">
      <Navbar 
        searchQuery={filters.searchQuery} 
        onSearchChange={(q) => setFilters(prev => ({ ...prev, searchQuery: q }))}
        onAIConciergeOpen={() => setIsAIConciergeOpen(true)}
      />
      
      <div className="flex pt-16">
        <FilterSidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        />
        
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {!isFiltering ? (
              <motion.div
                key="discovery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Hero />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 -mt-10 relative z-20">
                  <CategoryRail 
                    title={rails[0].title} 
                    items={rails[0].items} 
                    onProductClick={setSelectedProduct} 
                  />
                  
                  <BentoGrid 
                    products={allProducts.filter(p => p.featured)} 
                    onProductClick={setSelectedProduct} 
                  />

                  {rails.slice(1).map((rail, i) => (
                    <CategoryRail 
                      key={i} 
                      title={rail.title} 
                      items={rail.items} 
                      onProductClick={setSelectedProduct} 
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10"
              >
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
                  <div>
                    <h2 className="text-3xl font-display font-bold">Search Results</h2>
                    <p className="text-muted-foreground mt-1">Found {filteredProducts.length} items matching your criteria</p>
                  </div>
                  <button 
                    onClick={resetFilters}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-border/50 hover:bg-white/5 transition-all text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Discovery
                  </button>
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.slice(0, 48).map(product => (
                      <div key={product.id} className="flex justify-center">
                        <div className="w-full max-w-[300px]">
                          <ProductCard 
                            product={product} 
                            onClick={setSelectedProduct} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-40 glass rounded-3xl border border-border/50">
                    <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                    <h3 className="text-xl font-display font-semibold mb-2">No items found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters to find what you're looking for.</p>
                    <button 
                      onClick={resetFilters}
                      className="mt-8 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:scale-105 transition-all"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <Footer />
        </main>
      </div>

      {/* AI Concierge Trigger */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAIConciergeOpen(true)}
        className="fixed bottom-8 right-8 z-[60] w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center justify-center group overflow-hidden"
      >
        <Sparkles className="w-8 h-8 relative z-10" />
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </motion.button>

      {/* Modals */}
      <AIConcierge 
        isOpen={isAIConciergeOpen} 
        onClose={() => setIsAIConciergeOpen(false)} 
        products={allProducts}
        onProductClick={(p) => {
          setIsAIConciergeOpen(false);
          setSelectedProduct(p);
        }}
      />
      
      <ProductDetail 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      {/* Global Styling */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .shine-effect {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shine 3s infinite;
        }
      `}</style>
    </div>
  );
}

export default App;