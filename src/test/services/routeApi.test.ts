import { detectAndCheckPath } from '../../services/routeApi';
import { checkPath, detectPath } from '../../services/apiCalls';

jest.mock('../../services/apiCalls');
const checkPathMocked = checkPath as jest.MockedFunction<typeof checkPath>;
const detectPathMocked = detectPath as jest.MockedFunction<typeof detectPath>;

describe('routeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detectAndCheckPath processes detections and returns waypoints', async () => {
    const mockDetectResponse = {
      ok: true,
      detections: [
        { center_x: 10, center_y: 20 },
        { center_x: 30, center_y: 40 },
      ],
    };
    const mockCheckResponse = {
      waypoints: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
    };
    detectPathMocked.mockResolvedValueOnce(mockDetectResponse);
    checkPathMocked.mockResolvedValue(mockCheckResponse);

    const result = await detectAndCheckPath();

    expect(detectPathMocked).toHaveBeenCalledWith({ options: {} });
    expect(checkPathMocked).toHaveBeenCalledWith([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);

    expect(result).toEqual({
      detect: mockDetectResponse,
      waypoints: mockCheckResponse.waypoints,
    });
  });

  test('detectAndCheckPath falls back to processed points when checkPath returns no waypoints', async () => {
    detectPathMocked.mockResolvedValueOnce({
      ok: true,
      detections: [
        { center_x: 10, center_y: 20 },
        { center_x: 30, center_y: 40 },
      ],
    });
    checkPathMocked.mockResolvedValue({
      waypoints: undefined,
    });

    const result = await detectAndCheckPath();

    expect(result.waypoints).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
  });

  test('detectAndCheckPath handles undefined detections', async () => {
    detectPathMocked.mockResolvedValue({
      ok: true,
      detections: undefined,
    });
    checkPathMocked.mockResolvedValue({
      waypoints: [],
    });

    const result = await detectAndCheckPath();

    expect(checkPathMocked).toHaveBeenCalledWith([]);
    expect(result.waypoints).toEqual([]);
  });
});
