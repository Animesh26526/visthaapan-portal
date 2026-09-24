// VISTHAAPAN Centralized API Client
// Single low-level HTTP boundary for future Node.js + Express backend communication

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClientError extends Error {
  status: number;
  statusText: string;
  data: unknown;

  constructor(status: number, statusText: string, data: unknown, message?: string) {
    super(message || `API Request Failed: ${status} ${statusText}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

class ApiClient {
  private getBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.replace(/\/+$/, '');
    }
    return 'http://localhost:5000/api/v1';
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseUrl = this.getBaseUrl();
    if (baseUrl.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1/')) {
      cleanEndpoint = cleanEndpoint.substring('/api/v1'.length);
    }
    const url = new URL(`${baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private getHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    // Prepare for future statutory officer authentication
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('visthaapan_auth_token') || localStorage.getItem('visthaapan_auth_token');
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  async request<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const { timeoutMs = 10000, params, headers: customHeaders, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);
    const headers = this.getHeaders(customHeaders);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: unknown = null;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        throw new ApiClientError(response.status, response.statusText, errorData);
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof ApiClientError) {
        throw err;
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError(408, 'Request Timeout', null, `Request timed out after ${timeoutMs}ms`);
      }
      const message = err instanceof Error ? err.message : 'Unknown Network Error';
      throw new ApiClientError(0, 'Network Error', null, message);
    }
  }

  get<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
