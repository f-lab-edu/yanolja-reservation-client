"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reviewApi, getImageUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewListResponse, PageResponse } from "@/types/review";

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<ReviewListResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadReviews();
  }, [user, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response: PageResponse<ReviewListResponse> =
        await reviewApi.getMyReviews(page, 10);
      setReviews(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("리뷰 목록 조회 실패:", error);
      alert("리뷰 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("정말로 이 리뷰를 삭제하시겠습니까?")) {
      return;
    }

    try {
      setDeleteLoading(reviewId);
      await reviewApi.deleteReview(reviewId);
      alert("리뷰가 삭제되었습니다.");
      loadReviews(); // 목록 새로고침
    } catch (error) {
      console.error("리뷰 삭제 실패:", error);
      alert("리뷰 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditReview = (reviewId: number) => {
    router.push(`/reviews/edit/${reviewId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const startPage = Math.max(0, page - 2);
    const endPage = Math.min(totalPages - 1, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => setPage(0)}
          disabled={page === 0}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          처음
        </button>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          이전
        </button>

        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setPage(pageNum)}
            className={`px-3 py-1 text-sm border rounded ${
              page === pageNum ? "bg-blue-500 text-white" : "hover:bg-gray-100"
            }`}
          >
            {pageNum + 1}
          </button>
        ))}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          다음
        </button>
        <button
          onClick={() => setPage(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          마지막
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            리뷰 목록 로딩 중...
          </div>
          <div className="text-gray-600">잠시만 기다려주세요.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">내 리뷰</h1>
          <p className="text-gray-600 mt-2">
            총 {totalElements}개의 리뷰를 작성하셨습니다.
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 text-lg mb-4">
              작성한 리뷰가 없습니다.
            </div>
            <button
              onClick={() => router.push("/my-reservations")}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              예약 내역에서 리뷰 작성하기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {renderStars(review.rating)}
                    <div className="text-sm text-gray-500 mt-1">
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditReview(review.id)}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={deleteLoading === review.id}
                      className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {deleteLoading === review.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>

                <div className="text-gray-900 mb-4">{review.comment}</div>

                {/* 리뷰 이미지 표시 */}
                {review.images && review.images.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">
                      리뷰 이미지 ({review.images.length}개)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {review.images.slice(0, 4).map((image, index) => {
                        const imageUrl = getImageUrl(image.filePath);
                        console.log("My reviews - Rendering image:", image);
                        console.log("My reviews - Full image URL:", imageUrl);
                        return (
                          <div key={image.id} className="relative">
                            <img
                              src={imageUrl}
                              alt={`리뷰 이미지 ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                console.log("Opening image URL:", imageUrl);
                                window.open(imageUrl, "_blank");
                              }}
                              onError={(e) => {
                                console.error(
                                  "Failed to load image:",
                                  imageUrl
                                );
                                console.error("Image object:", image);
                              }}
                            />
                            {/* 4개 이상일 때 더보기 표시 */}
                            {index === 3 && review.images!.length > 4 && (
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
                    <div className="text-sm text-gray-500 mb-4">
                      📷 첨부 이미지: {review.imageCount}장
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {renderPagination()}
      </div>
    </div>
  );
}
