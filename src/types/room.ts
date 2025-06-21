export interface RoomOption {
  id: number;
  name: string;
  price: number;
}

export interface RoomImage {
  id: number;
  roomId: number;
  imageUrl: string;
  isMain: boolean;
}

export interface Room {
  id: number;
  accommodationId: number;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  mainImageUrl?: string;
  optionCount?: number;
  images?: RoomImage[];
  options?: RoomOption[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomListItem {
  id: number;
  accommodationId: number;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  mainImageUrl?: string;
  optionCount: number;
}

export interface RoomRequest {
  accommodationId: number;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  imageUrls?: string[];
  optionIds?: number[];
}

export interface RoomResponse {
  id: number;
  accommodationId: number;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  images: RoomImage[];
  options: RoomOption[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomOptionRequest {
  name: string;
  price: number;
}

export interface RoomOptionResponse {
  id: number;
  name: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSearchCondition {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
}

export interface RoomSearchRequest {
  condition: RoomSearchCondition;
  pageRequest: {
    page: number;
    size: number;
    sort?: string;
  };
}

export interface PortalRoom {
  id: number;
  accommodationId: number;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  mainImageUrl?: string;
  imageUrls?: string[];
  options?: RoomOption[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomListResponse {
  content: RoomListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
