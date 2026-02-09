/**
 * Unit tests for utility functions
 * Tests the cn() function for proper className merging
 */
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn()', () => {
    it('should merge class names correctly', () => {
      const result = cn('btn', 'btn-primary');
      expect(result).toBe('btn btn-primary');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('btn', isActive && 'active');
      expect(result).toBe('btn active');
    });

    it('should filter out falsy values', () => {
      const result = cn('btn', false, null, undefined, 'active');
      expect(result).toBe('btn active');
    });

    it('should merge Tailwind conflicting classes correctly', () => {
      // twMerge should handle conflicting Tailwind classes
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['btn', 'btn-primary'], 'active');
      expect(result).toBe('btn btn-primary active');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        btn: true,
        'btn-primary': true,
        disabled: false,
      });
      expect(result).toBe('btn btn-primary');
    });

    it('should handle complex nested structures', () => {
      const result = cn(
        'base',
        ['array-1', 'array-2'],
        { 'obj-true': true, 'obj-false': false },
        undefined,
        'final'
      );
      expect(result).toContain('base');
      expect(result).toContain('array-1');
      expect(result).toContain('array-2');
      expect(result).toContain('obj-true');
      expect(result).not.toContain('obj-false');
      expect(result).toContain('final');
    });
  });
});
