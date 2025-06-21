export interface PaymentRequest {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  amount: number;
  pgProvider?: string;
  cardInfo?: CardInfo;
}

export interface PaymentApproveRequest {
  paymentKey: string;
  pgTransactionId?: string;
  approvalNumber?: string;
  receiptUrl?: string;
}

export interface PaymentResponse {
  id: number;
  paymentKey: string;
  orderId: number;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  pgProvider?: string;
  pgTransactionId?: string;
  approvalNumber?: string;
  cardNumber?: string;
  cardType?: string;
  installmentMonths?: number;
  paidAt?: string;
  receiptUrl?: string;
  failureReason?: string;
  createdAt: string;
}

export interface PaymentListResponse {
  id: number;
  paymentKey: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  refundedAmount: number;
  createdAt: string;
}

export interface CardInfo {
  cardNumber: string;
  cardType: string;
  installmentMonths: number;
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  VIRTUAL_ACCOUNT = "VIRTUAL_ACCOUNT",
  TOSS_PAY = "TOSS_PAY",
  KAKAO_PAY = "KAKAO_PAY",
  POINTS = "POINTS",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  PARTIAL_REFUNDED = "PARTIAL_REFUNDED",
}

export interface CouponRequest {
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  issueCount: number;
  issueStartAt: string;
  issueEndAt: string;
  validFrom: string;
  validUntil: string;
  issueType: CouponIssueType;
}

export interface CouponResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  issueCount?: number;
  issuedCount: number;
  issueStartAt: string;
  issueEndAt: string;
  validFrom: string;
  validUntil: string;
  issueType: CouponIssueType;
  status: CouponStatus;
  createdAt: string;
}

export interface UserCouponResponse {
  id: number;
  userId: number;
  coupon: CouponResponse;
  status: UserCouponStatus;
  usedAt?: string;
  orderId?: number;
  createdAt: string;
}

export interface CouponDiscountRequest {
  couponId: number;
  orderAmount: number;
}

export interface CouponDiscountResponse {
  discountAmount: number;
  isMaxDiscountApplied: boolean;
  discountRate: number;
}

export enum DiscountType {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE",
}

export enum CouponStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  EXPIRED = "EXPIRED",
}

export enum CouponIssueType {
  SIGNUP = "SIGNUP",
  EVENT = "EVENT",
  REVIEW = "REVIEW",
  BIRTHDAY = "BIRTHDAY",
  MANUAL = "MANUAL",
}

export enum UserCouponStatus {
  AVAILABLE = "AVAILABLE",
  USED = "USED",
  EXPIRED = "EXPIRED",
}

export interface OrderRequest {
  userId: number;
  reservationId: number;
  originalAmount: number;
  couponIds?: number[];
  pointsUsed?: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  userId: number;
  reservationId: number;
  originalAmount: number;
  discountAmount: number;
  pointsUsed: number;
  finalAmount: number;
  status: OrderStatus;
  usedCoupons?: OrderCouponResponse[];
  createdAt: string;
}

export interface OrderCouponResponse {
  id: number;
  userCouponId: number;
  discountAmount: number;
  createdAt: string;
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export interface PointResponse {
  id: number;
  userId: number;
  amount: number;
  type: PointType;
  description: string;
  orderId?: number;
  expiresAt?: string;
  createdAt: string;
}

export enum PointType {
  EARN = "EARN",
  USE = "USE",
  EXPIRE = "EXPIRE",
  REFUND = "REFUND",
}

export interface UserPointSummary {
  totalPoints: number;
  usablePoints: number;
  expiringSoonPoints: number;
}
