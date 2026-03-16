import { useEffect, useState } from 'react';
import { isMockModeEnabled, setMockModeEnabled, subscribeMockMode } from '../state/mockMode';

export function useMockMode(): [boolean, (nextValue: boolean) => void] {
  const [enabled, setEnabled] = useState(isMockModeEnabled);

  useEffect(() => {
    return subscribeMockMode(() => {
      setEnabled(isMockModeEnabled());
    });
  }, []);

  return [enabled, setMockModeEnabled];
}
