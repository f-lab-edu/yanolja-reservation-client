export interface ReviewImageResponse {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  createdAt: string;
}

export interface ReviewCreateRequest {
  accommodationId: number;
  reservationId: number;
  rating: number;
  comment?: string;
  imageUrls?: string[];
}

export interface ReviewUpdateRequest {
  rating: number;
  comment?: string;
  imageUrls?: string[];
}

export interface ReviewResponse {
  id: number;
  userId: number;
  accommodationId: number;
  reservationId: number;
  rating: number;
  comment?: string;
  imageUrls: string[];
  images?: ReviewImageResponse[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ReviewListResponse {
  id: number;
  userId: number;
  rating: number;
  comment?: string;
  imageCount: number;
  images?: ReviewImageResponse[];
  createdAt: string;
  createdBy: string;
}

export interface ReviewSearchRequest {
  accommodationId?: number;
  userId?: number;
  minRating?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface ReviewStatisticsResponse {
  totalReviews: number;
  averageRating: number;
  ratingCounts: number[]; // [1점 개수, 2점 개수, 3점 개수, 4점 개수, 5점 개수]
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
