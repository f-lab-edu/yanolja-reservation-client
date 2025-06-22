"use client";

import { useState, useEffect } from "react";
import { reservationApi, getImageUrl } from "@/lib/api";
import {
  ReservationListResponse,
  ReservationStatus,
  PaymentStatus,
  PageResponse,
} from "@/types/reservation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyReservationsPage() {
  const { user, loading, isAuthenticated } = useAuth();
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
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

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

  // 로그인 확인
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // 예약 목록 로드
  const loadReservations = async (page = 0) => {
    try {
      setPageLoading(true);

      let response;
      if (statusFilter === "ALL") {
        response = await reservationApi.getUserReservations(
          undefined,
          page,
          10
        );
      } else {
        response = await reservationApi.getUserReservations(
          statusFilter,
          page,
          10
        );
      }

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
    if (isAuthenticated) {
      loadReservations();
    }
  }, [isAuthenticated, statusFilter]);

  // 예약 취소
  const handleCancelReservation = async (reservationId: number) => {
    if (
      !confirm(
        "정말로 이 예약을 취소하시겠습니까?\n취소 정책에 따라 환불 금액이 달라질 수 있습니다."
      )
    ) {
      return;
    }

    try {
      setIsProcessing(reservationId);
      await reservationApi.cancelReservation(reservationId);
      await loadReservations(currentPage);
      alert("예약이 취소되었습니다.");
    } catch (error: any) {
      console.error("예약 취소 실패:", error);
      setError(error.message || "예약 취소에 실패했습니다.");
    } finally {
      setIsProcessing(null);
    }
  };

  // 취소 가능 여부 확인
  const canCancel = (reservation: ReservationListResponse) => {
    if (!reservation.canCancel) return false;

    // 결제가 완료된 예약은 취소 불가 (결제 취소를 해야 함)
    if (reservation.paymentStatus === "COMPLETED") {
      return false;
    }

    // 체크인 3일 전까지만 취소 가능
    const checkInDate = new Date(reservation.checkInDate);
    const now = new Date();
    const diffTime = checkInDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
      diffDays >= 0 &&
      (reservation.status === ReservationStatus.PENDING ||
        reservation.status === ReservationStatus.CONFIRMED)
    );
  };

  // 환불 정책 계산
  const getRefundInfo = (reservation: ReservationListResponse) => {
    const checkInDate = new Date(reservation.checkInDate);
    const now = new Date();
    const diffTime = checkInDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 3) {
      return { rate: 100, text: "100% 환불" };
    } else if (diffDays >= 1) {
      return { rate: 50, text: "50% 환불" };
    } else {
      return { rate: 0, text: "환불 불가" };
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 예약</h1>
          <p className="text-gray-600">
            예약 현황을 확인하고 관리할 수 있습니다.
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">
              예약 목록
            </h2>

            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                상태 필터:
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ReservationStatus | "ALL")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>
        </div>

        {/* 예약 목록 */}
        {pageLoading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              예약 내역이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              아직 예약한 숙소가 없습니다. 지금 바로 예약해보세요!
            </p>
            <Link
              href="/accommodations"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              숙소 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* 숙소 이미지 */}
                    <div className="lg:w-64 flex-shrink-0">
                      {reservation.accommodationImage ? (
                        <img
                          src={getImageUrl(reservation.accommodationImage)}
                          alt={reservation.accommodationName}
                          className="w-full h-48 lg:h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 lg:h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m0 0h2M9 7h6m-6 4h6m-6 4h6m-6 4h6"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 예약 정보 */}
                    <div className="flex-grow">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {reservation.accommodationName}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {reservation.roomName}
                          </p>
                          <div className="text-sm text-gray-500">
                            예약번호: #{reservation.id}
                          </div>
                        </div>

                        <div className="flex flex-col items-start sm:items-end space-y-2">
                          <span
                            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                              reservation.status
                            )}`}
                          >
                            {getStatusText(reservation.status)}
                          </span>
                          <span
                            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(
                              reservation.paymentStatus
                            )}`}
                          >
                            {getPaymentStatusText(reservation.paymentStatus)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500">체크인</div>
                          <div className="font-medium">
                            {formatDate(reservation.checkInDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">체크아웃</div>
                          <div className="font-medium">
                            {formatDate(reservation.checkOutDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">숙박 기간</div>
                          <div className="font-medium">
                            {reservation.nights}박
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                          ₩{formatPrice(reservation.totalPrice)}
                        </div>

                        <div className="flex space-x-3">
                          {canCancel(reservation) && (
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-1">
                                {getRefundInfo(reservation).text}
                              </div>
                              <button
                                onClick={() =>
                                  handleCancelReservation(reservation.id)
                                }
                                disabled={isProcessing === reservation.id}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                {isProcessing === reservation.id
                                  ? "취소 중..."
                                  : "예약 취소"}
                              </button>
                            </div>
                          )}

                          {!canCancel(reservation) &&
                            reservation.paymentStatus === "COMPLETED" &&
                            (reservation.status === ReservationStatus.PENDING ||
                              reservation.status ===
                                ReservationStatus.CONFIRMED) && (
                              <div className="text-right">
                                <div className="text-xs text-red-600 mb-1">
                                  결제 완료된 예약은 취소할 수 없습니다.
                                </div>
                                <div className="text-xs text-gray-500">
                                  결제 취소는 마이페이지 &gt; 결제내역에서
                                  가능합니다.
                                </div>
                              </div>
                            )}

                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            상세 보기
                          </button>

                          {reservation.status ===
                            ReservationStatus.COMPLETED && (
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                              리뷰 작성
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 취소/환불 정책 안내 */}
                {canCancel(reservation) && (
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="text-sm text-gray-600">
                      <strong>취소/환불 정책:</strong>
                      <span className="ml-2">
                        3일 전: 100% 환불 | 1-2일 전: 50% 환불 | 당일: 환불 불가
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => loadReservations(currentPage - 1)}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-l-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                이전
              </button>

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

              <button
                onClick={() => loadReservations(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                다음
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
