"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // OAuth2 로그인 실패 처리
    const error = searchParams.get("error");
    if (error) {
      console.error("OAuth2 로그인 실패:", error);
      // 에러 파라미터 제거
      router.replace("/");
    }
  }, [searchParams, router]);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">야놀자</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700">
                    안녕하세요, {user?.name || user?.email}님!
                  </span>
                  <Link
                    href="/profile"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                  >
                    내 프로필
                  </Link>
                  {user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                    >
                      관리자
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  로그인
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            야놀자 숙박 예약 서비스
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            편리하고 안전한 숙박 예약을 경험해보세요
          </p>

          {isAuthenticated ? (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                환영합니다!
              </h3>
              <p className="text-gray-600 mb-6">
                로그인이 성공적으로 완료되었습니다.
              </p>
              <div className="space-y-4">
                <Link
                  href="/accommodations"
                  className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 text-center"
                >
                  숙소 둘러보기
                </Link>
                <Link
                  href="/profile"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 text-center"
                >
                  내 프로필
                </Link>
                <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors duration-200">
                  내 예약 확인
                </button>
                {user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 text-center"
                  >
                    관리자 대시보드
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                시작하기
              </h3>
              <p className="text-gray-600 mb-6">
                로그인하여 다양한 숙소를 예약해보세요.
              </p>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors duration-200"
              >
                로그인하러 가기
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-300">
            <p>&copy; 2024 야놀자. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
