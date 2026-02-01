import { motion } from 'framer-motion';
import { Product } from '../../types/marketplace';
import { Star, Zap, ArrowUpRight } from 'lucide-react';

interface BentoGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function BentoGrid({ products, onProductClick }: BentoGridProps) {
  // Take 5 items for the bento grid
  const items = products.slice(0, 5);
  
  if (items.length < 5) return null;

  return (
    <section className="mb-20">
      <h2 className="font-display font-bold text-3xl mb-8 px-4 md:px-0">Featured Innovations</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[800px] md:h-[600px] px-4 md:px-0">
        
        {/* Main large item */}
        <motion.div
          whileHover={{ scale: 0.99 }}
          onClick={() => onProductClick(items[0])}
          className="md:col-span-2 md:row-span-2 glass-card rounded-3xl overflow-hidden relative group cursor-pointer"
        >
          <img src={items[0].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary text-[10px] font-bold uppercase tracking-widest text-white">Featured</span>
              <span className="px-3 py-1 rounded-full glass border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white">{items[0].category}</span>
            </div>
            <h3 className="text-4xl font-display font-bold mb-4 group-hover:text-primary transition-colors">{items[0].title}</h3>
            <p className="text-muted-foreground max-w-md mb-6">{items[0].description}</p>
            <div className="flex items-center gap-6">
              <span className="text-3xl font-bold text-foreground">${items[0].price}</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold">{items[0].rating}</span>
              </div>
            </div>
          </div>
          <div className="absolute top-8 right-8 p-3 rounded-full glass border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Top right */}
        <motion.div
          whileHover={{ scale: 0.98 }}
          onClick={() => onProductClick(items[1])}
          className="md:col-span-2 glass-card rounded-3xl overflow-hidden relative group cursor-pointer"
        >
          <img src={items[1].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          <div className="absolute inset-0 p-6 flex flex-col justify-center">
            <h3 className="text-2xl font-display font-bold mb-2 group-hover:text-primary transition-colors">{items[1].title}</h3>
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-primary">${items[1].price}</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Zap className="w-3 h-3 fill-primary text-primary" />
                {items[1].complexity}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom middle */}
        <motion.div
          whileHover={{ scale: 0.98 }}
          onClick={() => onProductClick(items[2])}
          className="glass-card rounded-3xl overflow-hidden relative group cursor-pointer"
        >
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold group-hover:text-secondary transition-colors">{items[2].title}</h3>
              <span className="text-sm font-bold text-muted-foreground">${items[2].price}</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom right */}
        <motion.div
          whileHover={{ scale: 0.98 }}
          onClick={() => onProductClick(items[3])}
          className="glass-card rounded-3xl overflow-hidden relative group cursor-pointer"
        >
          <img src={items[3].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold">{items[3].rating}</span>
            </div>
            <h3 className="font-bold text-sm line-clamp-2">{items[3].title}</h3>
          </div>
        </motion.div>

      </div>
    </section>
  );
}