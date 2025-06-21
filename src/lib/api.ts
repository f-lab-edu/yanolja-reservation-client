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
  AccommodationImageListResponse,
  AccommodationImageResponse,
  AmenityRequest,
  AmenityResponse,
  AmenityConnectionRequest,
} from "@/types/accommodation";
import {
  UserInfoResponse,
  UserUpdateRequest,
  UserSearchCondition,
} from "@/types/user";
import {
  Room,
  RoomListItem,
  RoomRequest,
  RoomResponse,
  RoomOption,
  RoomOptionRequest,
  RoomOptionResponse,
  RoomSearchRequest,
  RoomListResponse,
  PortalRoom,
  RoomImage,
} from "@/types/room";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 이미지 URL 변환 함수
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return "";

  // 이미 전체 URL인 경우 그대로 반환
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // 상대 경로인 경우 API 베이스 URL과 결합
  return `${API_BASE_URL}${imageUrl}`;
};

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

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async uploadFiles<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    const config: RequestInit = {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);

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
      console.error("파일 업로드 오류:", error);
      throw error;
    }
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

  // 이미지 관련 API
  getAccommodationImages: (accommodationId: number) =>
    apiClient.get<AccommodationImageListResponse>(
      `/api/accommodations/${accommodationId}/images`
    ),

  uploadAccommodationImages: (
    accommodationId: number,
    files: File[],
    mainImageIndex?: number
  ) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    if (mainImageIndex !== undefined) {
      formData.append("mainImageIndex", mainImageIndex.toString());
    }
    return apiClient.uploadFiles<AccommodationImageResponse[]>(
      `/api/accommodations/${accommodationId}/images`,
      formData
    );
  },

  setMainImage: (imageId: number) =>
    apiClient.put<AccommodationImageResponse>(
      `/api/accommodations/images/${imageId}/main`
    ),

  deleteAccommodationImage: (imageId: number) =>
    apiClient.delete<void>(`/api/accommodations/images/${imageId}`),
};

// 예약 관련 API 함수들
export const reservationApi = {
  // 포털 사용자용 예약 API
  createReservation: (data: import("@/types/reservation").ReservationRequest) =>
    apiClient.post<import("@/types/reservation").ReservationResponse>(
      "/api/portal/reservations",
      data
    ),

  getReservation: (id: number) =>
    apiClient.get<import("@/types/reservation").ReservationResponse>(
      `/api/portal/reservations/${id}`
    ),

  getUserReservations: (status?: string, page = 0, size = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (status) params.append("status", status);

    return apiClient.get<
      import("@/types/reservation").PageResponse<
        import("@/types/reservation").ReservationListResponse
      >
    >(`/api/portal/reservations?${params}`);
  },

  searchReservations: (
    condition: import("@/types/reservation").ReservationSearchCondition,
    page = 0,
    size = 10
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.post<
      import("@/types/reservation").PageResponse<
        import("@/types/reservation").ReservationListResponse
      >
    >(`/api/portal/reservations/search?${params}`, condition);
  },

  updateReservationStatus: (
    id: number,
    data: import("@/types/reservation").ReservationStatusUpdateRequest
  ) =>
    apiClient.patch<import("@/types/reservation").ReservationResponse>(
      `/api/portal/reservations/${id}/status`,
      data
    ),

  cancelReservation: (id: number) =>
    apiClient.patch<import("@/types/reservation").ReservationResponse>(
      `/api/portal/reservations/${id}/cancel`
    ),

  getUserReservationStats: () =>
    apiClient.get<any[]>("/api/portal/reservations/stats"),

  // 관리자용 예약 API
  confirmReservation: (id: number) =>
    apiClient.patch<import("@/types/reservation").ReservationResponse>(
      `/api/v1/reservations/${id}/confirm`
    ),

  getRoomReservationStatus: (
    roomId: number,
    startDate: string,
    endDate: string
  ) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    return apiClient.get<any[]>(
      `/api/v1/reservations/rooms/${roomId}/status?${params}`
    );
  },

  cleanupExpiredReservations: () =>
    apiClient.post<void>("/api/v1/reservations/cleanup"),
};

// 편의시설 관련 API 함수들
export const amenityApi = {
  // 전체 편의시설 목록 조회 (백엔드에 /api/amenities 엔드포인트가 필요)
  getAllAmenities: () => apiClient.get<AmenityResponse[]>("/api/amenities"),

  // 편의시설 생성
  createAmenity: (data: AmenityRequest) =>
    apiClient.post<AmenityResponse>("/api/amenities", data),

  // 편의시설 수정
  updateAmenity: (id: number, data: AmenityRequest) =>
    apiClient.put<AmenityResponse>(`/api/amenities/${id}`, data),

  // 편의시설 삭제
  deleteAmenity: (id: number) => apiClient.delete<void>(`/api/amenities/${id}`),

  // 숙소의 편의시설 목록 조회
  getAccommodationAmenities: (accommodationId: number) =>
    apiClient.get<AmenityResponse[]>(
      `/api/accommodations/${accommodationId}/amenities`
    ),

  // 숙소에 편의시설 연결
  connectAmenitiesToAccommodation: (
    accommodationId: number,
    data: AmenityConnectionRequest
  ) =>
    apiClient.post<AmenityResponse[]>(
      `/api/accommodations/${accommodationId}/amenities`,
      data
    ),

  // 숙소에서 편의시설 연결 해제
  removeAmenityFromAccommodation: (
    accommodationId: number,
    amenityId: number
  ) =>
    apiClient.delete<void>(
      `/api/accommodations/${accommodationId}/amenities/${amenityId}`
    ),

  // 편의시설 아이콘 업로드
  uploadAmenityIcon: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/amenities/icons`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: localStorage.getItem("token")
          ? `Bearer ${localStorage.getItem("token")}`
          : "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "아이콘 업로드에 실패했습니다.");
    }

    const result = await response.json();
    return {
      data: result.data,
      message: result.message,
      success: result.success,
    };
  },
};

// 객실 관련 API 함수들
export const roomApi = {
  // 관리자용 객실 API
  getAllRooms: () => apiClient.get<RoomListItem[]>("/api/rooms"),

  getRoomById: (id: number) => apiClient.get<RoomResponse>(`/api/rooms/${id}`),

  createRoom: (data: RoomRequest) =>
    apiClient.post<RoomResponse>("/api/rooms", data),

  updateRoom: (id: number, data: RoomRequest) =>
    apiClient.put<RoomResponse>(`/api/rooms/${id}`, data),

  deleteRoom: (id: number) => apiClient.delete<void>(`/api/rooms/${id}`),

  getRoomsByAccommodation: (accommodationId: number) =>
    apiClient.get<RoomListItem[]>(
      `/api/rooms/accommodation/${accommodationId}`
    ),

  // 객실 이미지 관련 API
  getRoomImages: (roomId: number) =>
    apiClient.get<{ images: RoomImage[] }>(`/api/rooms/${roomId}/images`),

  uploadRoomImages: (
    roomId: number,
    files: File[],
    mainImageIndex?: number
  ) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    if (mainImageIndex !== undefined) {
      formData.append("mainImageIndex", mainImageIndex.toString());
    }
    return apiClient.uploadFiles<RoomImage[]>(
      `/api/rooms/${roomId}/images`,
      formData
    );
  },

  setRoomMainImage: (imageId: number) =>
    apiClient.put<RoomImage>(`/api/rooms/images/${imageId}/main`),

  deleteRoomImage: (imageId: number) =>
    apiClient.delete<void>(`/api/rooms/images/${imageId}`),

  // 객실 옵션 관리 API
  getRoomOptions: (roomId: number) =>
    apiClient.get<RoomOption[]>(`/api/rooms/${roomId}/options`),

  addRoomOptions: (roomId: number, optionIds: number[]) =>
    apiClient.post<void>(`/api/rooms/${roomId}/options`, optionIds),

  removeRoomOption: (roomId: number, optionId: number) =>
    apiClient.delete<void>(`/api/rooms/${roomId}/options/${optionId}`),

  removeAllRoomOptions: (roomId: number) =>
    apiClient.delete<void>(`/api/rooms/${roomId}/options`),

  // 포털용 객실 API
  searchRooms: (searchRequest: RoomSearchRequest) =>
    apiClient.post<RoomListResponse>("/api/portal/rooms/search", searchRequest),

  getPortalRoomDetail: (id: number) =>
    apiClient.get<PortalRoom>(`/api/portal/rooms/${id}`),

  getPortalRoomsByAccommodation: (accommodationId: number) =>
    apiClient.get<PortalRoom[]>(
      `/api/portal/rooms/accommodation/${accommodationId}`
    ),
};

// 객실 옵션 관리 API 함수들
export const roomOptionApi = {
  getAllRoomOptions: () =>
    apiClient.get<RoomOption[]>("/api/admin/room-options"),

  getRoomOptionById: (id: number) =>
    apiClient.get<RoomOptionResponse>(`/api/admin/room-options/${id}`),

  createRoomOption: (data: RoomOptionRequest) =>
    apiClient.post<RoomOptionResponse>("/api/admin/room-options", data),

  updateRoomOption: (id: number, data: RoomOptionRequest) =>
    apiClient.put<RoomOptionResponse>(`/api/admin/room-options/${id}`, data),

  deleteRoomOption: (id: number) =>
    apiClient.delete<void>(`/api/admin/room-options/${id}`),

  // 포털용 옵션 조회
  getPortalRoomOptions: () =>
    apiClient.get<RoomOption[]>("/api/portal/room-options"),
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
