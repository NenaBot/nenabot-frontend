const MOCK_MODE_STORAGE_KEY = 'nenabot-use-mock-data';

function readInitialMockMode(): boolean {
  const envDefault =
    typeof __APP_ENV__ !== 'undefined' && __APP_ENV__?.VITE_USE_MOCK_DATA === 'true';

  if (typeof window === 'undefined') {
    return envDefault;
  }

  const stored = window.localStorage.getItem(MOCK_MODE_STORAGE_KEY);
  if (stored === 'true') {
    return true;
  }

  if (stored === 'false') {
    return false;
  }

  return envDefault;
}

let isEnabled = readInitialMockMode();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function isMockModeEnabled(): boolean {
  return isEnabled;
}

export function setMockModeEnabled(nextValue: boolean): void {
  if (isEnabled === nextValue) {
    return;
  }

  isEnabled = nextValue;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_MODE_STORAGE_KEY, String(nextValue));
  }

  notifyListeners();
}

export function subscribeMockMode(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
