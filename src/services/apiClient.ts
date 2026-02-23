/**
 * API Client Service
 * Centralized HTTP client for backend API communication with:
 * - Configurable base URL and timeout
 * - Error handling and retry logic
 * - Request/response interceptors
 * - Type-safe responses
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
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

async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = API_TIMEOUT,
    retries = MAX_RETRIES,
  } = config;

  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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
      throw new APIError(
        response.status,
        error.code || 'UNKNOWN_ERROR',
        error.message || `HTTP ${response.status}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry on network errors (not API errors)
    if (
      retries > 0 &&
      !(error instanceof APIError) &&
      !(error instanceof TypeError && error.message.includes('JSON'))
    ) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return request<T>(endpoint, { ...config, retries: retries - 1 });
    }

    throw error;
  }
}

export const apiClient = {
  get: <T,>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T,>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'POST', body }),

  put: <T,>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PUT', body }),

  patch: <T,>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PATCH', body }),

  delete: <T,>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),

  /**
   * Get the full URL for the video stream endpoint
   * Used for MJPEG multipart streams that need direct src access
   */
  getVideoStreamUrl: (): string => {
    return `${API_BASE_URL}/api/camera/stream`;
  },

  /**
   * Get the base API URL (useful for debugging or direct access)
   */
  getBaseUrl: (): string => {
    return API_BASE_URL;
  },
};
