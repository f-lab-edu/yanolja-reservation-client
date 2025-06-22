"use client";

import React, { useState, useEffect } from "react";
import { couponApi } from "@/lib/api";
import {
  CouponResponse,
  CouponRequest,
  CouponStatus,
  CouponIssueType,
  DiscountType,
} from "@/types/payment";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponResponse | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formData, setFormData] = useState<CouponRequest>({
    code: "",
    name: "",
    description: "",
    discountType: DiscountType.FIXED,
    discountValue: 0,
    maxDiscountAmount: undefined,
    minOrderAmount: undefined,
    issueCount: 1,
    issueStartAt: "",
    issueEndAt: "",
    validFrom: "",
    validUntil: "",
    issueType: CouponIssueType.MANUAL,
  });

  useEffect(() => {
    loadCoupons();
  }, [currentPage]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponApi.getCoupons(currentPage, 20);
      setCoupons(response.content);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 발급 수량 유효성 검사
      if (!formData.issueCount || formData.issueCount < 1) {
        alert("발급 수량은 1개 이상이어야 합니다.");
        return;
      }

      // 날짜 형식을 LocalDateTime으로 변환 (T00:00:00 추가)
      const requestData = {
        ...formData,
        issueStartAt: formData.issueStartAt + "T00:00:00",
        issueEndAt: formData.issueEndAt + "T23:59:59",
        validFrom: formData.validFrom + "T00:00:00",
        validUntil: formData.validUntil + "T23:59:59",
      };

      const response = await couponApi.createCoupon(requestData);
      console.log("쿠폰 생성 성공:", response);
      setShowModal(false);
      resetForm();
      loadCoupons();
      alert("쿠폰이 성공적으로 생성되었습니다.");
    } catch (err) {
      console.error("쿠폰 생성 오류:", err);
      alert(err instanceof Error ? err.message : "쿠폰 생성에 실패했습니다.");
    }
  };

  const handleStatusChange = async (couponId: number, status: CouponStatus) => {
    try {
      await couponApi.updateCouponStatus(couponId, status);
      loadCoupons();
      alert("쿠폰 상태가 변경되었습니다.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "상태 변경에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      discountType: DiscountType.FIXED,
      discountValue: 0,
      maxDiscountAmount: undefined,
      minOrderAmount: undefined,
      issueCount: 1,
      issueStartAt: "",
      issueEndAt: "",
      validFrom: "",
      validUntil: "",
      issueType: CouponIssueType.MANUAL,
    });
    setEditingCoupon(null);
  };

  const openModal = (coupon?: CouponResponse) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minOrderAmount: coupon.minOrderAmount,
        issueCount: coupon.issueCount || 1,
        issueStartAt: coupon.issueStartAt.split("T")[0],
        issueEndAt: coupon.issueEndAt.split("T")[0],
        validFrom: coupon.validFrom.split("T")[0],
        validUntil: coupon.validUntil.split("T")[0],
        issueType: coupon.issueType,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const getDiscountDisplay = (coupon: CouponResponse) => {
    if (coupon.discountType === DiscountType.FIXED) {
      return formatCurrency(coupon.discountValue);
    } else {
      return `${coupon.discountValue}%`;
    }
  };

  const getStatusBadge = (status: CouponStatus) => {
    const statusConfig = {
      [CouponStatus.ACTIVE]: {
        label: "활성",
        color: "bg-green-100 text-green-800",
      },
      [CouponStatus.INACTIVE]: {
        label: "비활성",
        color: "bg-gray-100 text-gray-800",
      },
      [CouponStatus.EXPIRED]: {
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

  const getIssueTypeLabel = (type: CouponIssueType) => {
    const labels = {
      [CouponIssueType.SIGNUP]: "회원가입",
      [CouponIssueType.EVENT]: "이벤트",
      [CouponIssueType.REVIEW]: "리뷰",
      [CouponIssueType.BIRTHDAY]: "생일",
      [CouponIssueType.MANUAL]: "수동",
    };
    return labels[type];
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">쿠폰 관리</h1>
            <button
              onClick={() => openModal()}
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
              새 쿠폰 생성
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    쿠폰 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    할인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발급 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유효 기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {coupon.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          코드: {coupon.code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {coupon.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getDiscountDisplay(coupon)}
                      </div>
                      {coupon.maxDiscountAmount && (
                        <div className="text-sm text-gray-500">
                          최대 {formatCurrency(coupon.maxDiscountAmount)}
                        </div>
                      )}
                      {coupon.minOrderAmount && (
                        <div className="text-sm text-gray-500">
                          최소 {formatCurrency(coupon.minOrderAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getIssueTypeLabel(coupon.issueType)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {coupon.issuedCount}/{coupon.issueCount || "무제한"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(coupon.validFrom).toLocaleDateString("ko-KR")}
                      </div>
                      <div className="text-sm text-gray-500">
                        ~{" "}
                        {new Date(coupon.validUntil).toLocaleDateString(
                          "ko-KR"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(coupon.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <select
                          value={coupon.status}
                          onChange={(e) =>
                            handleStatusChange(
                              coupon.id,
                              e.target.value as CouponStatus
                            )
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value={CouponStatus.ACTIVE}>활성</option>
                          <option value={CouponStatus.INACTIVE}>비활성</option>
                          <option value={CouponStatus.EXPIRED}>만료</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* 쿠폰 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? "쿠폰 수정" : "새 쿠폰 생성"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    쿠폰 코드 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="WELCOME2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    쿠폰명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="신규 회원 환영 쿠폰"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  쿠폰 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="쿠폰에 대한 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    할인 타입 *
                  </label>
                  <select
                    required
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as DiscountType,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={DiscountType.FIXED}>정액 할인</option>
                    <option value={DiscountType.PERCENTAGE}>정률 할인</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    할인 값 *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      formData.discountType === DiscountType.FIXED
                        ? "10000"
                        : "10"
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.discountType === DiscountType.FIXED ? "원" : "%"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발급 타입 *
                  </label>
                  <select
                    required
                    value={formData.issueType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issueType: e.target.value as CouponIssueType,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={CouponIssueType.MANUAL}>수동 발급</option>
                    <option value={CouponIssueType.SIGNUP}>회원가입</option>
                    <option value={CouponIssueType.EVENT}>이벤트</option>
                    <option value={CouponIssueType.REVIEW}>리뷰 작성</option>
                    <option value={CouponIssueType.BIRTHDAY}>생일</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최대 할인 금액
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscountAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최소 주문 금액
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발급 수량 *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.issueCount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issueCount: e.target.value ? Number(e.target.value) : 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="발급할 쿠폰 수량을 입력하세요"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발급 시작일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issueStartAt}
                    onChange={(e) =>
                      setFormData({ ...formData, issueStartAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발급 종료일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issueEndAt}
                    onChange={(e) =>
                      setFormData({ ...formData, issueEndAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사용 시작일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사용 종료일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingCoupon ? "수정" : "생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
