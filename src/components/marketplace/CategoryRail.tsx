/**
 * CategoryRail – Horizontal scrollable product rail.
 *
 * Bug fixes:
 *   - Scroll buttons were opacity-0 on touch devices (hover-only).
 *     Now always visible on mobile, hover-reveal on desktop.
 *   - Scroll buttons meet 44px minimum touch target.
 */

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
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.8
        : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items.length) return null;

  return (
    <section className="relative mb-10 sm:mb-12 group/rail">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 md:px-0">
        <h2 className="font-display font-bold text-xl sm:text-2xl md:text-3xl text-foreground">
          {title}
        </h2>
        {/* Scroll buttons: always visible on mobile, hover-reveal on desktop */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full glass border border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all opacity-70 md:opacity-0 md:group-hover/rail:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full glass border border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all opacity-70 md:opacity-0 md:group-hover/rail:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 sm:pb-8 px-4 md:px-0 no-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((product) => (
          <div key={product.id} className="snap-start flex-shrink-0">
            <ProductCard product={product} onClick={onProductClick} />
          </div>
        ))}
      </div>
    </section>
  );
}
