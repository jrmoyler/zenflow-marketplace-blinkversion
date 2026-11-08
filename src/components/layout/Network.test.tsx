import { render, screen, within } from '@testing-library/react';
import ParentStrip from './ParentStrip';
import Footer from './Footer';

const D = 'https://collective-ai-divisions-brown.vercel.app';

describe('ParentStrip', () => {
  it('links back to the parent, the directory, ZenFlow and the hub', () => {
    render(<ParentStrip />);
    const nav = screen.getByRole('navigation', { name: 'Collective AI network' });
    const href = (name: string) => within(nav).getByRole('link', { name }).getAttribute('href');
    expect(href('A Collective AI Inc. division')).toBe('https://collectiveai-roan.vercel.app/');
    expect(href('All divisions')).toBe(`${D}/#divisions`);
    expect(href('ZenFlow site')).toBe(`${D}/zenflow/`);
    expect(href('Not sure? Start here')).toBe('https://collective-ai-start.vercel.app/');
    expect(within(nav).getByRole('link', { name: 'All divisions' })).toHaveClass('hidden', 'sm:inline-flex');
  });
});

describe('Footer', () => {
  it('keeps the in-page links and adds the network group', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Registry' })).toHaveAttribute('href', '#registry');
    expect(screen.getByRole('link', { name: 'Aegis standard' })).toHaveAttribute('href', '#aegis-standard');
    const net = screen.getByRole('navigation', { name: 'Collective AI network' });
    expect(within(net).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      'https://collectiveai-roan.vercel.app/',
      'https://collective-ai-start.vercel.app/',
      'https://the-collective-ai-assessment-platfo.vercel.app/',
      `${D}/zenflow/`,
    ]);
  });

  it('links the ten other divisions to their sites', () => {
    render(<Footer />);
    const links = within(screen.getByRole('navigation', { name: 'Other divisions' })).getAllByRole('link');
    expect(links).toHaveLength(10);
    expect(links[0]).toHaveAttribute('href', `${D}/the-collective/`);
    expect(links[0]).toHaveTextContent('The Collective');
    expect(links.map((a) => a.textContent)).not.toContain('ZenFlow');
  });

  it('gives every external link rel=noopener and a real URL', () => {
    render(<Footer />);
    for (const a of screen.getAllByRole('link')) {
      const href = a.getAttribute('href')!;
      expect(href).not.toBe('#');
      if (href.startsWith('http')) {
        expect(href).toMatch(/^https:\/\//);
        expect(a).toHaveAttribute('rel', 'noopener');
      } else {
        expect(href).toMatch(/^#[a-z-]+$/);
      }
    }
  });
});
