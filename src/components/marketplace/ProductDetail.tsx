/**
 * ProductDetail – Full-screen modal for product information.
 *
 * Bug fixes:
 *   - Moved AnimatePresence to wrap the entire conditional so exit
 *     animations fire correctly (previously returned null before
 *     AnimatePresence could manage the exit).
 *   - CTA buttons stack vertically on mobile to prevent overflow.
 *
 * New:
 *   - MotionPreviewIcon rendered alongside the product title.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Zap, ShoppingCart, Rocket, Code, Share2, Heart, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types/marketplace';
import MotionPreviewIcon from './MotionPreviewIcon';

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/90 backdrop-blur-xl"
          />

          <motion.div
            layoutId={`card-${product.id}`}
            className="relative w-full max-w-6xl h-full max-h-[90vh] glass border border-primary/20 rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.1)] flex flex-col md:flex-row"
          >
            {/* Close Button – 44px touch target */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full glass border border-border/50 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Left: Media */}
            <div className="md:w-1/2 relative h-48 sm:h-64 md:h-auto flex-shrink-0">
              <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />

              {/* Overlay Badges */}
              <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {product.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full glass border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <MotionPreviewIcon category={product.category} size={44} />
                  <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-white glow-text">
                    {product.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Right: Details – scrollable */}
            <div className="md:w-1/2 overflow-y-auto p-5 sm:p-8 md:p-12">
              <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-lg">{product.rating}</span>
                      <span className="text-xs text-muted-foreground ml-1">(1.2k reviews)</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-border/50 mx-2" />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Sales</span>
                    <span className="font-bold text-lg">{product.sales?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl glass border border-border/50 hover:bg-primary/10 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl glass border border-border/50 hover:bg-primary/10 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mb-8 sm:mb-10">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Overview
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description} This cutting-edge solution is engineered for peak performance and seamless integration.
                  Whether you're scaling a startup or optimizing an enterprise, Zenflow provides the architecture for your success.
                </p>
              </div>

              {/* Spec cards – stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                <div className="p-4 rounded-2xl glass border border-border/50">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Code className="w-3 h-3" />
                    Technical Specs
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• REST API Ready</li>
                    <li>• Webhook Support</li>
                    <li>• JWT Auth Included</li>
                  </ul>
                </div>
                <div className="p-4 rounded-2xl glass border border-border/50">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" />
                    What's Inside
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• JSON Config</li>
                    <li>• Deployment Guide</li>
                    <li>• Life-time Updates</li>
                  </ul>
                </div>
              </div>

              {/* CTA – stacks on mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-border/50">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground line-through">$ {Math.round(product.price * 1.5)}</span>
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">${product.price}</span>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 py-3 sm:py-4 rounded-2xl glass border border-primary/30 font-bold hover:bg-primary/10 transition-all flex items-center justify-center gap-2 min-h-[44px]">
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                  <button className="flex-1 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[44px]">
                    <Rocket className="w-5 h-5" />
                    Deploy Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
