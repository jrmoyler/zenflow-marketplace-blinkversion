/**
 * BentoGrid – Featured products in a responsive bento layout.
 *
 * Bug fixes:
 *   - Previously sliced 5 items but only rendered 4 (index 4 unused).
 *     Now renders all 5, with the 5th as a full-width banner on sm+.
 *   - Mobile: replaced fixed 800px height with auto-height stacked cards.
 *
 * New:
 *   - MotionPreviewIcon in each bento cell.
 */

import { motion } from 'framer-motion';
import { Product } from '../../types/marketplace';
import { Star, ArrowUpRight } from 'lucide-react';
import MotionPreviewIcon from './MotionPreviewIcon';

interface BentoGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function BentoGrid({ products, onProductClick }: BentoGridProps) {
  const items = products.slice(0, 5);
  if (items.length < 4) return null;

  return (
    <section className="mb-16 sm:mb-20">
      <h2 className="font-display font-bold text-2xl sm:text-3xl mb-6 sm:mb-8 px-4 md:px-0">
        Featured Innovations
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[600px] px-4 md:px-0">
        {/* Main large item – 2×2 on md */}
        <motion.div
          whileHover={{ scale: 0.99 }}
          onClick={() => onProductClick(items[0])}
          className="sm:col-span-2 md:row-span-2 min-h-[260px] glass-card rounded-3xl overflow-hidden relative group cursor-pointer"
        >
          <img src={items[0].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <MotionPreviewIcon category={items[0].category} size={32} />
              <span className="px-3 py-1 rounded-full bg-primary text-[10px] font-bold uppercase tracking-widest text-white">Featured</span>
              <span className="px-3 py-1 rounded-full glass border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white">{items[0].category}</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-display font-bold mb-2 sm:mb-4 group-hover:text-primary transition-colors">{items[0].title}</h3>
            <p className="text-muted-foreground max-w-md mb-4 line-clamp-2">{items[0].description}</p>
            <div className="flex items-center gap-6">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">${items[0].price}</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold">{items[0].rating}</span>
              </div>
            </div>
          </div>
          <div className="absolute top-6 right-6 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full glass border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Top right – 2 cols on md */}
        <motion.div
          whileHover={{ scale: 0.98 }}
          onClick={() => onProductClick(items[1])}
          className="md:col-span-2 min-h-[180px] glass-card rounded-3xl overflow-hidden relative group cursor-pointer"
        >
          <img src={items[1].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <MotionPreviewIcon category={items[1].category} size={28} />
              <h3 className="text-xl sm:text-2xl font-display font-bold group-hover:text-primary transition-colors">{items[1].title}</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg sm:text-xl font-bold text-primary">${items[1].price}</span>
              <span className="text-sm text-muted-foreground">{items[1].complexity}</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom middle */}
        <motion.div
          whileHover={{ scale: 0.98 }}
          onClick={() => onProductClick(items[2])}
          className="min-h-[160px] glass-card rounded-3xl overflow-hidden relative group cursor-pointer"
        >
          <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
            <MotionPreviewIcon category={items[2].category} size={32} />
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
          className="min-h-[160px] glass-card rounded-3xl overflow-hidden relative group cursor-pointer"
        >
          <img src={items[3].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="absolute inset-0 p-5 sm:p-6 flex flex-col items-center justify-center text-center">
            <MotionPreviewIcon category={items[3].category} size={32} className="mb-2" />
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold">{items[3].rating}</span>
            </div>
            <h3 className="font-bold text-sm line-clamp-2">{items[3].title}</h3>
          </div>
        </motion.div>

        {/* 5th item – previously not rendered */}
        {items[4] && (
          <motion.div
            whileHover={{ scale: 0.98 }}
            onClick={() => onProductClick(items[4])}
            className="sm:col-span-2 md:col-span-4 min-h-[100px] glass-card rounded-3xl overflow-hidden relative group cursor-pointer hidden sm:flex"
          >
            <img src={items[4].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
            <div className="relative flex items-center gap-4 p-5 sm:p-6 w-full">
              <MotionPreviewIcon category={items[4].category} size={36} />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-display font-bold group-hover:text-primary transition-colors truncate">{items[4].title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{items[4].description}</p>
              </div>
              <span className="text-xl font-bold text-primary flex-shrink-0">${items[4].price}</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
