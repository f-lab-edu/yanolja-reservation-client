export interface Accommodation {
  id: number;
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  pricePerNight: number;
  rating?: number;
  reviewCount?: number;
  status?: string;
  mainImageUrl?: string;
}

export interface AccommodationListResponse {
  id: number;
  name: string;
  address: string;
  pricePerNight: number;
  rating?: number;
  reviewCount?: number;
  mainImageUrl?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

// 관리자용 숙소 생성/수정 요청 타입
export interface AccommodationRequest {
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  pricePerNight: number;
}

// 관리자용 숙소 상세 응답 타입
export interface AccommodationResponse {
  id: number;
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  pricePerNight: number;
  rating?: number;
  reviewCount?: number;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  mainImageUrl?: string;
  images: AccommodationImage[];
  amenities: Amenity[];
  rooms: any[];
}

export interface AccommodationImage {
  id: number;
  accommodationId: number;
  imageUrl: string;
  isMain: boolean;
}

// 이미지 업로드 응답 타입
export interface AccommodationImageResponse {
  id: number;
  accommodationId: number;
  imageUrl: string;
  isMain: boolean;
}

// 이미지 목록 응답 타입
export interface AccommodationImageListResponse {
  images: AccommodationImageResponse[];
}

export interface Amenity {
  id: number;
  name: string;
  iconUrl?: string;
}

// 편의시설 관련 요청/응답 타입
export interface AmenityRequest {
  name: string;
  iconUrl?: string;
}

export interface AmenityResponse {
  id: number;
  name: string;
  iconUrl?: string;
}

export interface AmenityConnectionRequest {
  amenityIds: number[];
}

export interface AmenityListResponse {
  amenities: AmenityResponse[];
}

export interface AccommodationDetailResponse {
  id: number;
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  pricePerNight: number;
  rating?: number;
  reviewCount?: number;
  status?: string;
  images: AccommodationImage[];
  amenities: Amenity[];
  rooms: any[]; // 나중에 Room 타입 정의 시 변경
}

// 포털용 숙소 검색 요청 타입
export interface AccommodationSearchRequest {
  condition?: AccommodationSearchCondition;
  pageRequest?: PageRequestDto;
}

export interface AccommodationSearchCondition {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PageRequestDto {
  page?: number;
  size?: number;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

// 페이지 응답 타입
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
