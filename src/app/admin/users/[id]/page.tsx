"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api";
import { UserInfoResponse } from "@/types/user";

interface AdminUserDetailPageProps {
  params: {
    id: string;
  };
}

export default function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userDetail, setUserDetail] = useState<UserInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchUserDetail();
    }
  }, [user, params.id]);

  const fetchUserDetail = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await userApi.getUserInfo(parseInt(params.id));
      if (response.success) {
        setUserDetail(response.data);
      } else {
        setError("사용자 정보를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      setError("사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "USER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleText = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "관리자";
      case "USER":
        return "일반 사용자";
      default:
        return "알 수 없음";
    }
  };

  const getSocialProviderColor = (provider?: string | null) => {
    switch (provider) {
      case "GOOGLE":
        return "bg-red-100 text-red-800";
      case "KAKAO":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getSocialProviderText = (provider?: string | null) => {
    switch (provider) {
      case "GOOGLE":
        return "구글";
      case "KAKAO":
        return "카카오";
      default:
        return "일반 가입";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <Link
            href="/admin/users"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            사용자 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">
            사용자를 찾을 수 없습니다.
          </div>
          <Link
            href="/admin/users"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            사용자 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← 사용자 관리로 돌아가기
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                사용자 상세 정보
              </h1>
              <p className="mt-2 text-gray-600">
                사용자의 상세 정보를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 사용자 정보 카드 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start space-x-6">
              {/* 프로필 이미지 */}
              <div className="flex-shrink-0">
                {userDetail.profileImageUrl ? (
                  <img
                    className="h-24 w-24 rounded-full"
                    src={userDetail.profileImageUrl}
                    alt={userDetail.name}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* 사용자 정보 */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용자 ID
                    </label>
                    <div className="text-sm text-gray-900">{userDetail.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름
                    </label>
                    <div className="text-sm text-gray-900">
                      {userDetail.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                    </label>
                    <div className="text-sm text-gray-900">
                      {userDetail.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <div className="text-sm text-gray-900">
                      {userDetail.phone || "등록되지 않음"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      권한
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        userDetail.role
                      )}`}
                    >
                      {getRoleText(userDetail.role)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      가입 유형
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSocialProviderColor(
                        userDetail.socialProvider
                      )}`}
                    >
                      {getSocialProviderText(userDetail.socialProvider)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 계정 상태 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">계정 상태</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    계정 활성화
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    활성
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    이메일 인증
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    인증됨
                  </span>
                </div>
                {userDetail.socialProvider && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      소셜 연동
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      연동됨
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">활동 통계</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    총 예약 수
                  </span>
                  <span className="text-sm text-gray-900">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    작성한 리뷰
                  </span>
                  <span className="text-sm text-gray-900">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    찜한 숙소
                  </span>
                  <span className="text-sm text-gray-900">-</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  * 통계 정보는 추후 구현 예정입니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-8 flex justify-end space-x-4">
          <Link
            href="/admin/users"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
