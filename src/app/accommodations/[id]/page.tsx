"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  accommodationApi,
  roomApi,
  reviewApi,
  reservationApi,
  getImageUrl,
} from "@/lib/api";
import { AccommodationDetailResponse } from "@/types/accommodation";
import { PortalRoom } from "@/types/room";
import {
  ReviewListResponse,
  ReviewStatisticsResponse,
  ReviewCreateRequest,
} from "@/types/review";
import { useAuth } from "@/contexts/AuthContext";

export default function AccommodationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [accommodation, setAccommodation] =
    useState<AccommodationDetailResponse | null>(null);
  const [rooms, setRooms] = useState<PortalRoom[]>([]);
  const [reviews, setReviews] = useState<ReviewListResponse[]>([]);
  const [reviewStats, setReviewStats] =
    useState<ReviewStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);

  // 리뷰 작성 관련 상태
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [availableReservationId, setAvailableReservationId] = useState<
    number | null
  >(null);
  const [reviewForm, setReviewForm] = useState<ReviewCreateRequest>({
    accommodationId: 0,
    reservationId: 0,
    rating: 5,
    comment: "",
    imageUrls: [],
  });
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const accommodationId = Number(params.id);

  useEffect(() => {
    if (accommodationId) {
      fetchAccommodation();
    }
  }, [accommodationId]);

  useEffect(() => {
    if (user && accommodationId) {
      checkCanWriteReview();
    }
  }, [user, accommodationId]);

  // URL 파라미터 확인해서 리뷰 작성 폼 자동 열기
  useEffect(() => {
    const writeReview = searchParams.get("writeReview");
    const reservationId = searchParams.get("reservationId");

    if (writeReview === "true" && reservationId && user && accommodationId) {
      // 잠시 후 리뷰 작성 폼 열기 (데이터 로딩 완료 후)
      const timer = setTimeout(() => {
        setReviewForm({
          accommodationId: accommodationId,
          reservationId: Number(reservationId),
          rating: 5,
          comment: "",
          imageUrls: [],
        });
        setReviewImages([]);
        setShowReviewForm(true);
        setCanWriteReview(true);
        setAvailableReservationId(Number(reservationId));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, user, accommodationId]);

  const fetchAccommodation = async () => {
    try {
      setIsLoading(true);
      const [accommodationResponse, roomsResponse] = await Promise.all([
        accommodationApi.getAccommodationById(accommodationId),
        roomApi.getPortalRoomsByAccommodation(accommodationId),
      ]);
      setAccommodation(accommodationResponse.data);
      setRooms(roomsResponse.data);

      // 리뷰 정보 로드
      await loadReviews();
    } catch (error) {
      console.error("숙소 상세 정보 조회 실패:", error);
      setError("숙소 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const [reviewsResponse, statsResponse] = await Promise.all([
        reviewApi.getAccommodationReviews(accommodationId, undefined, 0, 5),
        reviewApi.getAccommodationReviewStatistics(accommodationId),
      ]);
      setReviews(reviewsResponse.content || []);
      setReviewStats(statsResponse);
      setHasMoreReviews(reviewsResponse.content.length === 5);
    } catch (error) {
      console.error("리뷰 정보 조회 실패:", error);
      // 리뷰 로드 실패해도 페이지는 표시
    }
  };

  const loadMoreReviews = async () => {
    try {
      const nextPage = reviewPage + 1;
      const response = await reviewApi.getAccommodationReviews(
        accommodationId,
        undefined,
        nextPage,
        5
      );
      setReviews((prev) => [...prev, ...(response.content || [])]);
      setReviewPage(nextPage);
      setHasMoreReviews(response.content.length === 5);
    } catch (error) {
      console.error("추가 리뷰 로드 실패:", error);
    }
  };

  // 리뷰 작성 가능 여부 확인
  const checkCanWriteReview = async () => {
    if (!user) {
      setCanWriteReview(false);
      return;
    }

    try {
      // 사용자의 예약 목록에서 해당 숙소의 완료된 예약을 찾음
      const reservationsResponse = await reservationApi.getUserReservations(
        "COMPLETED",
        0,
        100
      );
      const accommodationReservations =
        reservationsResponse.data.content.filter(
          (reservation: any) => reservation.accommodationId === accommodationId
        );

      if (accommodationReservations.length === 0) {
        setCanWriteReview(false);
        return;
      }

      // 각 예약에 대해 리뷰 작성 가능 여부 확인
      for (const reservation of accommodationReservations) {
        try {
          const canReview = await reviewApi.canWriteReview(reservation.id);
          if (canReview) {
            setCanWriteReview(true);
            setAvailableReservationId(reservation.id);
            return;
          }
        } catch (error) {
          console.error(
            `예약 ${reservation.id} 리뷰 작성 가능 여부 확인 실패:`,
            error
          );
        }
      }

      setCanWriteReview(false);
    } catch (error) {
      console.error("리뷰 작성 가능 여부 확인 실패:", error);
      setCanWriteReview(false);
    }
  };

  // 리뷰 작성 폼 열기
  const openReviewForm = () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!canWriteReview || !availableReservationId) {
      alert(
        "리뷰를 작성할 수 없습니다. 숙박 완료된 예약이 있는지 확인해주세요."
      );
      return;
    }

    setReviewForm({
      accommodationId: accommodationId,
      reservationId: availableReservationId,
      rating: 5,
      comment: "",
      imageUrls: [],
    });
    setReviewImages([]);
    setShowReviewForm(true);
  };

  // 리뷰 작성 폼 닫기
  const closeReviewForm = () => {
    setShowReviewForm(false);
    setReviewForm({
      accommodationId: 0,
      reservationId: 0,
      rating: 5,
      comment: "",
      imageUrls: [],
    });
    setReviewImages([]);
  };

  // 리뷰 제출
  const submitReview = async () => {
    // 리뷰 내용 유효성 검사
    if (!reviewForm.comment || reviewForm.comment.trim().length === 0) {
      return; // 텍스트박스 아래 메시지로 안내
    }

    if (reviewForm.comment.trim().length < 10) {
      return; // 텍스트박스 아래 메시지로 안내
    }

    if (reviewForm.comment.length > 1000) {
      return; // 텍스트박스 아래 메시지로 안내
    }

    // 평점 유효성 검사
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      alert("평점을 1~5점 사이에서 선택해주세요.");
      return;
    }

    if (!accommodation || !availableReservationId) {
      alert("숙소 정보나 예약 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      setIsSubmittingReview(true);

      // 이미지가 있으면 이미지 포함하여 리뷰 작성
      if (reviewImages.length > 0) {
        await reviewApi.createReviewWithImages(
          accommodation.id,
          availableReservationId,
          reviewForm.rating,
          reviewForm.comment.trim(),
          reviewImages
        );
      } else {
        // 이미지 없이 리뷰 작성
        const reviewData = {
          accommodationId: accommodation.id,
          reservationId: availableReservationId,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
        };
        await reviewApi.createReview(reviewData);
      }

      alert("리뷰가 성공적으로 작성되었습니다!");
      closeReviewForm();

      // 리뷰 목록 새로고침
      await loadReviews();
      setCanWriteReview(false); // 작성 완료 후 다시 작성 불가
    } catch (error: any) {
      console.error("리뷰 작성 실패:", error);
      alert(error.response?.data?.message || "리뷰 작성에 실패했습니다.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // 별점 렌더링 (클릭 가능)
  const renderClickableStars = (
    currentRating: number,
    onRatingChange: (rating: number) => void
  ) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onRatingChange(i)}
          className="focus:outline-none"
        >
          <svg
            className={`w-8 h-8 ${
              i <= currentRating ? "text-yellow-400" : "text-gray-300"
            } fill-current hover:text-yellow-400 transition-colors`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        </button>
      );
    }
    return stars;
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
                                    className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    상세보기
                                  </Link>
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

                {/* 리뷰 섹션 */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      리뷰 ({reviewStats?.totalReviews || 0})
                    </h2>
                    <div className="flex items-center space-x-4">
                      {reviewStats && reviewStats.totalReviews > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {renderStars(reviewStats.averageRating)}
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {reviewStats.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {user && canWriteReview && (
                        <button
                          onClick={openReviewForm}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          리뷰 작성
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 평점 분포 */}
                  {reviewStats && reviewStats.totalReviews > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-md font-medium text-gray-900 mb-3">
                        평점 분포
                      </h3>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count =
                            reviewStats.ratingCounts[rating - 1] || 0;
                          const percentage =
                            reviewStats.totalReviews > 0
                              ? (count / reviewStats.totalReviews) * 100
                              : 0;

                          return (
                            <div
                              key={rating}
                              className="flex items-center space-x-2"
                            >
                              <span className="text-sm text-gray-600 w-6">
                                {rating}점
                              </span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {count}개
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 리뷰 목록 */}
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-gray-600">
                                {review.createdBy}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                "ko-KR"
                              )}
                            </span>
                          </div>

                          <p className="text-gray-900 mb-2">{review.comment}</p>

                          {/* 리뷰 이미지 표시 */}
                          {review.images && review.images.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs text-gray-500 mb-2">
                                리뷰 이미지 ({review.images.length}개)
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {review.images
                                  .slice(0, 4)
                                  .map((image, index) => {
                                    const imageUrl = getImageUrl(
                                      image.filePath
                                    );
                                    console.log("Rendering image:", image);
                                    console.log("Full image URL:", imageUrl);
                                    return (
                                      <div key={image.id} className="relative">
                                        <img
                                          src={imageUrl}
                                          alt={`리뷰 이미지 ${index + 1}`}
                                          className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            console.log(
                                              "Opening image URL:",
                                              imageUrl
                                            );
                                            window.open(imageUrl, "_blank");
                                          }}
                                          onError={(e) => {
                                            console.error(
                                              "Failed to load image:",
                                              imageUrl
                                            );
                                            console.error(
                                              "Image object:",
                                              image
                                            );
                                          }}
                                        />
                                        {/* 4개 이상일 때 더보기 표시 */}
                                        {index === 3 &&
                                          review.images!.length > 4 && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                              <span className="text-white text-sm font-medium">
                                                +{review.images!.length - 4}
                                              </span>
                                            </div>
                                          )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* 이미지 개수만 표시 (백엔드에서 images 배열을 제공하지 않는 경우) */}
                          {review.imageCount > 0 &&
                            (!review.images || review.images.length === 0) && (
                              <div className="text-sm text-gray-500">
                                📷 첨부 이미지: {review.imageCount}장
                              </div>
                            )}
                        </div>
                      ))}

                      {/* 더보기 버튼 */}
                      {hasMoreReviews && (
                        <div className="text-center">
                          <button
                            onClick={loadMoreReviews}
                            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            리뷰 더보기
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-lg mb-2">아직 리뷰가 없습니다</div>
                      <div className="text-sm">
                        첫 번째 리뷰를 작성해보세요!
                      </div>
                    </div>
                  )}

                  {/* 리뷰 작성 폼 */}
                  {showReviewForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                              리뷰 작성
                            </h3>
                            <button
                              onClick={closeReviewForm}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="space-y-6">
                            {/* 별점 선택 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                평점
                              </label>
                              <div className="flex items-center space-x-1">
                                {renderClickableStars(
                                  reviewForm.rating,
                                  (rating) =>
                                    setReviewForm({ ...reviewForm, rating })
                                )}
                                <span className="ml-2 text-sm text-gray-600">
                                  {reviewForm.rating}점
                                </span>
                              </div>
                            </div>

                            {/* 리뷰 내용 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                리뷰 내용
                              </label>
                              <textarea
                                value={reviewForm.comment}
                                onChange={(e) =>
                                  setReviewForm({
                                    ...reviewForm,
                                    comment: e.target.value,
                                  })
                                }
                                rows={6}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  reviewForm.comment &&
                                  reviewForm.comment.trim().length > 0 &&
                                  reviewForm.comment.trim().length < 10
                                    ? "border-red-300"
                                    : reviewForm.comment &&
                                      reviewForm.comment.length > 1000
                                    ? "border-red-300"
                                    : "border-gray-300"
                                }`}
                                placeholder="숙박 경험을 자세히 작성해주세요. (최소 10자 이상)"
                              />
                              <div className="mt-1 flex justify-between items-center">
                                <div className="text-sm">
                                  {!reviewForm.comment ||
                                  reviewForm.comment.trim().length === 0 ? (
                                    <span className="text-gray-500">
                                      리뷰 내용을 입력해주세요.
                                    </span>
                                  ) : reviewForm.comment.trim().length < 10 ? (
                                    <span className="text-red-500">
                                      최소 10자 이상 입력해주세요. (현재{" "}
                                      {reviewForm.comment.trim().length}자)
                                    </span>
                                  ) : reviewForm.comment.length > 1000 ? (
                                    <span className="text-red-500">
                                      1000자 이하로 입력해주세요. (현재{" "}
                                      {reviewForm.comment.length}자)
                                    </span>
                                  ) : (
                                    <span className="text-green-600">
                                      ✓ 입력 완료
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {reviewForm.comment?.length || 0}/1000자
                                </div>
                              </div>
                            </div>

                            {/* 이미지 업로드 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                사진 첨부 (선택사항)
                              </label>
                              <div className="space-y-4">
                                {/* 파일 선택 버튼 */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                  <input
                                    type="file"
                                    id="review-images"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                      const files = Array.from(
                                        e.target.files || []
                                      );
                                      const validFiles = files.filter(
                                        (file) => {
                                          // 파일 크기 제한 (5MB)
                                          if (file.size > 5 * 1024 * 1024) {
                                            alert(
                                              `${file.name}은(는) 파일 크기가 5MB를 초과합니다.`
                                            );
                                            return false;
                                          }
                                          // 이미지 파일 확인
                                          if (!file.type.startsWith("image/")) {
                                            alert(
                                              `${file.name}은(는) 이미지 파일이 아닙니다.`
                                            );
                                            return false;
                                          }
                                          return true;
                                        }
                                      );

                                      // 최대 5개 제한
                                      const totalFiles =
                                        reviewImages.length + validFiles.length;
                                      if (totalFiles > 5) {
                                        alert(
                                          "최대 5개까지만 업로드할 수 있습니다."
                                        );
                                        const allowedCount =
                                          5 - reviewImages.length;
                                        setReviewImages([
                                          ...reviewImages,
                                          ...validFiles.slice(0, allowedCount),
                                        ]);
                                      } else {
                                        setReviewImages([
                                          ...reviewImages,
                                          ...validFiles,
                                        ]);
                                      }

                                      // 파일 입력 초기화
                                      e.target.value = "";
                                    }}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="review-images"
                                    className="cursor-pointer"
                                  >
                                    <div className="text-gray-500">
                                      <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                      >
                                        <path
                                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                          strokeWidth={2}
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                      <p className="mt-2 text-sm">
                                        클릭하여 사진을 선택하세요
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        최대 5개, 각 파일 5MB 이하
                                      </p>
                                    </div>
                                  </label>
                                </div>

                                {/* 선택된 이미지 미리보기 */}
                                {reviewImages.length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {reviewImages.map((file, index) => (
                                      <div key={index} className="relative">
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt={`미리보기 ${index + 1}`}
                                          className="w-full h-24 object-cover rounded-lg border"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReviewImages(
                                              reviewImages.filter(
                                                (_, i) => i !== index
                                              )
                                            );
                                          }}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 버튼 */}
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={closeReviewForm}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={isSubmittingReview}
                              >
                                취소
                              </button>
                              <button
                                onClick={submitReview}
                                disabled={isSubmittingReview}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                              >
                                {isSubmittingReview
                                  ? "작성 중..."
                                  : "리뷰 작성"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
