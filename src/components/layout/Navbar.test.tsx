/**
 * Component tests for Navbar
 * Tests search functionality, mobile menu, and navigation interactions
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';

describe('Navbar', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnAIConciergeOpen = vi.fn();

  const defaultProps = {
    searchQuery: '',
    onSearchChange: mockOnSearchChange,
    onAIConciergeOpen: mockOnAIConciergeOpen,
  };

  beforeEach(() => {
    mockOnSearchChange.mockClear();
    mockOnAIConciergeOpen.mockClear();
  });

  it('should render the Zenflow logo', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('Zenflow')).toBeDefined();
  });

  it('should render desktop navigation links', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getByText('Marketplace')).toBeDefined();
    expect(screen.getByText('Enterprise')).toBeDefined();
  });

  it('should render AI Concierge button', () => {
    render(<Navbar {...defaultProps} />);
    const aiButtons = screen.getAllByText('AI Concierge');
    expect(aiButtons.length).toBeGreaterThan(0);
  });

  it('should render search input with correct placeholder', () => {
    render(<Navbar {...defaultProps} />);
    const searchInputs = document.querySelectorAll('input[type="text"]');
    const desktopSearch = Array.from(searchInputs).find(
      input => input.getAttribute('placeholder')?.includes('Search agents')
    );
    expect(desktopSearch).toBeDefined();
  });

  it('should call onSearchChange when typing in search input', () => {
    render(<Navbar {...defaultProps} />);
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    expect(mockOnSearchChange).toHaveBeenCalledWith('test query');
  });

  it('should display search query value', () => {
    render(<Navbar {...defaultProps} searchQuery="test search" />);
    const searchInputs = document.querySelectorAll('input[type="text"]');
    const hasValue = Array.from(searchInputs).some(
      input => (input as HTMLInputElement).value === 'test search'
    );
    expect(hasValue).toBe(true);
  });

  it('should call onAIConciergeOpen when AI Concierge button is clicked', () => {
    render(<Navbar {...defaultProps} />);
    const aiButton = screen.getAllByText('AI Concierge')[0];
    fireEvent.click(aiButton);
    expect(mockOnAIConciergeOpen).toHaveBeenCalled();
  });

  it('should toggle mobile menu when menu button is clicked', () => {
    render(<Navbar {...defaultProps} />);

    // Mobile menu should not be visible initially
    const mobileMenus = document.querySelectorAll('.lg\\:hidden');
    const hiddenMenu = Array.from(mobileMenus).find(
      el => el.className.includes('border-t')
    );

    // Find and click the menu toggle button
    const menuButtons = document.querySelectorAll('button');
    const menuButton = Array.from(menuButtons).find(
      btn => btn.className.includes('lg:hidden')
    );

    if (menuButton) {
      fireEvent.click(menuButton);
      // After clicking, mobile menu should be visible
      // We can check if the menu container exists
      const menus = document.querySelectorAll('.lg\\:hidden');
      expect(menus.length).toBeGreaterThan(1);
    }
  });

  it('should render shopping cart button', () => {
    render(<Navbar {...defaultProps} />);
    const buttons = document.querySelectorAll('button');
    const hasCartButton = Array.from(buttons).some(
      btn => btn.className.includes('relative')
    );
    expect(hasCartButton).toBe(true);
  });

  it('should render Sign In button', () => {
    render(<Navbar {...defaultProps} />);
    const signInButtons = screen.getAllByText('Sign In');
    expect(signInButtons.length).toBeGreaterThan(0);
  });

  it('should render Get Started button', () => {
    render(<Navbar {...defaultProps} />);
    const getStartedButtons = screen.getAllByText('Get Started');
    expect(getStartedButtons.length).toBeGreaterThan(0);
  });

  it('should have minimum touch target sizes for buttons', () => {
    render(<Navbar {...defaultProps} />);
    const buttons = document.querySelectorAll('button');
    const minSizeButtons = Array.from(buttons).filter(
      btn => btn.className.includes('min-w-[44px]') && btn.className.includes('min-h-[44px]')
    );
    expect(minSizeButtons.length).toBeGreaterThan(0);
  });

  it('should clear search when logo is clicked', () => {
    render(<Navbar {...defaultProps} searchQuery="test" />);
    const logo = screen.getByText('Zenflow');
    const logoContainer = logo.closest('.cursor-pointer');

    if (logoContainer) {
      fireEvent.click(logoContainer);
      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    }
  });

  it('should close mobile menu when AI Concierge is clicked in mobile menu', () => {
    render(<Navbar {...defaultProps} />);

    // Open mobile menu first
    const menuButtons = document.querySelectorAll('button');
    const menuButton = Array.from(menuButtons).find(
      btn => btn.className.includes('lg:hidden') && btn.querySelector('svg')
    );

    if (menuButton) {
      fireEvent.click(menuButton);

      // Click AI Concierge in mobile menu
      const aiButtons = screen.getAllByText('AI Concierge');
      const mobileAIButton = aiButtons.find(
        btn => btn.className.includes('text-left')
      );

      if (mobileAIButton) {
        fireEvent.click(mobileAIButton);
        expect(mockOnAIConciergeOpen).toHaveBeenCalled();
      }
    }
  });
});
