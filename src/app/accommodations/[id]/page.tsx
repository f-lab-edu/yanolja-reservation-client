"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { accommodationApi, roomApi, getImageUrl } from "@/lib/api";
import { AccommodationDetailResponse } from "@/types/accommodation";
import { PortalRoom } from "@/types/room";

export default function AccommodationDetailPage() {
  const params = useParams();
  const [accommodation, setAccommodation] =
    useState<AccommodationDetailResponse | null>(null);
  const [rooms, setRooms] = useState<PortalRoom[]>([]);
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
      const [accommodationResponse, roomsResponse] = await Promise.all([
        accommodationApi.getAccommodationById(accommodationId),
        roomApi.getPortalRoomsByAccommodation(accommodationId),
      ]);
      setAccommodation(accommodationResponse.data);
      setRooms(roomsResponse.data);
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
                            <div className="w-6 h-6 mr-3 flex items-center justify-center">
                              {amenity.iconUrl ? (
                                <img
                                  src={amenity.iconUrl}
                                  alt={amenity.name}
                                  className="w-6 h-6 object-cover rounded"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
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
                              )}
                            </div>
                            <span className="text-gray-700">
                              {amenity.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 객실 목록 */}
                {rooms.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      객실 선택
                    </h2>
                    <div className="space-y-4">
                      {rooms.map((room) => (
                        <div
                          key={room.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* 객실 이미지 */}
                            <div className="md:w-48 flex-shrink-0">
                              {room.mainImageUrl ? (
                                <img
                                  src={getImageUrl(room.mainImageUrl)}
                                  alt={room.name}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
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
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* 객실 정보 */}
                            <div className="flex-grow">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {room.name}
                                </h3>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-gray-900">
                                    ₩{room.pricePerNight.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    / 박
                                  </div>
                                </div>
                              </div>

                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {room.description}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                      />
                                    </svg>
                                    최대 {room.capacity}명
                                  </div>
                                  <div className="flex items-center">
                                    <span
                                      className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                        room.status === "AVAILABLE"
                                          ? "bg-green-400"
                                          : "bg-red-400"
                                      }`}
                                    ></span>
                                    {room.status === "AVAILABLE"
                                      ? "예약 가능"
                                      : "예약 불가"}
                                  </div>
                                </div>

                                <div className="flex space-x-2">
                                  <Link
                                    href={`/rooms/${room.id}`}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                  >
                                    상세보기
                                  </Link>
                                  {room.status === "AVAILABLE" && (
                                    <button className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                      예약하기
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* 객실 옵션 (있는 경우) */}
                              {room.options && room.options.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="text-xs text-gray-500 mb-1">
                                    추가 옵션:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {room.options.slice(0, 3).map((option) => (
                                      <span
                                        key={option.id}
                                        className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                                      >
                                        {option.name} (+₩
                                        {option.price.toLocaleString()})
                                      </span>
                                    ))}
                                    {room.options.length > 3 && (
                                      <span className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                                        +{room.options.length - 3}개 더
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
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
                    <div className="text-gray-600">/ 박 부터</div>
                  </div>

                  {rooms.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 text-center">
                        {rooms.length}개 객실 이용 가능
                      </div>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200">
                        객실 선택하기
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-500 text-sm mb-3">
                        현재 예약 가능한 객실이 없습니다
                      </div>
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                      >
                        예약 불가
                      </button>
                    </div>
                  )}

                  <div className="text-center text-xs text-gray-500 mt-4">
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
