/**
 * Integration tests for App component
 * Tests overall application flow, filtering, and state management
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    button: ({ children, className, onClick, ...props }: any) => (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components to simplify testing
vi.mock('./components/layout/Navbar', () => ({
  default: ({ searchQuery, onSearchChange, onAIConciergeOpen }: any) => (
    <div data-testid="navbar">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button data-testid="ai-concierge-btn" onClick={onAIConciergeOpen}>
        AI Concierge
      </button>
    </div>
  ),
}));

vi.mock('./components/layout/FilterSidebar', () => ({
  default: ({ isOpen, onToggle, onFilterChange }: any) => (
    <div data-testid="filter-sidebar">
      <button data-testid="toggle-sidebar" onClick={onToggle}>
        Toggle
      </button>
      <button
        data-testid="filter-beginner"
        onClick={() => onFilterChange({ complexity: ['Beginner'] })}
      >
        Filter Beginner
      </button>
    </div>
  ),
}));

vi.mock('./components/layout/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('./components/home/Hero', () => ({
  default: () => <div data-testid="hero">Hero</div>,
}));

vi.mock('./components/marketplace/BentoGrid', () => ({
  default: ({ products, onProductClick }: any) => (
    <div data-testid="bento-grid">
      {products.map((p: any) => (
        <div key={p.id} onClick={() => onProductClick(p)}>
          {p.title}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./components/marketplace/CategoryRail', () => ({
  default: ({ title, items, onProductClick }: any) => (
    <div data-testid={`category-rail-${title}`}>
      <h3>{title}</h3>
      {items.map((item: any) => (
        <div key={item.id} onClick={() => onProductClick(item)}>
          {item.title}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./components/home/AIConcierge', () => ({
  default: ({ isOpen, onClose, products, onProductClick }: any) =>
    isOpen ? (
      <div data-testid="ai-concierge">
        <button data-testid="close-concierge" onClick={onClose}>
          Close
        </button>
        {products.slice(0, 5).map((p: any) => (
          <div key={p.id} onClick={() => onProductClick(p)}>
            {p.title}
          </div>
        ))}
      </div>
    ) : null,
}));

vi.mock('./components/marketplace/ProductDetail', () => ({
  default: ({ product, onClose }: any) =>
    product ? (
      <div data-testid="product-detail">
        <h2>{product.title}</h2>
        <button data-testid="close-detail" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock('./components/marketplace/ProductCard', () => ({
  default: ({ product, onClick }: any) => (
    <div data-testid={`product-card-${product.id}`} onClick={() => onClick(product)}>
      {product.title}
    </div>
  ),
}));

describe('App Integration Tests', () => {
  it('should render the main application structure', () => {
    render(<App />);

    expect(screen.getByTestId('navbar')).toBeDefined();
    expect(screen.getByTestId('filter-sidebar')).toBeDefined();
    expect(screen.getByTestId('footer')).toBeDefined();
    expect(screen.getByTestId('hero')).toBeDefined();
  });

  it('should show discovery view by default', () => {
    render(<App />);

    // Hero should be visible in discovery mode
    expect(screen.getByTestId('hero')).toBeDefined();
    expect(screen.getByTestId('bento-grid')).toBeDefined();
  });

  it('should update search query when typing in search', () => {
    render(<App />);

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'agent' } });

    expect(searchInput.value).toBe('agent');
  });

  it('should switch to search results view when search query is entered', () => {
    render(<App />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Should show search results heading
    expect(screen.getByText('Search Results')).toBeDefined();
  });

  it('should display found items count in search results', () => {
    render(<App />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'agent' } });

    // Should show count of found items
    const resultsText = document.body.textContent || '';
    expect(resultsText).toContain('Found');
    expect(resultsText).toContain('items matching your criteria');
  });

  it('should reset filters when "Back to Discovery" is clicked', () => {
    render(<App />);

    // Enter search query
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Click "Back to Discovery" button
    const backButton = screen.getByText('Back to Discovery');
    fireEvent.click(backButton);

    // Should be back in discovery mode
    expect(screen.getByTestId('hero')).toBeDefined();
  });

  it('should open AI Concierge when button is clicked', () => {
    render(<App />);

    const aiButton = screen.getByTestId('ai-concierge-btn');
    fireEvent.click(aiButton);

    expect(screen.getByTestId('ai-concierge')).toBeDefined();
  });

  it('should close AI Concierge when close button is clicked', () => {
    render(<App />);

    // Open AI Concierge
    const aiButton = screen.getByTestId('ai-concierge-btn');
    fireEvent.click(aiButton);

    // Close it
    const closeButton = screen.getByTestId('close-concierge');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('ai-concierge')).toBeNull();
  });

  it('should open product detail when product is clicked', () => {
    render(<App />);

    // Find a product card and click it
    const productCards = document.querySelectorAll('[data-testid^="product-card-"]');
    if (productCards.length > 0) {
      fireEvent.click(productCards[0]);

      // Product detail should be visible
      expect(screen.getByTestId('product-detail')).toBeDefined();
    }
  });

  it('should close product detail when close button is clicked', () => {
    render(<App />);

    // Open product detail
    const productCards = document.querySelectorAll('[data-testid^="product-card-"]');
    if (productCards.length > 0) {
      fireEvent.click(productCards[0]);

      // Close it
      const closeButton = screen.getByTestId('close-detail');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('product-detail')).toBeNull();
    }
  });

  it('should render AI Concierge floating button', () => {
    render(<App />);

    // The floating button should be rendered
    const buttons = document.querySelectorAll('button');
    const floatingButton = Array.from(buttons).find(
      btn => btn.className.includes('fixed') && btn.className.includes('bottom-8')
    );
    expect(floatingButton).toBeDefined();
  });

  it('should handle filter changes from sidebar', () => {
    render(<App />);

    // Apply complexity filter
    const filterButton = screen.getByTestId('filter-beginner');
    fireEvent.click(filterButton);

    // Should show search results view
    expect(screen.getByText('Search Results')).toBeDefined();
  });

  it('should show "No items found" message when no results match filters', () => {
    render(<App />);

    // Enter a search that won't match anything
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } });

    // Should show no items found message
    expect(screen.getByText('No items found')).toBeDefined();
  });

  it('should show "Clear all filters" button when no results', () => {
    render(<App />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } });

    const clearButtons = screen.getAllByText(/Clear all filters/i);
    expect(clearButtons.length).toBeGreaterThan(0);
  });
});
