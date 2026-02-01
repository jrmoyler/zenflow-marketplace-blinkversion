export type ProductCategory = 'agents' | 'workflows' | 'automations' | 'bots';

export type ComplexityLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  rating: number;
  complexity: ComplexityLevel;
  tags: string[];
  imageUrl: string;
  featured?: boolean;
  sales?: number;
}

export interface FilterState {
  categories: ProductCategory[];
  priceRange: [number, number];
  minRating: number;
  complexity: ComplexityLevel[];
  searchQuery: string;
}

export interface CategoryRail {
  title: string;
  items: Product[];
}