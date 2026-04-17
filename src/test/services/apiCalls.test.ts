import {
  deleteJob,
  fetchDefaultProfile,
  fetchJobs,
  fetchLatestJob,
  fetchProfiles,
  fetchHealthStatus,
  fetchJobById,
  getJobImageUrl,
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
      ionvision: { status: 'ok' },
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
        ionvision: { status: 'ok' },
        camera: { status: 'ok' },
        robot: { status: 'ok' },
      })
      .mockResolvedValueOnce({
        status: 'ok',
        ionvision: { status: 'online' },
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

    expect(apiClient.get).toHaveBeenCalledWith('/api/job/job%2Fwith%20spaces');
  });

  test('deduplicates concurrent profile requests and clears cache after failure', async () => {
    const profileError = new Error('profile fetch failed');
    (apiClient.get as jest.Mock)
      .mockRejectedValueOnce(profileError)
      .mockResolvedValueOnce([{ name: 'default' }]);

    await expect(Promise.all([fetchProfiles(), fetchProfiles()])).rejects.toThrow(
      'profile fetch failed',
    );
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    await expect(fetchProfiles()).resolves.toEqual([{ name: 'default' }]);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  test('deduplicates concurrent fetchJobById requests and clears cache after failure', async () => {
    const jobError = new Error('job fetch failed');
    (apiClient.get as jest.Mock)
      .mockRejectedValueOnce(jobError)
      .mockResolvedValueOnce({ id: 'job-1' });

    await expect(Promise.all([fetchJobById('job-1'), fetchJobById('job-1')])).rejects.toThrow(
      'job fetch failed',
    );
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    await expect(fetchJobById('job-1')).resolves.toEqual({ id: 'job-1' });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  test('routes wrappers call correct endpoints', async () => {
    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce({ name: 'default' })
      .mockResolvedValueOnce([{ id: 'job-1' }])
      .mockResolvedValueOnce({ id: 'job-latest' });
    (apiClient.delete as jest.Mock).mockResolvedValue(undefined);

    await expect(fetchDefaultProfile()).resolves.toEqual({ name: 'default' });
    await expect(fetchJobs()).resolves.toEqual([{ id: 'job-1' }]);
    await expect(fetchLatestJob()).resolves.toEqual({ id: 'job-latest' });
    await expect(deleteJob(' job/1 ')).resolves.toBeUndefined();

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/profile/default');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/job');
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/api/job/latest');
    expect(apiClient.delete).toHaveBeenCalledWith('/api/job/job%2F1');
  });

  test('builds stream and job-events URLs from base API URL', () => {
    expect(getStreamUrl('camera')).toBe('http://localhost:8000/api/stream/camera/feed');
    expect(getJobEventsUrl('job/1')).toBe('http://localhost:8000/api/job/job%2F1/events');
    expect(getJobImageUrl('job/1')).toBe('http://localhost:8000/api/job/job%2F1/image');
  });

  test('warns when stream URL uses container-only hostname', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (apiClient.getBaseUrl as jest.Mock).mockReturnValue('http://backend:8000');

    const streamUrl = getStreamUrl('detection');

    expect(streamUrl).toBe('http://backend:8000/api/stream/detection/feed');
    expect(warnSpy).toHaveBeenCalledWith(
      '[CameraAPI] Stream host may be unreachable from browser context',
      expect.objectContaining({
        streamUrl: 'http://backend:8000/api/stream/detection/feed',
        browserHost: window.location.hostname,
      }),
    );
  });

  test('does not warn when stream URL uses browser-reachable host', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (apiClient.getBaseUrl as jest.Mock).mockReturnValue('http://localhost:8000');

    const streamUrl = getStreamUrl('camera');

    expect(streamUrl).toBe('http://localhost:8000/api/stream/camera/feed');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('warns when stream URL cannot be parsed', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (apiClient.getBaseUrl as jest.Mock).mockReturnValue('not-a-url');

    const streamUrl = getStreamUrl('camera');

    expect(streamUrl).toBe('not-a-url/api/stream/camera/feed');
    expect(warnSpy).toHaveBeenCalledWith(
      '[CameraAPI] Failed to parse stream URL for host reachability check',
      expect.objectContaining({
        streamUrl: 'not-a-url/api/stream/camera/feed',
      }),
    );
  });
});
