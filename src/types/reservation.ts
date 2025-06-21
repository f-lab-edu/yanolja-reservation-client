export interface ReservationRequest {
  roomId: number;
  checkInDate: string; // LocalDate -> string (YYYY-MM-DD)
  checkOutDate: string; // LocalDate -> string (YYYY-MM-DD)
  totalPrice: number;
  options?: ReservationOptionRequest[];
}

export interface ReservationOptionRequest {
  optionId: number;
  quantity: number;
  price: number;
}

export interface ReservationResponse {
  id: number;
  userId: number;
  roomId: number;
  roomName?: string;
  accommodationName?: string;
  accommodationAddress?: string;
  accommodationImage?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalPrice: number;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  canCancel: boolean;
  canModify: boolean;
  options?: ReservationOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ReservationListResponse {
  id: number;
  roomId: number;
  roomName: string;
  accommodationName: string;
  accommodationImage?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalPrice: number;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  canCancel: boolean;
  canModify: boolean;
  createdAt: string;
}

export interface ReservationOption {
  id: number;
  optionId: number;
  optionName: string;
  quantity: number;
  price: number;
}

export enum ReservationStatus {
  PENDING = "PENDING", // 결제 대기
  CONFIRMED = "CONFIRMED", // 예약 확정
  CANCELLED = "CANCELLED", // 예약 취소
  REJECTED = "REJECTED", // 숙소 거절
  COMPLETED = "COMPLETED", // 숙박 완료
  NO_SHOW = "NO_SHOW", // 노쇼
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export interface ReservationStatusUpdateRequest {
  status: ReservationStatus;
  reason?: string;
}

export interface ReservationSearchCondition {
  userId?: number;
  statuses?: ReservationStatus[];
  checkInDateFrom?: string;
  checkInDateTo?: string;
  checkOutDateFrom?: string;
  checkOutDateTo?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  empty: boolean;
}
