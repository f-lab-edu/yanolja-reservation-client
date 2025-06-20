import { LoginRequest, ApiResponse, TokenResponse } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "요청에 실패했습니다.");
      }

      return data;
    } catch (error) {
      console.error("API 요청 오류:", error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "GET",
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// 인증 관련 API 함수들
export const authApi = {
  login: (loginData: LoginRequest) =>
    apiClient.post<TokenResponse>("/api/auth/login", loginData),

  logout: (refreshToken: string) =>
    apiClient.post("/api/auth/logout", { refreshToken }),

  refreshToken: (refreshToken: string) =>
    apiClient.post<TokenResponse>("/api/auth/refresh", { refreshToken }),
};

export default apiClient;
