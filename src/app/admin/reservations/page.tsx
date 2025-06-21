"use client";

import { useState, useEffect } from "react";
import { reservationApi } from "@/lib/api";
import {
  ReservationListResponse,
  ReservationStatus,
  PaymentStatus,
  ReservationSearchCondition,
  PageResponse,
} from "@/types/reservation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminReservationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [reservations, setReservations] = useState<ReservationListResponse[]>(
    []
  );
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "ALL">(
    "ALL"
  );
  const [dateFilter, setDateFilter] = useState({
    checkInFrom: "",
    checkInTo: "",
  });

  // 상태별 색상 매핑
  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case ReservationStatus.CONFIRMED:
        return "bg-green-100 text-green-800";
      case ReservationStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      case ReservationStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case ReservationStatus.COMPLETED:
        return "bg-blue-100 text-blue-800";
      case ReservationStatus.NO_SHOW:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 상태별 한글 표시
  const getStatusText = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.PENDING:
        return "결제 대기";
      case ReservationStatus.CONFIRMED:
        return "예약 확정";
      case ReservationStatus.CANCELLED:
        return "예약 취소";
      case ReservationStatus.REJECTED:
        return "숙소 거절";
      case ReservationStatus.COMPLETED:
        return "숙박 완료";
      case ReservationStatus.NO_SHOW:
        return "노쇼";
      default:
        return status;
    }
  };

  // 결제 상태별 색상 매핑
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case PaymentStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case PaymentStatus.FAILED:
        return "bg-red-100 text-red-800";
      case PaymentStatus.CANCELLED:
        return "bg-gray-100 text-gray-800";
      case PaymentStatus.REFUNDED:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 결제 상태별 한글 표시
  const getPaymentStatusText = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return "결제 대기";
      case PaymentStatus.COMPLETED:
        return "결제 완료";
      case PaymentStatus.FAILED:
        return "결제 실패";
      case PaymentStatus.CANCELLED:
        return "결제 취소";
      case PaymentStatus.REFUNDED:
        return "환불 완료";
      default:
        return status;
    }
  };

  // 권한 확인
  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, loading, router]);

  // 예약 목록 로드
  const loadReservations = async (page = 0) => {
    try {
      setPageLoading(true);

      const condition: ReservationSearchCondition = {
        ...(statusFilter !== "ALL" && {
          statuses: [statusFilter as ReservationStatus],
        }),
        ...(dateFilter.checkInFrom && {
          checkInDateFrom: dateFilter.checkInFrom,
        }),
        ...(dateFilter.checkInTo && { checkInDateTo: dateFilter.checkInTo }),
      };

      const response = await reservationApi.searchReservations(
        condition,
        page,
        20
      );

      setReservations(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("예약 목록 로드 실패:", error);
      setError("예약 목록을 불러오는데 실패했습니다.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadReservations();
    }
  }, [user, statusFilter, dateFilter]);

  // 예약 확정
  const handleConfirmReservation = async (reservationId: number) => {
    if (!confirm("이 예약을 확정하시겠습니까?")) {
      return;
    }

    try {
      await reservationApi.confirmReservation(reservationId);
      await loadReservations(currentPage);
    } catch (error: any) {
      console.error("예약 확정 실패:", error);
      setError(error.message || "예약 확정에 실패했습니다.");
    }
  };

  // 예약 거절
  const handleRejectReservation = async (reservationId: number) => {
    const reason = prompt("거절 사유를 입력해주세요:");
    if (!reason) return;

    try {
      await reservationApi.updateReservationStatus(reservationId, {
        status: ReservationStatus.REJECTED,
        reason,
      });
      await loadReservations(currentPage);
    } catch (error: any) {
      console.error("예약 거절 실패:", error);
      setError(error.message || "예약 거절에 실패했습니다.");
    }
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">예약 관리</h1>
          <p className="text-gray-600">
            모든 예약을 조회하고 관리할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            검색 및 필터
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예약 상태
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ReservationStatus | "ALL")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">전체</option>
                <option value={ReservationStatus.PENDING}>결제 대기</option>
                <option value={ReservationStatus.CONFIRMED}>예약 확정</option>
                <option value={ReservationStatus.CANCELLED}>예약 취소</option>
                <option value={ReservationStatus.REJECTED}>숙소 거절</option>
                <option value={ReservationStatus.COMPLETED}>숙박 완료</option>
                <option value={ReservationStatus.NO_SHOW}>노쇼</option>
              </select>
            </div>

            {/* 체크인 날짜 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                체크인 시작일
              </label>
              <input
                type="date"
                value={dateFilter.checkInFrom}
                onChange={(e) =>
                  setDateFilter((prev) => ({
                    ...prev,
                    checkInFrom: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                체크인 종료일
              </label>
              <input
                type="date"
                value={dateFilter.checkInTo}
                onChange={(e) =>
                  setDateFilter((prev) => ({
                    ...prev,
                    checkInTo: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 검색 버튼 */}
            <div className="flex items-end">
              <button
                onClick={() => loadReservations(0)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
            </div>
          </div>
        </div>

        {/* 예약 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예약 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    숙소/객실
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    체크인/체크아웃
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">로딩 중...</p>
                    </td>
                  </tr>
                ) : reservations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      조건에 맞는 예약이 없습니다.
                    </td>
                  </tr>
                ) : (
                  reservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            예약 #{reservation.id}
                          </div>
                          <div className="text-gray-500">
                            {formatDate(reservation.createdAt)} 예약
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {reservation.accommodationName}
                          </div>
                          <div className="text-gray-500">
                            {reservation.roomName}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {formatDate(reservation.checkInDate)}
                          </div>
                          <div className="text-gray-500">
                            ~ {formatDate(reservation.checkOutDate)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {reservation.nights}박
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₩{formatPrice(reservation.totalPrice)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              reservation.status
                            )}`}
                          >
                            {getStatusText(reservation.status)}
                          </span>
                          <br />
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                              reservation.paymentStatus
                            )}`}
                          >
                            {getPaymentStatusText(reservation.paymentStatus)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {reservation.status === ReservationStatus.PENDING && (
                            <>
                              <button
                                onClick={() =>
                                  handleConfirmReservation(reservation.id)
                                }
                                className="text-green-600 hover:text-green-900 text-sm"
                              >
                                확정
                              </button>
                              <button
                                onClick={() =>
                                  handleRejectReservation(reservation.id)
                                }
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                거절
                              </button>
                            </>
                          )}
                          <button className="text-blue-600 hover:text-blue-900 text-sm">
                            상세
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => loadReservations(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  onClick={() => loadReservations(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    총{" "}
                    <span className="font-medium">{reservations.length}</span>개
                    결과
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => loadReservations(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
