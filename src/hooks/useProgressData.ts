import { useEffect, useState } from 'react';
import { mockProgressTabState } from '../mocks/progressMocks';
import { ProgressTabState } from '../types/progress.types';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export function useProgressData() {
  const [progressState, setProgressState] = useState<ProgressTabState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setProgressState(mockProgressTabState);
      setError(null);
      setIsLoading(false);
      return;
    }

    setProgressState(null);
    setError('Live progress backend integration is not available yet.');
    setIsLoading(false);
  }, []);

  return {
    progressState,
    isLoading,
    error,
  };
}
