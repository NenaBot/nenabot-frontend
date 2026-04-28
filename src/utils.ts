/**
 * Parses a finite number from an unknown value.
 * Accepts numeric strings in addition to number primitives.
 * Returns null when the value cannot be resolved to a finite number.
 */
export function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}
