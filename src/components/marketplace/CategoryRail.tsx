import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types/marketplace';
import ProductCard from './ProductCard';

interface CategoryRailProps {
  title: string;
  items: Product[];
  onProductClick: (product: Product) => void;
}

export default function CategoryRail({ title, items, onProductClick }: CategoryRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative mb-12 group/rail">
      <div className="flex items-center justify-between mb-6 px-4 md:px-0">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full glass border border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all opacity-0 group-hover/rail:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full glass border border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all opacity-0 group-hover/rail:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-8 px-4 md:px-0 scrollbar-hide no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={onProductClick}
          />
        ))}
      </div>
    </section>
  );
}