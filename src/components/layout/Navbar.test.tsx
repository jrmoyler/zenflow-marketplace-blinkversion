import { useState } from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar';

function setup(initialQuery = '') {
  const onQueryChange = vi.fn();
  const onOpenTaskFinder = vi.fn();

  function Harness() {
    const [query, setQuery] = useState(initialQuery);
    return (
      <>
        <Navbar
          query={query}
          onQueryChange={(q) => {
            onQueryChange(q);
            setQuery(q);
          }}
          onOpenTaskFinder={onOpenTaskFinder}
        />
        <textarea aria-label="notes" />
      </>
    );
  }

  render(<Harness />);
  const input = screen.getByRole('searchbox', { name: 'Search the registry' }) as HTMLInputElement;
  return { onQueryChange, onOpenTaskFinder, input, user: userEvent.setup() };
}

describe('Navbar', () => {
  it('renders the wordmark as a link home', () => {
    setup();
    const home = screen.getByRole('link', { name: 'ZenFlow Marketplace home' });
    expect(home).toHaveAttribute('href', '/');
    expect(home).toHaveTextContent('ZenFlow');
  });

  it('has no dead "#" links, login, or cart', () => {
    setup();
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href')).not.toBe('#');
    }
    expect(screen.queryByText(/sign in|log in|cart/i)).toBeNull();
  });

  it('calls onQueryChange as the user types', async () => {
    const { input, onQueryChange, user } = setup();
    await user.type(input, 'ledger');
    expect(onQueryChange).toHaveBeenLastCalledWith('ledger');
    expect(input.value).toBe('ledger');
  });

  it('focuses the search when "/" is pressed outside an input', () => {
    const { input } = setup();
    const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    act(() => {
      document.body.dispatchEvent(event);
    });
    expect(document.activeElement).toBe(input);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not steal "/" while typing in another field', () => {
    const { input } = setup();
    const notes = screen.getByLabelText('notes');
    notes.focus();
    fireEvent.keyDown(notes, { key: '/' });
    expect(document.activeElement).toBe(notes);
    expect(document.activeElement).not.toBe(input);
  });

  it('focuses the search on Cmd/Ctrl+K', () => {
    const { input } = setup();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(document.activeElement).toBe(input);
    input.blur();
    fireEvent.keyDown(window, { key: 'K', ctrlKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('clears and blurs on Escape', async () => {
    const { input, onQueryChange, user } = setup('agent');
    input.focus();
    await user.keyboard('{Escape}');
    expect(onQueryChange).toHaveBeenLastCalledWith('');
    expect(input.value).toBe('');
    expect(document.activeElement).not.toBe(input);
  });

  it('fires onOpenTaskFinder from the Find by task button', async () => {
    const { onOpenTaskFinder, user } = setup();
    await user.click(screen.getByRole('button', { name: /find by task/i }));
    expect(onOpenTaskFinder).toHaveBeenCalledTimes(1);
  });

  it('toggles the mobile search row', async () => {
    const { input, user } = setup();
    const toggle = screen.getByRole('button', { name: 'Open search' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    const close = screen.getByRole('button', { name: 'Close search' });
    expect(close).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(input);

    await user.click(close);
    expect(screen.getByRole('button', { name: 'Open search' })).toHaveAttribute('aria-expanded', 'false');
  });
});
