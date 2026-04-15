/**
 * API Client Service
 * Centralized HTTP client for backend API communication with:
 * - Configurable base URL and timeout
 * - Error handling and retry logic
 * - Request/response interceptors
 * - Type-safe responses
 */

function getAppEnvValue(key: keyof ImportMetaEnv): string | undefined {
  if (typeof __APP_ENV__ !== 'undefined' && __APP_ENV__ && __APP_ENV__[key]) {
    return __APP_ENV__[key];
  }

  return undefined;
}

const API_BASE_URL = getAppEnvValue('VITE_API_URL') || 'http://localhost:8000';
const API_TIMEOUT = parseInt(getAppEnvValue('VITE_API_TIMEOUT') || '30000', 10);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

function isCameraEndpoint(endpoint: string): boolean {
  return endpoint.startsWith('/api/stream/') || endpoint.startsWith('/api/path/detect');
}

function logCameraRequest(event: string, details: Record<string, unknown>): void {
  console.info('[CameraAPI]', event, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = API_TIMEOUT,
    retries = MAX_RETRIES,
  } = config;

  const url = `${API_BASE_URL}${endpoint}`;
  const cameraRequest = isCameraEndpoint(endpoint);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  console.log(`[API] ${method} ${url}`, { body, headers, timeout, retries });
  if (cameraRequest) {
    logCameraRequest('Outgoing camera-related request', {
      method,
      endpoint,
      url,
      timeout,
      retries,
      body,
    });
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`[API] ${method} ${url} failed:`, response.status, error);
      if (cameraRequest) {
        logCameraRequest('Camera-related request failed', {
          method,
          endpoint,
          url,
          status: response.status,
          error,
        });
      }
      throw new APIError(
        response.status,
        error.code || 'UNKNOWN_ERROR',
        error.message || `HTTP ${response.status}`,
      );
    }

    const data = (await response.json()) as T;
    console.log(`[API] ${method} ${url} success:`, data);
    if (cameraRequest) {
      logCameraRequest('Camera-related request succeeded', {
        method,
        endpoint,
        url,
        status: response.status,
      });
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry on network errors (not API errors)
    if (
      retries > 0 &&
      !(error instanceof APIError) &&
      !(error instanceof TypeError && error.message.includes('JSON'))
    ) {
      console.warn(`[API] ${method} ${url} retrying (${retries} attempts left):`, error);
      if (cameraRequest) {
        logCameraRequest('Retrying camera-related request', {
          method,
          endpoint,
          url,
          retriesLeft: retries,
          error,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return request<T>(endpoint, { ...config, retries: retries - 1 });
    }

    console.error(`[API] ${method} ${url} failed permanently:`, error);
    if (cameraRequest) {
      logCameraRequest('Camera-related request failed permanently', {
        method,
        endpoint,
        url,
        error,
      });
    }
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PATCH', body }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),

  /**
   * Get the full URL for the video stream endpoint
   * Used for MJPEG multipart streams that need direct src access
   */
  getVideoStreamUrl: (): string => {
    const legacyUrl = `${API_BASE_URL}/api/stream/camera/feed`;
    console.warn(
      '[CameraAPI] apiClient.getVideoStreamUrl() is deprecated, prefer getStreamUrl(kind)',
      {
        timestamp: new Date().toISOString(),
        url: legacyUrl,
      },
    );
    return legacyUrl;
  },

  /**
   * Get the base API URL (useful for debugging or direct access)
   */
  getBaseUrl: (): string => {
    return API_BASE_URL;
  },
};
