import { loadTossPayments } from "@tosspayments/payment-sdk";

// 토스 페이먼츠 클라이언트 키 (환경변수 또는 하드코딩)
const TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ||
  "test_ck_yL0qZ4G1VOjGPOWB9E5O3oWb2MQY";

// 토스 페이먼츠 인스턴스
let tossPayments: any = null;

/**
 * 토스 페이먼츠 SDK 초기화
 */
export const initTossPayments = async () => {
  if (!tossPayments) {
    tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
  }
  return tossPayments;
};

/**
 * 결제 요청 인터페이스
 */
export interface TossPaymentRequest {
  orderId: string; // 주문 ID
  amount: number; // 결제 금액
  orderName: string; // 주문명
  customerName?: string; // 구매자명
  customerEmail?: string; // 구매자 이메일
  customerMobilePhone?: string; // 구매자 전화번호
  successUrl: string; // 성공 시 리다이렉트 URL
  failUrl: string; // 실패 시 리다이렉트 URL
}

/**
 * 카드 결제 요청
 */
export const requestCardPayment = async (paymentData: TossPaymentRequest) => {
  const toss = await initTossPayments();

  return toss.requestPayment("카드", {
    orderId: paymentData.orderId,
    amount: paymentData.amount,
    orderName: paymentData.orderName,
    customerName: paymentData.customerName,
    customerEmail: paymentData.customerEmail,
    customerMobilePhone: paymentData.customerMobilePhone,
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
  });
};

/**
 * 계좌이체 결제 요청
 */
export const requestTransferPayment = async (
  paymentData: TossPaymentRequest
) => {
  const toss = await initTossPayments();

  return toss.requestPayment("계좌이체", {
    orderId: paymentData.orderId,
    amount: paymentData.amount,
    orderName: paymentData.orderName,
    customerName: paymentData.customerName,
    customerEmail: paymentData.customerEmail,
    customerMobilePhone: paymentData.customerMobilePhone,
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
  });
};

/**
 * 가상계좌 결제 요청
 */
export const requestVirtualAccountPayment = async (
  paymentData: TossPaymentRequest
) => {
  const toss = await initTossPayments();

  return toss.requestPayment("가상계좌", {
    orderId: paymentData.orderId,
    amount: paymentData.amount,
    orderName: paymentData.orderName,
    customerName: paymentData.customerName,
    customerEmail: paymentData.customerEmail,
    customerMobilePhone: paymentData.customerMobilePhone,
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
  });
};

/**
 * 토스페이 결제 요청
 */
export const requestTossPayment = async (paymentData: TossPaymentRequest) => {
  const toss = await initTossPayments();

  return toss.requestPayment("토스페이", {
    orderId: paymentData.orderId,
    amount: paymentData.amount,
    orderName: paymentData.orderName,
    customerName: paymentData.customerName,
    customerEmail: paymentData.customerEmail,
    customerMobilePhone: paymentData.customerMobilePhone,
    successUrl: paymentData.successUrl,
    failUrl: paymentData.failUrl,
  });
};

/**
 * 결제 수단별 요청 함수 매핑
 */
export const paymentMethodMap = {
  CARD: requestCardPayment,
  BANK_TRANSFER: requestTransferPayment,
  VIRTUAL_ACCOUNT: requestVirtualAccountPayment,
  TOSS: requestTossPayment,
};

/**
 * 결제 수단에 따른 토스 결제 요청
 */
export const requestTossPaymentByMethod = async (
  method: keyof typeof paymentMethodMap,
  paymentData: TossPaymentRequest
) => {
  const paymentFunction = paymentMethodMap[method];

  if (!paymentFunction) {
    throw new Error(`지원하지 않는 결제 수단입니다: ${method}`);
  }

  return paymentFunction(paymentData);
};
