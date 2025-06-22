"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { accommodationApi, getImageUrl } from "@/lib/api";
import {
  AccommodationListResponse,
  AccommodationSearchRequest,
  PageResponse,
} from "@/types/accommodation";

export default function AccommodationsPage() {
  const [accommodations, setAccommodations] = useState<
    AccommodationListResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    // 페이지 로드시 기본값으로 10개 숙소 조회
    searchAccommodations();
  }, []);

  const searchAccommodations = async (page = 0, newSearch = false) => {
    try {
      setIsLoading(true);
      setError(null);

      if (newSearch) {
        setCurrentPage(0);
        page = 0;
      }

      const searchRequest: AccommodationSearchRequest = {
        condition: {
          keyword: searchKeyword || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
        },
        pageRequest: {
          page,
          size: 10,
          sortColumn: "id",
          sortDirection: "desc",
        },
      };

      const response = await accommodationApi.searchAccommodations(
        searchRequest
      );
      setAccommodations(response.data.content);
      setCurrentPage(response.data.number);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error("숙소 검색 실패:", error);
      setError("숙소를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    searchAccommodations(0, true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    searchAccommodations(page);
  };

  const clearFilters = () => {
    setSearchKeyword("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    searchAccommodations(0, true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={i}
          className="w-4 h-4 text-yellow-400 fill-current"
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg
          key="half"
          className="w-4 h-4 text-yellow-400 fill-current"
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half-star)"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300 fill-current"
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    return stars;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    // 이전 버튼
    if (currentPage > 0) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50"
        >
          이전
        </button>
      );
    }

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border-t border-b border-r border-gray-300 ${
            i === currentPage
              ? "bg-blue-50 border-blue-500 text-blue-600"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {i + 1}
        </button>
      );
    }

    // 다음 버튼
    if (currentPage < totalPages - 1) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50"
        >
          다음
        </button>
      );
    }

    return (
      <div className="flex justify-center mt-8">
        <nav
          className="inline-flex rounded-md shadow-sm"
          aria-label="Pagination"
        >
          {pages}
        </nav>
      </div>
    );
  };

  if (isLoading && accommodations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← 홈으로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              숙소 둘러보기
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              다양한 숙소 중에서 원하는 곳을 선택해보세요.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 필터 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            숙소 검색
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색어
              </label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="숙소명 또는 주소 검색"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 가격
              </label>
              <input
                type="number"
                value={minPrice || ""}
                onChange={(e) =>
                  setMinPrice(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 가격
              </label>
              <input
                type="number"
                value={maxPrice || ""}
                onChange={(e) =>
                  setMaxPrice(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="1000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium"
              >
                {isLoading ? "검색중..." : "검색"}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 검색 결과 정보 */}
        {!isLoading && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              총 {totalElements}개의 숙소가 있습니다.
            </p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-red-900 mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => searchAccommodations()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 숙소 목록 */}
        {!error && accommodations.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-500">
              검색 조건을 변경해서 다시 시도해보세요.
            </p>
          </div>
        )}

        {!error && accommodations.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((accommodation) => (
                <Link
                  key={accommodation.id}
                  href={`/accommodations/${accommodation.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      {accommodation.mainImageUrl ? (
                        <img
                          src={getImageUrl(accommodation.mainImageUrl)}
                          alt={accommodation.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                        {accommodation.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {accommodation.address}
                      </p>

                      {accommodation.rating && (
                        <div className="flex items-center mb-3">
                          <div className="flex items-center">
                            {renderStars(accommodation.rating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {accommodation.rating.toFixed(1)} (
                            {accommodation.reviewCount || 0}개 리뷰)
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            ₩{accommodation.pricePerNight.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600 ml-1">
                            / 박
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
}
