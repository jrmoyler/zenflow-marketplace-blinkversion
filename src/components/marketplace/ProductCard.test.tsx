/**
 * Component tests for ProductCard
 * Tests rendering, user interactions, and responsive behavior
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';
import { Product } from '../../types/marketplace';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: any) => (
      <div onClick={onClick} className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock MotionPreviewIcon component
vi.mock('./MotionPreviewIcon', () => ({
  default: ({ category, size }: { category: string; size: number }) => (
    <div data-testid="motion-preview-icon" data-category={category} data-size={size} />
  ),
}));

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 'test-1',
    title: 'Test AI Agent',
    description: 'A test product for testing purposes',
    category: 'agents',
    price: 99,
    rating: 4.5,
    complexity: 'Intermediate',
    tags: ['AI', 'Test', 'Demo', 'Example'],
    imageUrl: 'https://via.placeholder.com/400x300',
    featured: true,
    sales: 1000,
  };

  const mockOnClick = vi.fn();

  it('should render product information correctly', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    expect(screen.getByText('Test AI Agent')).toBeDefined();
    expect(screen.getByText('A test product for testing purposes')).toBeDefined();
    expect(screen.getByText('$99')).toBeDefined();
    expect(screen.getByText('4.5')).toBeDefined();
    expect(screen.getByText('agents')).toBeDefined();
    expect(screen.getByText('Intermediate')).toBeDefined();
  });

  it('should display the product image', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const images = document.querySelectorAll('img');
    const productImage = Array.from(images).find(
      img => img.getAttribute('alt') === 'Test AI Agent'
    );
    expect(productImage).toBeDefined();
    expect(productImage?.getAttribute('src')).toBe('https://via.placeholder.com/400x300');
  });

  it('should render MotionPreviewIcon with correct props', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const icon = screen.getByTestId('motion-preview-icon');
    expect(icon.getAttribute('data-category')).toBe('agents');
    expect(icon.getAttribute('data-size')).toBe('36');
  });

  it('should call onClick when card is clicked', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const card = document.querySelector('.glass-card');
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(mockOnClick).toHaveBeenCalledWith(mockProduct);
  });

  it('should render complexity badge with correct color for Beginner', () => {
    const beginnerProduct = { ...mockProduct, complexity: 'Beginner' as const };
    render(<ProductCard product={beginnerProduct} onClick={mockOnClick} />);

    const badge = screen.getByText('Beginner');
    expect(badge.className).toContain('emerald-500');
  });

  it('should render complexity badge with correct color for Advanced', () => {
    const advancedProduct = { ...mockProduct, complexity: 'Advanced' as const };
    render(<ProductCard product={advancedProduct} onClick={mockOnClick} />);

    const badge = screen.getByText('Advanced');
    expect(badge.className).toContain('amber-500');
  });

  it('should render complexity badge with correct color for Expert', () => {
    const expertProduct = { ...mockProduct, complexity: 'Expert' as const };
    render(<ProductCard product={expertProduct} onClick={mockOnClick} />);

    const badge = screen.getByText('Expert');
    expect(badge.className).toContain('rose-500');
  });

  it('should have minimum touch target sizes for buttons', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const classes = button.className;
      // Check that button has min-w-[44px] and min-h-[44px]
      expect(classes).toContain('min-w-[44px]');
      expect(classes).toContain('min-h-[44px]');
    });
  });

  it('should render Info and ShoppingCart buttons', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle different product categories', () => {
    const categories: Array<'agents' | 'workflows' | 'automations' | 'bots'> = [
      'agents',
      'workflows',
      'automations',
      'bots',
    ];

    categories.forEach(category => {
      const product = { ...mockProduct, category };
      const { unmount } = render(<ProductCard product={product} onClick={mockOnClick} />);
      expect(screen.getByText(category)).toBeDefined();
      unmount();
    });
  });

  it('should display star rating icon', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    // Check for the rating display
    expect(screen.getByText('4.5')).toBeDefined();
  });
});
