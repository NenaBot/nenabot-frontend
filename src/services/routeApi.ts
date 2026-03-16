import { checkPath, detectPath, PathDetectResponseApi, PixelPointApiResponse } from './apiCalls';

export async function detectAndCheckPath(options?: Record<string, unknown>): Promise<{
  detect: PathDetectResponseApi;
  waypoints: PixelPointApiResponse[];
}> {
  const detect = await detectPath({ options: options ?? {} });
  const points = (detect.detections ?? [])
    .map((item) => {
      if (typeof item.center_x !== 'number' || typeof item.center_y !== 'number') {
        return null;
      }

      return {
        x: item.center_x,
        y: item.center_y,
      };
    })
    .filter((point): point is PixelPointApiResponse => point !== null);

  const checked = await checkPath(points);

  return {
    detect,
    waypoints: checked.waypoints ?? points,
  };
}
