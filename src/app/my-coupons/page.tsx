"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { couponApi } from "@/lib/api";
import {
  UserCouponResponse,
  UserCouponStatus,
  DiscountType,
} from "@/types/payment";

export default function MyCouponsPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<UserCouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState<UserCouponStatus | "ALL">(
    "ALL"
  );
  const [showCouponCodeModal, setShowCouponCodeModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [issuingCoupon, setIssuingCoupon] = useState(false);

  useEffect(() => {
    if (user) {
      loadCoupons();
    }
  }, [user, currentPage, filterStatus]);

  const loadCoupons = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await couponApi.getUserCoupons(user.id, currentPage, 20);

      // 필터링 적용
      let filteredCoupons = response.content;
      if (filterStatus !== "ALL") {
        filteredCoupons = response.content.filter(
          (coupon) => coupon.status === filterStatus
        );
      }

      setCoupons(filteredCoupons);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "쿠폰 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCouponCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !couponCode.trim()) return;

    try {
      setIssuingCoupon(true);
      await couponApi.issueCoupon(couponCode.trim(), user.id);
      alert("쿠폰이 성공적으로 등록되었습니다!");
      setShowCouponCodeModal(false);
      setCouponCode("");
      loadCoupons(); // 쿠폰 목록 새로고침
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "쿠폰 등록에 실패했습니다. 쿠폰 코드를 확인해주세요."
      );
    } finally {
      setIssuingCoupon(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const getDiscountDisplay = (coupon: UserCouponResponse) => {
    if (coupon.coupon.discountType === DiscountType.FIXED) {
      return formatCurrency(coupon.coupon.discountValue);
    } else {
      return `${coupon.coupon.discountValue}%`;
    }
  };

  const getStatusBadge = (status: UserCouponStatus) => {
    const statusConfig = {
      [UserCouponStatus.AVAILABLE]: {
        label: "사용 가능",
        color: "bg-green-100 text-green-800",
      },
      [UserCouponStatus.USED]: {
        label: "사용 완료",
        color: "bg-gray-100 text-gray-800",
      },
      [UserCouponStatus.EXPIRED]: {
        label: "만료",
        color: "bg-red-100 text-red-800",
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

  const isExpiringSoon = (validUntil: string) => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (validUntil: string) => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    return expiryDate < today;
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
          <p className="mt-4 text-gray-600">쿠폰 목록을 불러오는 중...</p>
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
            onClick={loadCoupons}
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">내 쿠폰</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCouponCodeModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  쿠폰 등록
                </button>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as UserCouponStatus | "ALL")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">전체</option>
                  <option value={UserCouponStatus.AVAILABLE}>사용 가능</option>
                  <option value={UserCouponStatus.USED}>사용 완료</option>
                  <option value={UserCouponStatus.EXPIRED}>만료</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {coupons.length === 0 ? (
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
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  쿠폰이 없습니다
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterStatus === "ALL"
                    ? "보유한 쿠폰이 없습니다."
                    : `${
                        filterStatus === UserCouponStatus.AVAILABLE
                          ? "사용 가능한"
                          : filterStatus === UserCouponStatus.USED
                          ? "사용 완료된"
                          : "만료된"
                      } 쿠폰이 없습니다.`}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {coupons.map((userCoupon) => (
                  <div
                    key={userCoupon.id}
                    className={`border rounded-lg p-6 transition-all hover:shadow-md ${
                      userCoupon.status === UserCouponStatus.AVAILABLE
                        ? isExpired(userCoupon.coupon.validUntil)
                          ? "border-red-200 bg-red-50"
                          : isExpiringSoon(userCoupon.coupon.validUntil)
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-green-200 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {userCoupon.coupon.name}
                          </h3>
                          {getStatusBadge(userCoupon.status)}
                        </div>

                        <p className="text-gray-600 mb-3">
                          {userCoupon.coupon.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              할인:
                            </span>
                            <span className="ml-2 text-blue-600 font-semibold">
                              {getDiscountDisplay(userCoupon)}
                            </span>
                            {userCoupon.coupon.maxDiscountAmount && (
                              <span className="ml-1 text-gray-500">
                                (최대{" "}
                                {formatCurrency(
                                  userCoupon.coupon.maxDiscountAmount
                                )}
                                )
                              </span>
                            )}
                          </div>

                          {userCoupon.coupon.minOrderAmount && (
                            <div>
                              <span className="font-medium text-gray-700">
                                최소 주문:
                              </span>
                              <span className="ml-2">
                                {formatCurrency(
                                  userCoupon.coupon.minOrderAmount
                                )}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="font-medium text-gray-700">
                              쿠폰 코드:
                            </span>
                            <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              {userCoupon.coupon.code}
                            </span>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">
                              유효 기간:
                            </span>
                            <span className="ml-2">
                              {new Date(
                                userCoupon.coupon.validFrom
                              ).toLocaleDateString("ko-KR")}{" "}
                              ~{" "}
                              {new Date(
                                userCoupon.coupon.validUntil
                              ).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                        </div>

                        {userCoupon.status === UserCouponStatus.AVAILABLE &&
                          isExpiringSoon(userCoupon.coupon.validUntil) && (
                            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                              <p className="text-sm text-yellow-800">
                                ⚠️ 이 쿠폰은 곧 만료됩니다! 빨리 사용하세요.
                              </p>
                            </div>
                          )}

                        {userCoupon.status === UserCouponStatus.USED &&
                          userCoupon.usedAt && (
                            <div className="mt-3 text-sm text-gray-500">
                              사용일:{" "}
                              {new Date(userCoupon.usedAt).toLocaleDateString(
                                "ko-KR"
                              )}
                            </div>
                          )}
                      </div>

                      <div className="ml-6 flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* 쿠폰 코드 입력 모달 */}
        {showCouponCodeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  쿠폰 코드 등록
                </h2>
              </div>

              <form onSubmit={handleCouponCodeSubmit} className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    쿠폰 코드
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="쿠폰 코드를 입력하세요 (예: WELCOME2024)"
                    disabled={issuingCoupon}
                  />
                </div>

                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          유효한 쿠폰 코드를 입력하면 자동으로 등록됩니다.
                          잘못된 코드이거나 이미 사용된 코드는 등록할 수
                          없습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCouponCodeModal(false);
                      setCouponCode("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    disabled={issuingCoupon}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={issuingCoupon || !couponCode.trim()}
                  >
                    {issuingCoupon ? "등록 중..." : "등록"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
