import { detectPath, PathDetectResponseApi } from './apiCalls';

// Direct path detection - no intermediate validation step
export async function detectRoute(
  options?: Record<string, unknown>,
): Promise<PathDetectResponseApi> {
  return detectPath({ options: options ?? {} });
}
