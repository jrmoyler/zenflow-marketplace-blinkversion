import { useState } from 'react';
import { Slider } from '../ui/slider';
import { ProductCategory, ComplexityLevel } from '../../types/marketplace';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';

interface FilterSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onFilterChange: (filters: any) => void;
}

export default function FilterSidebar({ isOpen, onToggle, onFilterChange }: FilterSidebarProps) {
  const [categories, setCategories] = useState<ProductCategory[]>(['agents', 'workflows', 'automations', 'bots']);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [complexity, setComplexity] = useState<ComplexityLevel[]>([]);
  const [expandedSections, setExpandedSections] = useState({ category: true, price: true, rating: true, complexity: true });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCategory = (cat: ProductCategory) => {
    setCategories(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      onFilterChange({ categories: next, priceRange, minRating, complexity });
      return next;
    });
  };

  const toggleComplexity = (comp: ComplexityLevel) => {
    setComplexity(prev => {
      const next = prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp];
      onFilterChange({ categories, priceRange, minRating, complexity: next });
      return next;
    });
  };

  const handlePriceChange = (values: number[]) => {
    const next: [number, number] = [values[0], values[1]];
    setPriceRange(next);
    onFilterChange({ categories, priceRange: next, minRating, complexity });
  };

  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
    onFilterChange({ categories, priceRange, minRating: rating, complexity });
  };

  const clearFilters = () => {
    setCategories(['agents', 'workflows', 'automations', 'bots']);
    setPriceRange([0, 500]);
    setMinRating(0);
    setComplexity([]);
    onFilterChange({ categories: ['agents', 'workflows', 'automations', 'bots'], priceRange: [0, 500], minRating: 0, complexity: [] });
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-20 left-4 z-40 p-3 rounded-lg glass hover:glass-hover transition-all shadow-lg"
      >
        <Filter className="w-5 h-5 text-primary" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 left-0 bottom-0 lg:h-[calc(100vh-4rem)] w-72
          glass border-r border-border/50 z-40
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-lg">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between w-full text-sm font-medium mb-3 text-foreground"
            >
              Categories
              {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.category && (
              <div className="space-y-2">
                {(['agents', 'workflows', 'automations', 'bots'] as ProductCategory[]).map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border transition-colors ${
                        categories.includes(cat)
                          ? 'bg-primary border-primary'
                          : 'border-border group-hover:border-primary/50'
                      }`}>
                        {categories.includes(cat) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm capitalize ${
                      categories.includes(cat) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground transition-colors'
                    }`}>
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between w-full text-sm font-medium mb-3 text-foreground"
            >
              Price Range
              {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.price && (
              <div className="pt-2">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  min={0}
                  max={500}
                  step={10}
                  className="mb-4"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('rating')}
              className="flex items-center justify-between w-full text-sm font-medium mb-3 text-foreground"
            >
              Minimum Rating
              {expandedSections.rating ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.rating && (
              <div className="space-y-2">
                {[0, 3, 3.5, 4, 4.5, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      minRating === rating
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {rating === 0 ? 'All ratings' : `${rating}+ stars`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Complexity */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('complexity')}
              className="flex items-center justify-between w-full text-sm font-medium mb-3 text-foreground"
            >
              Complexity
              {expandedSections.complexity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.complexity && (
              <div className="space-y-2">
                {(['Beginner', 'Intermediate', 'Advanced', 'Expert'] as ComplexityLevel[]).map((comp) => (
                  <label key={comp} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={complexity.includes(comp)}
                        onChange={() => toggleComplexity(comp)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border transition-colors ${
                        complexity.includes(comp)
                          ? 'bg-primary border-primary'
                          : 'border-border group-hover:border-primary/50'
                      }`}>
                        {complexity.includes(comp) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm ${
                      complexity.includes(comp) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground transition-colors'
                    }`}>
                      {comp}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
}