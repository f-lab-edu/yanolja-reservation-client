"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";

interface PaymentApprovalData {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export default function PaymentSuccessPage() {
  const [isApproving, setIsApproving] = useState(true);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const approvePayment = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (!paymentKey || !orderId || !amount) {
        setError("결제 정보가 올바르지 않습니다.");
        setIsApproving(false);
        return;
      }

      try {
        console.log("결제 승인 요청:", { paymentKey, orderId, amount });

        // 토스 페이먼츠 결제 승인 요청
        const response = await apiClient.post("/api/toss-payments/approve", {
          paymentKey,
          orderId,
          amount: parseInt(amount),
        });

        console.log("결제 승인 응답:", response);

        setOrderInfo(response);
        setApprovalSuccess(true);
      } catch (error: any) {
        console.error("결제 승인 실패:", error);
        setError(error.message || "결제 승인에 실패했습니다.");
      } finally {
        setIsApproving(false);
      }
    };

    approvePayment();
  }, [searchParams]);

  if (isApproving) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            결제 승인 중...
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              결제 승인 실패
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                href="/my-reservations"
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                예약 내역 확인
              </Link>
              <Link
                href="/accommodations"
                className="block w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                숙소 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            결제가 완료되었습니다!
          </h2>

          {orderInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">결제 정보</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>주문번호:</span>
                  <span className="font-medium">
                    {orderInfo.orderNumber || searchParams.get("orderId")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>결제금액:</span>
                  <span className="font-medium">
                    ₩
                    {parseInt(
                      searchParams.get("amount") || "0"
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>결제수단:</span>
                  <span className="font-medium">토스페이먼츠</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-600 mb-6">
            예약이 확정되었습니다. 예약 내역에서 자세한 정보를 확인하실 수
            있습니다.
          </p>

          <div className="space-y-3">
            <Link
              href="/my-reservations"
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              예약 내역 확인
            </Link>
            <Link
              href="/accommodations"
              className="block w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              숙소 더 둘러보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
