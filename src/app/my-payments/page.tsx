"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { paymentApi } from "@/lib/api";
import {
  PaymentListResponse,
  PaymentStatus,
  PaymentMethod,
} from "@/types/payment";

export default function MyPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "ALL">(
    "ALL"
  );

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user, currentPage, filterStatus]);

  const loadPayments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await paymentApi.getUserPayments(
        user.id,
        currentPage,
        20
      );

      // 필터링 적용
      let filteredPayments = response.content;
      if (filterStatus !== "ALL") {
        filteredPayments = response.content.filter(
          (payment) => payment.status === filterStatus
        );
      }

      setPayments(filteredPayments);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "결제 내역을 불러오는데 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      [PaymentStatus.PENDING]: {
        label: "결제 대기",
        color: "bg-yellow-100 text-yellow-800",
      },
      [PaymentStatus.SUCCESS]: {
        label: "결제 완료",
        color: "bg-green-100 text-green-800",
      },
      [PaymentStatus.FAILED]: {
        label: "결제 실패",
        color: "bg-red-100 text-red-800",
      },
      [PaymentStatus.CANCELLED]: {
        label: "결제 취소",
        color: "bg-gray-100 text-gray-800",
      },
      [PaymentStatus.REFUNDED]: {
        label: "환불 완료",
        color: "bg-blue-100 text-blue-800",
      },
      [PaymentStatus.PARTIAL_REFUNDED]: {
        label: "부분 환불",
        color: "bg-purple-100 text-purple-800",
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels = {
      [PaymentMethod.CARD]: "신용카드",
      [PaymentMethod.BANK_TRANSFER]: "계좌이체",
      [PaymentMethod.VIRTUAL_ACCOUNT]: "무통장입금",
      [PaymentMethod.PAYCO]: "페이코",
      [PaymentMethod.TOSS]: "토스",
      [PaymentMethod.POINT]: "포인트",
    };
    return labels[method] || method;
  };

  const handleRefund = async (paymentKey: string, amount: number) => {
    if (!confirm("정말로 환불을 요청하시겠습니까?")) {
      return;
    }

    try {
      await paymentApi.refundPayment(paymentKey, amount, "사용자 요청");
      alert("환불이 요청되었습니다.");
      loadPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "환불 요청에 실패했습니다.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <a
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">결제 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPayments}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">결제 내역</h1>
              <div className="flex items-center space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as PaymentStatus | "ALL")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">전체</option>
                  <option value={PaymentStatus.SUCCESS}>결제 완료</option>
                  <option value={PaymentStatus.PENDING}>결제 대기</option>
                  <option value={PaymentStatus.FAILED}>결제 실패</option>
                  <option value={PaymentStatus.CANCELLED}>결제 취소</option>
                  <option value={PaymentStatus.REFUNDED}>환불 완료</option>
                  <option value={PaymentStatus.PARTIAL_REFUNDED}>
                    부분 환불
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  결제 내역이 없습니다
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterStatus === "ALL"
                    ? "결제 내역이 없습니다."
                    : `${filterStatus} 상태의 결제 내역이 없습니다.`}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      결제 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      결제 수단
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      결제일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            주문번호: {payment.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            결제키: {payment.paymentKey}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        {payment.refundedAmount > 0 && (
                          <div className="text-sm text-red-600">
                            환불: {formatCurrency(payment.refundedAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString(
                                "ko-KR"
                              )
                            : new Date(payment.createdAt).toLocaleDateString(
                                "ko-KR"
                              )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleTimeString(
                                "ko-KR"
                              )
                            : new Date(payment.createdAt).toLocaleTimeString(
                                "ko-KR"
                              )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {payment.status === PaymentStatus.SUCCESS && (
                            <button
                              onClick={() =>
                                handleRefund(
                                  payment.paymentKey,
                                  payment.amount - payment.refundedAmount
                                )
                              }
                              className="text-red-600 hover:text-red-900"
                              disabled={
                                payment.amount <= payment.refundedAmount
                              }
                            >
                              환불 요청
                            </button>
                          )}
                          {payment.status === PaymentStatus.FAILED && (
                            <span className="text-gray-500">재결제 필요</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    이전
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      Math.max(0, Math.min(totalPages - 5, currentPage - 2)) +
                      i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    다음
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
