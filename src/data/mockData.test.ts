/**
 * Unit tests for mock data generation
 * Tests product generation, data structure, and category rails
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { generateMockData, getCategoryRails } from './mockData';
import { ProductCategory } from '../types/marketplace';

describe('mockData', () => {
  describe('generateMockData()', () => {
    let mockData: ReturnType<typeof generateMockData>;

    beforeEach(() => {
      mockData = generateMockData();
    });

    it('should generate data for all categories', () => {
      expect(mockData).toHaveProperty('agents');
      expect(mockData).toHaveProperty('workflows');
      expect(mockData).toHaveProperty('automations');
      expect(mockData).toHaveProperty('bots');
    });

    it('should generate 250 items per category', () => {
      expect(mockData.agents).toHaveLength(250);
      expect(mockData.workflows).toHaveLength(250);
      expect(mockData.automations).toHaveLength(250);
      expect(mockData.bots).toHaveLength(250);
    });

    it('should generate products with all required fields', () => {
      const product = mockData.agents[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('rating');
      expect(product).toHaveProperty('complexity');
      expect(product).toHaveProperty('tags');
      expect(product).toHaveProperty('imageUrl');
    });

    it('should generate unique IDs for each product', () => {
      const allProducts = [
        ...mockData.agents,
        ...mockData.workflows,
        ...mockData.automations,
        ...mockData.bots,
      ];
      const ids = allProducts.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should assign correct category to products', () => {
      expect(mockData.agents.every(p => p.category === 'agents')).toBe(true);
      expect(mockData.workflows.every(p => p.category === 'workflows')).toBe(true);
      expect(mockData.automations.every(p => p.category === 'automations')).toBe(true);
      expect(mockData.bots.every(p => p.category === 'bots')).toBe(true);
    });

    it('should generate prices within expected ranges', () => {
      // Agents: 49-499
      mockData.agents.forEach(p => {
        expect(p.price).toBeGreaterThanOrEqual(49);
        expect(p.price).toBeLessThanOrEqual(499);
      });

      // Workflows: 29-229
      mockData.workflows.forEach(p => {
        expect(p.price).toBeGreaterThanOrEqual(29);
        expect(p.price).toBeLessThanOrEqual(229);
      });

      // Automations: 19-169
      mockData.automations.forEach(p => {
        expect(p.price).toBeGreaterThanOrEqual(19);
        expect(p.price).toBeLessThanOrEqual(169);
      });

      // Bots: 39-339
      mockData.bots.forEach(p => {
        expect(p.price).toBeGreaterThanOrEqual(39);
        expect(p.price).toBeLessThanOrEqual(339);
      });
    });

    it('should generate ratings between 3.5 and 5.0', () => {
      const allProducts = [
        ...mockData.agents,
        ...mockData.workflows,
        ...mockData.automations,
        ...mockData.bots,
      ];
      allProducts.forEach(p => {
        expect(p.rating).toBeGreaterThanOrEqual(3.5);
        expect(p.rating).toBeLessThanOrEqual(5.0);
      });
    });

    it('should generate valid complexity levels', () => {
      const validComplexities = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      const allProducts = [
        ...mockData.agents,
        ...mockData.workflows,
        ...mockData.automations,
        ...mockData.bots,
      ];
      allProducts.forEach(p => {
        expect(validComplexities).toContain(p.complexity);
      });
    });

    it('should generate 4 tags per product', () => {
      const allProducts = [
        ...mockData.agents,
        ...mockData.workflows,
        ...mockData.automations,
        ...mockData.bots,
      ];
      allProducts.forEach(p => {
        expect(p.tags).toHaveLength(4);
      });
    });

    it('should have some featured products', () => {
      const allProducts = [
        ...mockData.agents,
        ...mockData.workflows,
        ...mockData.automations,
        ...mockData.bots,
      ];
      const featuredCount = allProducts.filter(p => p.featured).length;
      expect(featuredCount).toBeGreaterThan(0);
    });

    it('should have sales data for all products', () => {
      const allProducts = [
        ...mockData.agents,
        ...mockData.workflows,
        ...mockData.automations,
        ...mockData.bots,
      ];
      allProducts.forEach(p => {
        expect(p.sales).toBeDefined();
        expect(p.sales).toBeGreaterThanOrEqual(0);
        expect(p.sales).toBeLessThanOrEqual(5000);
      });
    });
  });

  describe('getCategoryRails()', () => {
    let mockData: ReturnType<typeof generateMockData>;
    let rails: ReturnType<typeof getCategoryRails>;

    beforeEach(() => {
      mockData = generateMockData();
      rails = getCategoryRails(mockData);
    });

    it('should generate 6 category rails', () => {
      expect(rails).toHaveLength(6);
    });

    it('should have correct rail titles', () => {
      const expectedTitles = [
        'Trending Now',
        'Featured AI Agents',
        'Top Rated Workflows',
        'Popular Automations',
        'New Releases',
        'Bestselling Bots',
      ];
      const actualTitles = rails.map(r => r.title);
      expect(actualTitles).toEqual(expectedTitles);
    });

    it('should return rails with items array', () => {
      rails.forEach(rail => {
        expect(rail).toHaveProperty('title');
        expect(rail).toHaveProperty('items');
        expect(Array.isArray(rail.items)).toBe(true);
      });
    });

    it('should limit items to 12 per rail', () => {
      rails.forEach(rail => {
        expect(rail.items.length).toBeLessThanOrEqual(12);
      });
    });

    it('should filter Trending Now by high sales (>3000)', () => {
      const trendingRail = rails.find(r => r.title === 'Trending Now');
      expect(trendingRail).toBeDefined();
      trendingRail!.items.forEach(item => {
        expect(item.sales).toBeDefined();
        expect(item.sales!).toBeGreaterThan(3000);
      });
    });

    it('should filter Featured AI Agents by featured flag and category', () => {
      const featuredRail = rails.find(r => r.title === 'Featured AI Agents');
      expect(featuredRail).toBeDefined();
      featuredRail!.items.forEach(item => {
        expect(item.featured).toBe(true);
        expect(item.category).toBe('agents');
      });
    });

    it('should filter Top Rated Workflows by rating >= 4.5', () => {
      const topRatedRail = rails.find(r => r.title === 'Top Rated Workflows');
      expect(topRatedRail).toBeDefined();
      topRatedRail!.items.forEach(item => {
        expect(item.rating).toBeGreaterThanOrEqual(4.5);
        expect(item.category).toBe('workflows');
      });
    });

    it('should filter Popular Automations by sales > 2000', () => {
      const popularRail = rails.find(r => r.title === 'Popular Automations');
      expect(popularRail).toBeDefined();
      popularRail!.items.forEach(item => {
        expect(item.sales).toBeDefined();
        expect(item.sales!).toBeGreaterThan(2000);
        expect(item.category).toBe('automations');
      });
    });

    it('should filter New Releases by low sales (< 500)', () => {
      const newRail = rails.find(r => r.title === 'New Releases');
      expect(newRail).toBeDefined();
      newRail!.items.forEach(item => {
        expect(item.sales).toBeDefined();
        expect(item.sales!).toBeLessThan(500);
      });
    });

    it('should filter Bestselling Bots by sales > 4000', () => {
      const bestsellingRail = rails.find(r => r.title === 'Bestselling Bots');
      expect(bestsellingRail).toBeDefined();
      bestsellingRail!.items.forEach(item => {
        expect(item.sales).toBeDefined();
        expect(item.sales!).toBeGreaterThan(4000);
        expect(item.category).toBe('bots');
      });
    });
  });
});
