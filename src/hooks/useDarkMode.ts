import { useEffect, useState } from 'react';

const THEME_EVENT = 'nenabot-theme-change';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const saved = localStorage.getItem('nenabot-theme');
    if (saved === 'dark') {
      return true;
    }

    if (saved === 'light') {
      return false;
    }

    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.classList.toggle('light', !dark);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { dark } }));
    }

    try {
      localStorage.setItem('nenabot-theme', dark ? 'dark' : 'light');
    } catch {
      return;
    }
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      if (localStorage.getItem('nenabot-theme')) {
        return;
      }

      setDark(event.matches);
    };

    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ dark?: boolean }>;
      if (typeof customEvent.detail?.dark === 'boolean') {
        setDark(customEvent.detail.dark);
      }
    };

    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
    } else {
      mq.addListener(onChange);
    }

    window.addEventListener(THEME_EVENT, onThemeChange);

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', onChange);
      } else {
        mq.removeListener(onChange);
      }

      window.removeEventListener(THEME_EVENT, onThemeChange);
    };
  }, []);

  return [dark, setDark] as const;
}
