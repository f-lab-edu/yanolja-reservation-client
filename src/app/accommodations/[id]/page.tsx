"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { accommodationApi, getImageUrl } from "@/lib/api";
import { AccommodationDetailResponse } from "@/types/accommodation";

export default function AccommodationDetailPage() {
  const params = useParams();
  const [accommodation, setAccommodation] =
    useState<AccommodationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const accommodationId = Number(params.id);

  useEffect(() => {
    if (accommodationId) {
      fetchAccommodation();
    }
  }, [accommodationId]);

  const fetchAccommodation = async () => {
    try {
      setIsLoading(true);
      const response = await accommodationApi.getAccommodationById(
        accommodationId
      );
      setAccommodation(response.data);
    } catch (error) {
      console.error("숙소 상세 정보 조회 실패:", error);
      setError("숙소 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={i}
          className="w-5 h-5 text-yellow-400 fill-current"
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
          className="w-5 h-5 text-yellow-400 fill-current"
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          className="w-5 h-5 text-gray-300 fill-current"
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "숙소를 찾을 수 없습니다"}
          </h2>
          <Link
            href="/accommodations"
            className="text-blue-600 hover:text-blue-500"
          >
            숙소 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/accommodations"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          숙소 목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 이미지 갤러리 */}
          <div className="p-6">
            {accommodation.images && accommodation.images.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* 메인 이미지 */}
                <div className="lg:col-span-3">
                  <div className="relative">
                    <img
                      src={getImageUrl(
                        accommodation.images[selectedImageIndex]?.imageUrl
                      )}
                      alt={accommodation.name}
                      className="w-full h-64 lg:h-96 object-cover rounded-lg"
                    />

                    {/* 이미지 네비게이션 버튼 */}
                    {accommodation.images.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setSelectedImageIndex(
                              selectedImageIndex === 0
                                ? accommodation.images.length - 1
                                : selectedImageIndex - 1
                            )
                          }
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            setSelectedImageIndex(
                              selectedImageIndex ===
                                accommodation.images.length - 1
                                ? 0
                                : selectedImageIndex + 1
                            )
                          }
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* 이미지 카운터 */}
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {accommodation.images.length}
                    </div>
                  </div>
                </div>

                {/* 썸네일 이미지들 */}
                <div className="lg:col-span-1">
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {accommodation.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative rounded-lg overflow-hidden transition-all ${
                          selectedImageIndex === index
                            ? "ring-2 ring-blue-500 opacity-100"
                            : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={getImageUrl(image.imageUrl)}
                          alt={`${accommodation.name} 이미지 ${index + 1}`}
                          className="w-full h-20 lg:h-24 object-cover"
                        />
                        {/* 대표 이미지 표시 */}
                        {image.isMain && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                            대표
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* 더 많은 이미지가 있을 때 표시 */}
                  {accommodation.images.length > 8 && (
                    <div className="mt-2 text-center">
                      <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        모든 사진 보기 ({accommodation.images.length}장)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-64 lg:h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500">등록된 이미지가 없습니다</p>
                </div>
              </div>
            )}
          </div>

          {/* 숙소 정보 */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 왼쪽: 기본 정보 */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {accommodation.name}
                </h1>

                {accommodation.rating && (
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {renderStars(accommodation.rating)}
                    </div>
                    <span className="ml-2 text-lg text-gray-600">
                      {accommodation.rating.toFixed(1)} (
                      {accommodation.reviewCount || 0}개 리뷰)
                    </span>
                  </div>
                )}

                <div className="flex items-center text-gray-600 mb-6">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {accommodation.address}
                </div>

                {accommodation.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      숙소 소개
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {accommodation.description}
                    </p>
                  </div>
                )}

                {/* 편의시설 */}
                {accommodation.amenities &&
                  accommodation.amenities.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">
                        편의시설
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {accommodation.amenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="text-gray-700">
                              {amenity.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* 오른쪽: 예약 카드 */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900">
                      ₩{accommodation.pricePerNight.toLocaleString()}
                    </div>
                    <div className="text-gray-600">/ 박</div>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 mb-4">
                    예약하기
                  </button>

                  <div className="text-center text-sm text-gray-500">
                    예약 확정 전까지는 요금이 청구되지 않습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
