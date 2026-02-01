import { motion } from 'framer-motion';
import { Star, Zap, ShoppingCart, Info } from 'lucide-react';
import { Product } from '../../types/marketplace';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <motion.div
      layoutId={`card-${product.id}`}
      whileHover={{ y: -10 }}
      className="group relative min-w-[300px] w-[300px] aspect-[4/5] glass-card rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => onClick(product)}
    >
      {/* Image Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-md bg-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider border border-primary/30">
            {product.category}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
            product.complexity === 'Beginner' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
            product.complexity === 'Intermediate' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
            product.complexity === 'Advanced' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
            'bg-rose-500/10 text-rose-500 border-rose-500/30'
          }`}>
            {product.complexity}
          </span>
        </div>

        <h3 className="font-display font-bold text-xl mb-2 text-foreground group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 group-hover:text-foreground/80 transition-colors">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground">${product.price}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-xs text-muted-foreground font-medium">{product.rating}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="p-2 rounded-lg glass border border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all">
              <Info className="w-4 h-4" />
            </button>
            <button 
              className="p-2 rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                // Add to cart logic
              }}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hover Action Overlay */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-2 rounded-full glass border border-primary/50">
          <Zap className="w-4 h-4 text-primary fill-primary animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}