describe('mockMode state module', () => {
  beforeEach(() => {
    jest.resetModules();
    window.localStorage.clear();
    (globalThis as { __APP_ENV__?: Record<string, string> }).__APP_ENV__ = {
      VITE_USE_MOCK_DATA: 'false',
    };
  });

  test('reads initial value from localStorage=true', async () => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');

    const mod = await import('../../state/mockMode');

    expect(mod.isMockModeEnabled()).toBe(true);
  });

  test('reads initial value from localStorage=false', async () => {
    window.localStorage.setItem('nenabot-use-mock-data', 'false');

    const mod = await import('../../state/mockMode');

    expect(mod.isMockModeEnabled()).toBe(false);
  });

  test('setMockModeEnabled persists value and notifies listeners once', async () => {
    const mod = await import('../../state/mockMode');
    const listener = jest.fn();

    const unsubscribe = mod.subscribeMockMode(listener);

    mod.setMockModeEnabled(true);

    expect(mod.isMockModeEnabled()).toBe(true);
    expect(window.localStorage.getItem('nenabot-use-mock-data')).toBe('true');
    expect(listener).toHaveBeenCalledTimes(1);

    mod.setMockModeEnabled(true);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    mod.setMockModeEnabled(false);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
