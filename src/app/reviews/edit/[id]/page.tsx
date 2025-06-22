"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { reviewApi, getImageUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewResponse } from "@/types/review";

export default function EditReviewPage() {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const reviewId = parseInt(params.id as string);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (isNaN(reviewId)) {
      alert("잘못된 리뷰 ID입니다.");
      router.push("/my-reviews");
      return;
    }

    loadReview();
  }, [user, reviewId]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const reviewData: ReviewResponse = await reviewApi.getReview(reviewId);

      // 작성자 확인
      if (reviewData.userId !== user?.id) {
        alert("수정 권한이 없습니다.");
        router.push("/my-reviews");
        return;
      }

      setReview(reviewData);
      setRating(reviewData.rating);
      setComment(reviewData.comment || "");

      // 기존 이미지 로드
      await loadExistingImages();
    } catch (error) {
      console.error("리뷰 조회 실패:", error);
      alert("리뷰를 불러오는데 실패했습니다.");
      router.push("/my-reviews");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingImages = async () => {
    try {
      setImageLoading(true);
      const imageResponse = await reviewApi.getReviewImages(reviewId);
      setExistingImages(imageResponse.images || []);
    } catch (error) {
      console.error("기존 이미지 로드 실패:", error);
      // 이미지 로드 실패해도 리뷰 수정은 가능하도록
    } finally {
      setImageLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 5) {
      alert("이미지는 최대 5개까지 업로드 가능합니다.");
      return;
    }

    // 파일 크기 및 타입 검증
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}은(는) 파일 크기가 5MB를 초과합니다.`);
        return false;
      }
      if (!file.type.startsWith("image/")) {
        alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        return false;
      }
      return true;
    });

    setNewImages([...newImages, ...validFiles]);

    // 기존 미리보기 URL 정리
    newImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

    // 새 미리보기 URL 생성
    const allFiles = [...newImages, ...validFiles];
    const previewUrls = allFiles.map((file) => URL.createObjectURL(file));
    setNewImagePreviewUrls(previewUrls);
  };

  const handleImageUpload = async () => {
    if (newImages.length === 0) return;

    try {
      setImageLoading(true);
      await reviewApi.uploadReviewImages(reviewId, newImages);

      // 이미지 목록 새로고침
      await loadExistingImages();

      // 새 이미지 상태 초기화
      setNewImages([]);
      newImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setNewImagePreviewUrls([]);

      alert("이미지가 성공적으로 업로드되었습니다.");
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setImageLoading(false);
    }
  };

  const removeNewImage = (index: number) => {
    const newFiles = newImages.filter((_, i) => i !== index);
    const newUrls = newImagePreviewUrls.filter((_, i) => i !== index);

    setNewImages(newFiles);
    setNewImagePreviewUrls(newUrls);

    // 제거된 URL 메모리 정리
    URL.revokeObjectURL(newImagePreviewUrls[index]);
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      setImageLoading(true);
      await reviewApi.deleteReviewImage(imageId);

      // 이미지 목록 새로고침
      await loadExistingImages();

      alert("이미지가 삭제되었습니다.");
    } catch (error) {
      console.error("이미지 삭제 실패:", error);
      alert("이미지 삭제에 실패했습니다.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!review) {
      alert("리뷰 정보를 불러오지 못했습니다.");
      return;
    }

    if (comment.trim().length < 10) {
      alert("리뷰 내용을 10자 이상 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      // 새 이미지가 있으면 먼저 업로드
      if (newImages.length > 0) {
        await handleImageUpload();
      }

      const updateData = {
        rating,
        comment: comment.trim(),
      };

      await reviewApi.updateReview(reviewId, updateData);
      alert("리뷰가 성공적으로 수정되었습니다!");
      router.push("/my-reviews");
    } catch (error) {
      console.error("리뷰 수정 실패:", error);
      alert("리뷰 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      newImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviewUrls]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            리뷰 정보 로딩 중...
          </div>
          <div className="text-gray-600">잠시만 기다려주세요.</div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            리뷰를 찾을 수 없습니다.
          </div>
          <button
            onClick={() => router.push("/my-reviews")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            내 리뷰 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">리뷰 수정</h1>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                maxLength={1000}
                required
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {comment.length}/1000자
              </div>
            </div>

            {/* 리뷰 이미지 관리 */}
            <div className="space-y-6">
              {/* 기존 이미지 */}
              {existingImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      기존 이미지 ({existingImages.length}개)
                    </label>
                    {imageLoading && (
                      <div className="text-sm text-gray-500">처리 중...</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={getImageUrl(image.filePath)}
                          alt="리뷰 이미지"
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(image.id)}
                          disabled={imageLoading}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          title="이미지 삭제"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 이미지 추가 (전체 최대 5개)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={
                    existingImages.length + newImages.length >= 5 ||
                    imageLoading
                  }
                />
                <p className="mt-1 text-sm text-gray-500">
                  이미지 파일만 선택 가능, 각 파일 최대 5MB
                </p>

                {/* 새 이미지 미리보기 */}
                {newImagePreviewUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">
                        선택된 이미지 미리보기
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleImageUpload}
                          disabled={imageLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:bg-gray-400"
                        >
                          {imageLoading ? "업로드 중..." : "업로드"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewImages([]);
                            newImagePreviewUrls.forEach((url) =>
                              URL.revokeObjectURL(url)
                            );
                            setNewImagePreviewUrls([]);
                          }}
                          disabled={imageLoading}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:bg-gray-400"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {newImagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={url}
                              alt={`새 이미지 미리보기 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            disabled={imageLoading}
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/my-reviews")}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={saving || imageLoading}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving || imageLoading || comment.trim().length < 10}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving
                  ? "수정 중..."
                  : imageLoading
                  ? "이미지 처리 중..."
                  : "리뷰 수정"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
