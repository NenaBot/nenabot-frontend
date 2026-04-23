import { act, renderHook, waitFor } from '@testing-library/react';
import { useDarkMode } from '../../hooks/useDarkMode';

function createMatchMediaMock(matches = false) {
  return jest.fn().mockImplementation(() => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(false),
    });
  });

  test('syncs theme changes across multiple hook instances', async () => {
    const first = renderHook(() => useDarkMode());
    const second = renderHook(() => useDarkMode());

    expect(first.result.current[0]).toBe(false);
    expect(second.result.current[0]).toBe(false);

    act(() => {
      first.result.current[1](true);
    });

    await waitFor(() => {
      expect(second.result.current[0]).toBe(true);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('nenabot-theme')).toBe('dark');
  });

  test('updates state when the theme event is dispatched externally', async () => {
    const { result } = renderHook(() => useDarkMode());

    act(() => {
      window.dispatchEvent(new CustomEvent('nenabot-theme-change', { detail: { dark: true } }));
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(true);
    });
  });
});
