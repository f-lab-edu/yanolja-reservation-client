"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/lib/api";
import { UserInfoResponse } from "@/types/user";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserInfo();
    }
  }, [user]);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      // user.id가 없는 경우 현재 사용자 정보를 가져오는 API 사용
      const response = user?.id
        ? await userApi.getUserInfo(user.id)
        : await userApi.getCurrentUser();
      setUserInfo(response.data);
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      setError("사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userInfo) return;

    try {
      await userApi.withdrawUser(userInfo.id);
      alert("회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
      logout();
      router.push("/");
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      alert("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const getSocialProviderName = (provider: string | null) => {
    switch (provider) {
      case "GOOGLE":
        return "구글";
      case "KAKAO":
        return "카카오";
      default:
        return "일반 회원가입";
    }
  };

  const getSocialProviderColor = (provider: string | null) => {
    switch (provider) {
      case "GOOGLE":
        return "bg-red-100 text-red-800";
      case "KAKAO":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">내 프로필</h1>
          <p className="mt-2 text-gray-600">
            계정 정보를 확인하고 관리할 수 있습니다.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">{error}</div>
            <button
              onClick={fetchUserInfo}
              className="mt-2 text-red-600 hover:text-red-500 text-sm underline"
            >
              다시 시도
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 프로필 정보 */}
          <div className="lg:col-span-2">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  기본 정보
                </h2>
                <Link
                  href="/profile/edit"
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  정보 수정
                </Link>
              </div>

              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                  {userInfo.profileImageUrl ? (
                    <img
                      src={userInfo.profileImageUrl}
                      alt="프로필 이미지"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {userInfo.name}
                  </h3>
                  <p className="text-gray-600">{userInfo.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">이름</span>
                  <span className="text-gray-900">{userInfo.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">이메일</span>
                  <span className="text-gray-900">{userInfo.email}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">전화번호</span>
                  <span className="text-gray-900">
                    {userInfo.phone || "등록되지 않음"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">계정 유형</span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSocialProviderColor(
                      userInfo.socialProvider || null
                    )}`}
                  >
                    {getSocialProviderName(userInfo.socialProvider || null)}
                  </span>
                </div>
                {userInfo.role && (
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-700">권한</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userInfo.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userInfo.role === "ADMIN" ? "관리자" : "일반 사용자"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 계정 관리 카드 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                계정 관리
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">비밀번호 변경</h3>
                    <p className="text-sm text-gray-600">
                      계정 보안을 위해 정기적으로 비밀번호를 변경하세요
                    </p>
                  </div>
                  <Link
                    href="/profile/edit"
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    변경하기
                  </Link>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-red-900">회원 탈퇴</h3>
                    <p className="text-sm text-red-600">
                      계정과 모든 데이터가 영구적으로 삭제됩니다
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWithdrawConfirm(true)}
                    className="text-red-600 hover:text-red-500 text-sm font-medium"
                  >
                    탈퇴하기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 빠른 메뉴 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                빠른 메뉴
              </h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-900">내 예약</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    <span className="text-gray-900">내 리뷰</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-gray-900">찜 목록</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <span className="text-gray-900">결제 내역</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 회원 탈퇴 확인 모달 */}
        {showWithdrawConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-mx mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                회원 탈퇴 확인
              </h3>
              <p className="text-gray-600 mb-6">
                정말로 회원 탈퇴를 하시겠습니까?
                <br />
                탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowWithdrawConfirm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleWithdraw}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  탈퇴하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
