import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ANIMATION_DURATION_MS = 220;

interface WithId {
  id: number;
}

interface TopInsertAnimationOptions {
  animationDurationMs?: number;
}

interface TopInsertAnimationState<TItem extends WithId> {
  displayItems: TItem[];
  enteringItemId: number | null;
  isPushingExistingItems: boolean;
}

/**
 * Shared list animation state for "newest-first" logs.
 *
 * - Reverses chronological arrays so newest item appears first.
 * - Detects top insertions and drives both enter and push animations.
 * - Skips animation on first paint for stable initial rendering.
 */
export function useTopInsertListAnimation<TItem extends WithId>(
  items: TItem[],
  options?: TopInsertAnimationOptions,
): TopInsertAnimationState<TItem> {
  const animationDurationMs = options?.animationDurationMs ?? DEFAULT_ANIMATION_DURATION_MS;
  const displayItems = useMemo(() => [...items].reverse(), [items]);
  const [enteringItemId, setEnteringItemId] = useState<number | null>(null);
  const [isPushingExistingItems, setIsPushingExistingItems] = useState(false);
  const previousTopItemIdRef = useRef<number | null>(null);
  const previousLengthRef = useRef(0);

  useEffect(() => {
    const newestItemId = displayItems[0]?.id ?? null;
    const previousTopItemId = previousTopItemIdRef.current;
    const previousLength = previousLengthRef.current;
    const hasInsertion = displayItems.length > previousLength;

    if (newestItemId === null) {
      previousTopItemIdRef.current = null;
      previousLengthRef.current = 0;
      setEnteringItemId(null);
      setIsPushingExistingItems(false);
      return;
    }

    if (previousTopItemId !== null && newestItemId !== previousTopItemId && hasInsertion) {
      setEnteringItemId(newestItemId);
      setIsPushingExistingItems(true);

      const timer = window.setTimeout(() => {
        setEnteringItemId((current) => (current === newestItemId ? null : current));
        setIsPushingExistingItems(false);
      }, animationDurationMs);

      previousTopItemIdRef.current = newestItemId;
      previousLengthRef.current = displayItems.length;
      return () => window.clearTimeout(timer);
    }

    previousTopItemIdRef.current = newestItemId;
    previousLengthRef.current = displayItems.length;
    setIsPushingExistingItems(false);
    return;
  }, [animationDurationMs, displayItems]);

  return {
    displayItems,
    enteringItemId,
    isPushingExistingItems,
  };
}
