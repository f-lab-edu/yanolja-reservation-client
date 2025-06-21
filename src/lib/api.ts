import {
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  TokenResponse,
  User,
} from "@/types/auth";
import {
  AccommodationListResponse,
  AccommodationDetailResponse,
  AccommodationRequest,
  AccommodationResponse,
} from "@/types/accommodation";
import {
  UserInfoResponse,
  UserUpdateRequest,
  UserSearchCondition,
} from "@/types/user";

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

      // 응답이 비어있거나 JSON이 아닌 경우 처리
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (jsonError) {
        console.error("JSON 파싱 오류:", jsonError);
        throw new Error("서버 응답 형식이 올바르지 않습니다.");
      }

      if (!response.ok || !data.success) {
        const errorMessage =
          data.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        // @ts-ignore
        error.code = data.code;
        throw error;
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

  register: (registerData: RegisterRequest) =>
    apiClient.post<User>("/api/users/register", registerData),

  checkEmailDuplicate: (email: string) =>
    apiClient.get<boolean>(
      `/api/users/check-email?email=${encodeURIComponent(email)}`
    ),

  logout: (refreshToken: string) =>
    apiClient.post("/api/auth/logout", { refreshToken }),

  refreshToken: (refreshToken: string) =>
    apiClient.post<TokenResponse>("/api/auth/refresh", { refreshToken }),
};

// 숙소 관련 API 함수들
export const accommodationApi = {
  getAllAccommodations: () =>
    apiClient.get<AccommodationListResponse[]>("/api/accommodations"),

  getAccommodationById: (id: number) =>
    apiClient.get<AccommodationDetailResponse>(`/api/accommodations/${id}`),

  // 관리자용 CRUD 함수들
  createAccommodation: (data: AccommodationRequest) =>
    apiClient.post<AccommodationResponse>("/api/accommodations", data),

  updateAccommodation: (id: number, data: AccommodationRequest) =>
    apiClient.put<AccommodationResponse>(`/api/accommodations/${id}`, data),

  deleteAccommodation: (id: number) =>
    apiClient.delete<void>(`/api/accommodations/${id}`),

  // 관리자용 상세 조회
  getAccommodationForAdmin: (id: number) =>
    apiClient.get<AccommodationResponse>(`/api/accommodations/${id}`),
};

// 사용자 관련 API 함수들
export const userApi = {
  // 사용자 정보 조회
  getUserInfo: (id: number) =>
    apiClient.get<UserInfoResponse>(`/api/users/${id}`),

  // 현재 로그인한 사용자 정보 조회 (JWT 토큰 기반)
  getCurrentUser: () => apiClient.get<UserInfoResponse>("/api/users/me"),

  // 사용자 정보 수정
  updateUser: (id: number, data: UserUpdateRequest) =>
    apiClient.put<void>(`/api/users/${id}`, data),

  // 회원 탈퇴
  withdrawUser: (id: number) =>
    apiClient.post<void>(`/api/users/${id}/withdraw`),

  // 사용자 목록 조회 (관리자용)
  searchUsers: (condition: UserSearchCondition) =>
    apiClient.get<UserInfoResponse[]>(
      `/api/users?${new URLSearchParams(condition as any).toString()}`
    ),
};

// 쿠키 유틸리티 함수
export const cookieUtils = {
  getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  },

  deleteCookie(name: string): void {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },
};

export default apiClient;
