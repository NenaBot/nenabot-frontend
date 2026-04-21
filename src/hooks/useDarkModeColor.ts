import { useDarkMode } from './useDarkMode';

/**
 * Hook to get adaptive color for use on gradient backgrounds based on theme
 * Returns white in light mode, black in dark mode
 */
export function useDarkModeColor() {
  const [isDark] = useDarkMode();
  return isDark ? 'black' : 'white';
}
