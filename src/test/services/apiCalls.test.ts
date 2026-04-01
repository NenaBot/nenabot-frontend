import {
  fetchHealthStatus,
  fetchJobById,
  getJobEventsUrl,
  getStreamUrl,
} from '../../services/apiCalls';
import { apiClient } from '../../services/apiClient';

jest.mock('../../services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    getVideoStreamUrl: jest.fn(),
    getBaseUrl: jest.fn(() => 'http://localhost:8000'),
  },
}));

describe('apiCalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deduplicates concurrent health requests', async () => {
    const response = {
      status: 'ok',
      uptimeSeconds: 12,
      dms: { status: 'ok' },
      camera: { status: 'ok' },
      robot: { status: 'ok' },
    };

    (apiClient.get as jest.Mock).mockResolvedValue(response);

    const [first, second] = await Promise.all([fetchHealthStatus(), fetchHealthStatus()]);

    expect(first).toEqual(response);
    expect(second).toEqual(response);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/api/health');
  });

  test('clears dedupe cache after health request resolves', async () => {
    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce({
        status: 'ok',
        dms: { status: 'ok' },
        camera: { status: 'ok' },
        robot: { status: 'ok' },
      })
      .mockResolvedValueOnce({
        status: 'ok',
        dms: { status: 'online' },
        camera: { status: 'online' },
        robot: { status: 'online' },
      });

    await fetchHealthStatus();
    await fetchHealthStatus();

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  test('encodes and trims job id before requesting job by id', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ id: 'job/with spaces' });

    await fetchJobById('  job/with spaces  ');

    expect(apiClient.get).toHaveBeenCalledWith('/api/jobs/job%2Fwith%20spaces');
  });

  test('builds stream and job-events URLs from base API URL', () => {
    expect(getStreamUrl('camera')).toBe('http://localhost:8000/api/streams/camera/feed');
    expect(getJobEventsUrl('job/1')).toBe('http://localhost:8000/api/jobs/job%2F1/events');
  });
});
