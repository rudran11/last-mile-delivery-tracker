export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl = import.meta.env.VITE_API_URL || '/api/v1';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Handle unauthorized globally if needed (e.g., clear token)
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          // Dispatch a custom event to tell the app to log out
          window.dispatchEvent(new Event('auth:unauthorized'));
        }

        const errorMessage = typeof data?.error === 'string' ? data.error : data?.error?.message || data?.message || 'An unexpected error occurred';
        throw new ApiError(
          response.status,
          errorMessage,
          data
        );
      }

      // Unwrap standard response envelope { success: true, data: ... }
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        return data.data as T;
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, 'Network error or server is unreachable');
    }
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
