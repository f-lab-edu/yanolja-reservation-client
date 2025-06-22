"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();

  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  const getErrorMessage = (code: string | null) => {
    switch (code) {
      case "PAY_PROCESS_CANCELED":
        return "사용자가 결제를 취소했습니다.";
      case "PAY_PROCESS_ABORTED":
        return "결제 진행 중 오류가 발생했습니다.";
      case "REJECT_CARD_COMPANY":
        return "카드사에서 거절했습니다.";
      case "INSUFFICIENT_FUNDS":
        return "잔액이 부족합니다.";
      case "INVALID_CARD_INFO":
        return "카드 정보가 올바르지 않습니다.";
      default:
        return errorMessage || "결제 처리 중 오류가 발생했습니다.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            결제에 실패했습니다
          </h2>

          <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-900 mb-2">오류 정보</h3>
            <div className="space-y-1 text-sm text-red-700">
              {orderId && (
                <div className="flex justify-between">
                  <span>주문번호:</span>
                  <span className="font-medium">{orderId}</span>
                </div>
              )}
              {errorCode && (
                <div className="flex justify-between">
                  <span>오류코드:</span>
                  <span className="font-medium">{errorCode}</span>
                </div>
              )}
              <div className="mt-2">
                <span className="font-medium">
                  {getErrorMessage(errorCode)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            다시 시도하시거나 다른 결제 수단을 이용해주세요.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              다시 시도
            </button>
            <Link
              href="/my-reservations"
              className="block w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              예약 내역 확인
            </Link>
            <Link
              href="/accommodations"
              className="block w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium"
            >
              숙소 둘러보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
