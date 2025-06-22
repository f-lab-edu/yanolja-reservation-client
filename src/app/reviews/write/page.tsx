"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { reviewApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function WriteReviewPage() {
  const [accommodationId, setAccommodationId] = useState<number | null>(null);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [canWrite, setCanWrite] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const accommodationIdParam = searchParams.get("accommodationId");
    const reservationIdParam = searchParams.get("reservationId");

    if (accommodationIdParam && reservationIdParam) {
      const accId = parseInt(accommodationIdParam);
      const resId = parseInt(reservationIdParam);
      setAccommodationId(accId);
      setReservationId(resId);

      // 리뷰 작성 가능 여부 확인
      checkCanWriteReview(resId);
    } else {
      alert("잘못된 접근입니다.");
      router.push("/");
    }
  }, [searchParams]);

  const checkCanWriteReview = async (reservationId: number) => {
    try {
      const canWrite = await reviewApi.canWriteReview(reservationId);
      setCanWrite(canWrite);
      if (!canWrite) {
        alert("이미 리뷰를 작성했거나 리뷰 작성이 불가능한 예약입니다.");
        router.push("/my-reservations");
      }
    } catch (error) {
      console.error("리뷰 작성 가능 여부 확인 실패:", error);
      alert("리뷰 작성 가능 여부를 확인할 수 없습니다.");
      router.push("/my-reservations");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert("이미지는 최대 5개까지 업로드 가능합니다.");
      return;
    }

    setImages((prev) => [...prev, ...files]);

    // 미리보기를 위한 URL 생성
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageUrls((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accommodationId || !reservationId) {
      alert("필수 정보가 누락되었습니다.");
      return;
    }

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 리뷰 내용 유효성 검사
    if (!comment || comment.trim().length === 0) {
      return; // 텍스트박스 아래 메시지로 안내
    }

    if (comment.trim().length < 10) {
      return; // 텍스트박스 아래 메시지로 안내
    }

    if (comment.length > 1000) {
      return; // 텍스트박스 아래 메시지로 안내
    }

    // 평점 유효성 검사
    if (!rating || rating < 1 || rating > 5) {
      alert("평점을 1~5점 사이에서 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 이미지가 있으면 이미지 포함하여 리뷰 작성
      if (images.length > 0) {
        await reviewApi.createReviewWithImages(
          accommodationId,
          reservationId,
          rating,
          comment.trim(),
          images
        );
      } else {
        // 이미지 없이 리뷰 작성
        const reviewData = {
          accommodationId,
          reservationId,
          rating,
          comment: comment.trim(),
        };
        await reviewApi.createReview(reviewData);
      }

      alert("리뷰가 성공적으로 작성되었습니다!");
      router.push("/my-reservations");
    } catch (error) {
      console.error("리뷰 작성 실패:", error);
      alert("리뷰 작성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-3xl transition-colors ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-lg font-medium">({rating}점)</span>
      </div>
    );
  };

  if (!canWrite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            리뷰 작성 확인 중...
          </div>
          <div className="text-gray-600">잠시만 기다려주세요.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">리뷰 작성</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 평점 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평점을 선택해주세요
              </label>
              {renderStars()}
            </div>

            {/* 리뷰 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                리뷰 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="숙소에 대한 솔직한 후기를 작성해주세요. (최소 10자 이상)"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  comment &&
                  comment.trim().length > 0 &&
                  comment.trim().length < 10
                    ? "border-red-300"
                    : comment && comment.length > 1000
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
                rows={6}
                maxLength={1000}
                required
              />
              <div className="mt-1 flex justify-between items-center">
                <div className="text-sm">
                  {!comment || comment.trim().length === 0 ? (
                    <span className="text-gray-500">
                      리뷰 내용을 입력해주세요.
                    </span>
                  ) : comment.trim().length < 10 ? (
                    <span className="text-red-500">
                      최소 10자 이상 입력해주세요. (현재 {comment.trim().length}
                      자)
                    </span>
                  ) : comment.length > 1000 ? (
                    <span className="text-red-500">
                      1000자 이하로 입력해주세요. (현재 {comment.length}자)
                    </span>
                  ) : (
                    <span className="text-green-600">✓ 입력 완료</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {comment.length}/1000자
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
                    id="review-images-write"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const validFiles = files.filter((file) => {
                        // 파일 크기 제한 (5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert(
                            `${file.name}은(는) 파일 크기가 5MB를 초과합니다.`
                          );
                          return false;
                        }
                        // 이미지 파일 확인
                        if (!file.type.startsWith("image/")) {
                          alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
                          return false;
                        }
                        return true;
                      });

                      // 최대 5개 제한
                      const totalFiles = images.length + validFiles.length;
                      if (totalFiles > 5) {
                        alert("최대 5개까지만 업로드할 수 있습니다.");
                        const allowedCount = 5 - images.length;
                        setImages([
                          ...images,
                          ...validFiles.slice(0, allowedCount),
                        ]);

                        // 미리보기를 위한 URL 생성
                        validFiles.slice(0, allowedCount).forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            if (e.target?.result) {
                              setImageUrls((prev) => [
                                ...prev,
                                e.target!.result as string,
                              ]);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                      } else {
                        setImages([...images, ...validFiles]);

                        // 미리보기를 위한 URL 생성
                        validFiles.forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            if (e.target?.result) {
                              setImageUrls((prev) => [
                                ...prev,
                                e.target!.result as string,
                              ]);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                      }

                      // 파일 입력 초기화
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="review-images-write"
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
                      <p className="mt-2 text-sm">클릭하여 사진을 선택하세요</p>
                      <p className="text-xs text-gray-400">
                        최대 5개, 각 파일 5MB 이하
                      </p>
                    </div>
                  </label>
                </div>

                {/* 선택된 이미지 미리보기 */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`미리보기 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
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

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "작성 중..." : "리뷰 작성"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
