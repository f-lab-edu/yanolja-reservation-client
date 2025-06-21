"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { accommodationApi } from "@/lib/api";
import { AccommodationResponse } from "@/types/accommodation";

export default function AdminAccommodationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accommodations, setAccommodations] = useState<AccommodationResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchAccommodations();
    }
  }, [user]);

  const fetchAccommodations = async () => {
    try {
      setIsLoading(true);
      const response = await accommodationApi.getAllAccommodations();
      // API 응답을 AccommodationResponse 형태로 변환
      const accommodationsData = response.data.map(
        (acc) =>
          ({
            ...acc,
            status: acc.status || "ACTIVE",
            images: [],
            amenities: [],
            rooms: [],
          } as AccommodationResponse)
      );
      setAccommodations(accommodationsData);
    } catch (error) {
      console.error("숙소 목록 조회 실패:", error);
      setError("숙소 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccommodation = async (id: number) => {
    if (!confirm("정말로 이 숙소를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await accommodationApi.deleteAccommodation(id);
      setAccommodations((prev) => prev.filter((acc) => acc.id !== id));
      alert("숙소가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("숙소 삭제 실패:", error);
      alert("숙소 삭제에 실패했습니다.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "활성";
      case "INACTIVE":
        return "비활성";
      case "SUSPENDED":
        return "정지";
      default:
        return "알 수 없음";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← 관리자 대시보드로 돌아가기
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">숙소 관리</h1>
              <p className="mt-2 text-gray-600">
                등록된 숙소들을 관리하고 새로운 숙소를 추가할 수 있습니다.
              </p>
            </div>
            <Link
              href="/admin/accommodations/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              새 숙소 등록
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">{error}</div>
            <button
              onClick={fetchAccommodations}
              className="mt-2 text-red-600 hover:text-red-500 text-sm underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {accommodations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              등록된 숙소가 없습니다
            </h3>
            <p className="text-gray-500 mb-4">첫 번째 숙소를 등록해보세요.</p>
            <Link
              href="/admin/accommodations/new"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              숙소 등록하기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      숙소 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가격/박
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      평점
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
                  {accommodations.map((accommodation) => (
                    <tr key={accommodation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {accommodation.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {accommodation.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {accommodation.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₩{accommodation.pricePerNight.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {accommodation.rating ? (
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 text-yellow-400 fill-current mr-1"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            {accommodation.rating.toFixed(1)}
                            <span className="text-gray-500 ml-1">
                              ({accommodation.reviewCount || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">평점 없음</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            accommodation.status || "ACTIVE"
                          )}`}
                        >
                          {getStatusText(accommodation.status || "ACTIVE")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/accommodations/${accommodation.id}`}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() =>
                              handleDeleteAccommodation(accommodation.id)
                            }
                            className="text-red-600 hover:text-red-500"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
