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

export interface Amenity {
  id: number;
  name: string;
  iconUrl?: string;
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
