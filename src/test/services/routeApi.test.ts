import { detectRoute } from '../../services/routeApi';
import { detectPath } from '../../services/apiCalls';

jest.mock('../../services/apiCalls');
const detectPathMocked = detectPath as jest.MockedFunction<typeof detectPath>;

describe('routeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detectRoute calls detectPath with provided options', async () => {
    const mockDetectResponse = {
      ok: true,
      detections: [
        { center_x: 10, center_y: 20, corners: [] },
        { center_x: 30, center_y: 40, corners: [] },
      ],
    };
    detectPathMocked.mockResolvedValueOnce(mockDetectResponse);

    const result = await detectRoute({ customOption: 'value' });

    expect(detectPathMocked).toHaveBeenCalledWith({ options: { customOption: 'value' } });
    expect(result).toEqual(mockDetectResponse);
  });

  test('detectRoute returns detection response with detections', async () => {
    const mockDetectResponse = {
      ok: true,
      detections: [
        {
          center_x: 100,
          center_y: 150,
          corners: [
            { x: 90, y: 140 },
            { x: 110, y: 140 },
            { x: 110, y: 160 },
            { x: 90, y: 160 },
          ],
        },
      ],
      image_base64: 'imagedata123',
    };
    detectPathMocked.mockResolvedValue(mockDetectResponse);

    const result = await detectRoute();

    expect(result).toEqual(mockDetectResponse);
    expect(result.detections).toHaveLength(1);
    expect(result.image_base64).toBe('imagedata123');
  });

  test('detectRoute handles undefined detections', async () => {
    detectPathMocked.mockResolvedValue({
      ok: false,
      detections: undefined,
    });

    const result = await detectRoute();

    expect(result.detections).toBeUndefined();
  });
});
