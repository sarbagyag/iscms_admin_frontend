import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '@/types/api';
import { env } from '@/lib/env';

class HttpClient {
  private client: AxiosInstance;
  private refreshingPromise: Promise<string | null> | null = null;

  constructor() {
    const baseURL = this.getBaseURL();
    
    // Log initialization info
    console.log('🌐 HTTP Client: Initializing...', {
      baseURL,
      isUsingMSW: this.isMSWEnabled(),
      environment: env.NODE_ENV,
      apiMocking: env.NEXT_PUBLIC_API_MOCKING,
      debug: env.NEXT_PUBLIC_DEBUG
    });
    
    // Create axios instance
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token and request ID
    this.client.interceptors.request.use(
      (config) => {
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Add authorization header if token exists
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          if (env.NEXT_PUBLIC_DEBUG === 'true') {
            console.log('🔐 HTTP Client: Adding Authorization header with token:', {
              hasToken: !!token,
              tokenLength: token.length,
              tokenStart: token.substring(0, 20) + '...',
              url: config.url,
              method: config.method?.toUpperCase()
            });
          }
        } else {
          if (env.NEXT_PUBLIC_DEBUG === 'true') {
            console.log('⚠️ HTTP Client: No auth token found for request:', {
              url: config.url,
              method: config.method?.toUpperCase()
            });
          }
        }
        
        // Handle FormData - remove Content-Type to let browser set it automatically
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        
        if (env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('🌐 HTTP Client: Request sent:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            hasAuth: !!token,
            isFormData: config.data instanceof FormData,
            headers: Object.keys(config.headers || {}),
          });
        }
        
        return config;
      },
      (error) => {
        console.error('🚨 HTTP Client: Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle auth and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        if (env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log('🌐 HTTP Client: Response received:', {
            status: response.status,
            url: response.config.url,
            success: response.data?.success,
            fullResponseData: response.data,
            responseDataType: typeof response.data,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : 'no data'
          });
        }
        return response;
      },
      async (error) => {
        return this.handleResponseError(error);
      }
    );
  }

  private getBaseURL(): string {
    // In development, use MSW if enabled, otherwise use real backend
    if (this.isMSWEnabled()) {
      return ''; // MSW intercepts all requests
    }
    return env.NEXT_PUBLIC_API_BASE_URL;
  }

  private isMSWEnabled(): boolean {
    return env.NODE_ENV === 'development' && env.NEXT_PUBLIC_API_MOCKING === 'enabled';
  }

  private async refreshToken(): Promise<string | null> {
    if (this.refreshingPromise) {
      return this.refreshingPromise;
    }

    this.refreshingPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshingPromise;
      this.refreshingPromise = null;
      return newToken;
    } catch (error) {
      this.refreshingPromise = null;
      throw error;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        console.log('❌ HTTP Client: No refresh token found');
        return null;
      }

      // Use the same base URL logic as the main client
      const baseURL = this.isMSWEnabled() ? '' : env.NEXT_PUBLIC_API_BASE_URL;
      
      // Try different possible refresh endpoints
      const refreshEndpoints = [
        '/auth/refresh',
        '/api/v1/auth/refresh',
        '/api/auth/refresh'
      ];
      
      let lastError: any = null;
      
      for (const endpoint of refreshEndpoints) {
        try {
          const refreshUrl = `${baseURL}${endpoint}`;
          console.log('🔄 HTTP Client: Attempting token refresh at:', refreshUrl);

          const response = await axios.post<ApiResponse<{
            accessToken: string;
            refreshToken: string;
          }>>(refreshUrl, {
            refreshToken,
          }, {
            timeout: 10000, // 10 second timeout for refresh
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            this.storeTokens(accessToken, newRefreshToken);
            console.log('✅ HTTP Client: Tokens refreshed and stored');
            return accessToken;
          } else {
            console.log('❌ HTTP Client: Token refresh response invalid:', response.data);
            lastError = new Error('Invalid refresh response');
          }
        } catch (endpointError: any) {
          console.log(`❌ HTTP Client: Failed to refresh at ${endpoint}:`, endpointError.message);
          lastError = endpointError;
          // Continue to next endpoint
        }
      }
      
      // All endpoints failed
      console.error('❌ HTTP Client: All refresh endpoints failed');
      this.clearStoredTokens();
      return null;
      
    } catch (error) {
      console.error('❌ HTTP Client: Token refresh failed:', error);
      this.clearStoredTokens();
      return null;
    }
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth-token');
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh-token');
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth-token', accessToken);
    localStorage.setItem('refresh-token', refreshToken);
  }

  private clearStoredTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
  }

  private handleAuthFailure(): void {
    console.log('🚪 HTTP Client: Handling authentication failure');
    this.clearStoredTokens();
    
    // Use the auth utility for better state management
    if (typeof window !== 'undefined') {
      // Import and use the auth utility
      import('@/lib/auth-utils').then(({ forceLogout }) => {
        forceLogout();
      }).catch(() => {
        // Fallback to direct redirect if auth utility import fails
        setTimeout(() => {
          if (window.location.pathname !== '/login' && !window.location.pathname.includes('/admin/login')) {
            console.log('🚪 HTTP Client: Fallback redirect to login page');
            window.location.href = '/admin/login';
          }
        }, 100);
      });
    }
  }

  private normalizeError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const response = error.response?.data as ApiResponse;
      if (response?.error) {
        return response.error;
      }
      
      return {
        code: error.code || 'NETWORK_ERROR',
        message: error.message || 'Network error occurred',
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T, U = unknown>(
    url: string,
    data?: U,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T, U = unknown>(
    url: string,
    data?: U,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  async patch<T, U = unknown>(
    url: string,
    data?: U,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // Helper method to check if using MSW
  isUsingMSW(): boolean {
    return this.isMSWEnabled();
  }

  // Helper method to get current base URL
  getCurrentBaseURL(): string {
    return this.getBaseURL();
  }

  // Health check method
  async healthCheck(): Promise<{ healthy: boolean; baseURL: string; error?: string }> {
    const baseURL = this.getCurrentBaseURL();
    
    console.log('🏥 HTTP Client: Performing health check...', {
      baseURL,
      isUsingMSW: this.isUsingMSW(),
      environment: env.NODE_ENV,
      apiMocking: env.NEXT_PUBLIC_API_MOCKING
    });
    
    try {
      // Try different health check endpoints
      const healthEndpoints = ['/health', '/api/health', '/api/v1/health'];
      
      for (const endpoint of healthEndpoints) {
        try {
          const response = await this.client.get(endpoint, { timeout: 5000 });
          console.log('✅ HTTP Client: Health check passed', {
            endpoint,
            status: response.status,
            data: response.data
          });
          
          return { 
            healthy: true, 
            baseURL,
            endpoint
          };
        } catch (endpointError: any) {
          console.log(`❌ HTTP Client: Health check failed for ${endpoint}:`, endpointError.message);
        }
      }
      
      return { 
        healthy: false, 
        baseURL,
        error: 'All health endpoints failed'
      };
    } catch (error: any) {
      console.error('🚨 HTTP Client: Health check error:', error.message);
      return { 
        healthy: false, 
        baseURL,
        error: error.message 
      };
    }
  }

  // Public logout method
  logout(): void {
    console.log('🚪 HTTP Client: Logging out user');
    this.clearStoredTokens();
    this.handleAuthFailure();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;
    
    // Basic JWT token validation (check if it's expired)
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        console.log('🚫 HTTP Client: Invalid token format, clearing...');
        this.clearStoredTokens();
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('🚫 HTTP Client: Token is expired, clearing...');
        this.clearStoredTokens();
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('🚫 HTTP Client: Invalid token format, clearing...');
      this.clearStoredTokens();
      return false;
    }
  }

  // Get token expiration info for debugging
  getTokenInfo(): { isValid: boolean; expiresAt?: Date; isExpired?: boolean } {
    const token = this.getStoredToken();
    if (!token) {
      return { isValid: false };
    }
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        return { isValid: false };
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      const expiresAt = new Date(payload.exp * 1000);
      const isExpired = payload.exp && payload.exp < currentTime;
      
      return {
        isValid: true,
        expiresAt,
        isExpired
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  private async handleResponseError(error: any): Promise<any> {
    // Enhanced error logging
    const errorInfo = {
      message: error.message || 'Unknown error',
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      code: error.code,
      isNetworkError: !error.response,
      isAuthError: error.response?.status === 401 || error.response?.status === 403,
    };

    if (env.NEXT_PUBLIC_DEBUG === 'true') {
      console.error('🚨 HTTP Client: Response error:', errorInfo);
    } else {
      console.error('🚨 HTTP Client: API Error:', {
        status: errorInfo.status,
        message: errorInfo.message,
        url: errorInfo.url,
      });
    }
    
    // For 404 responses, return the response data instead of throwing
    if (error.response?.status === 404) {
      if (env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('🌐 HTTP Client: 404 response handled:', {
          url: error.config?.url,
          data: error.response?.data,
        });
      }
      return error.response;
    }

    // Handle network errors (when backend is not available)
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK')) {
      console.warn('🌐 HTTP Client: Network error detected - backend may not be available');
      
      // Return a mock response structure for network errors to prevent crashes
      return {
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        },
        status: 503,
        statusText: 'Service Unavailable'
      };
    }

    const originalRequest = error.config;

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔄 HTTP Client: Attempting token refresh...');
        const newToken = await this.refreshToken();
        if (newToken) {
          console.log('✅ HTTP Client: Token refreshed successfully');
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.client(originalRequest);
        } else {
          console.log('❌ HTTP Client: Token refresh failed, redirecting to login');
          // Clear tokens and redirect immediately
          this.clearStoredTokens();
          this.handleAuthFailure();
          return Promise.reject(new Error('Token refresh failed'));
        }
      } catch (refreshError) {
        console.log('❌ HTTP Client: Token refresh error:', refreshError);
        // Refresh failed, clear tokens and redirect to login
        this.clearStoredTokens();
        this.handleAuthFailure();
        return Promise.reject(new Error('Token refresh failed'));
      }
    }

    // Handle 403 Forbidden (token expired or invalid)
    if (error.response?.status === 403) {
      console.log('🚫 HTTP Client: Access forbidden, clearing tokens and redirecting');
      this.clearStoredTokens();
      this.handleAuthFailure();
      return Promise.reject(new Error('Access forbidden'));
    }

    // Handle other 5xx errors
    if (error.response?.status && error.response.status >= 500) {
      console.log('🌐 HTTP Client: Server error, clearing tokens for safety');
      this.clearStoredTokens();
      this.handleAuthFailure();
      return Promise.reject(new Error('Server error'));
    }

    return Promise.reject(this.normalizeError(error));
  }
}

export const httpClient = new HttpClient(); 