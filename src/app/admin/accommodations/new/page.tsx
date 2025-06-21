"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { accommodationApi, amenityApi } from "@/lib/api";
import { AccommodationRequest, AmenityResponse } from "@/types/accommodation";

export default function NewAccommodationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<AccommodationRequest>({
    name: "",
    description: "",
    address: "",
    latitude: undefined,
    longitude: undefined,
    pricePerNight: 0,
  });

  // 이미지 관련 상태
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // 편의시설 관련 상태
  const [allAmenities, setAllAmenities] = useState<AmenityResponse[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [isAmenityLoading, setIsAmenityLoading] = useState(true);

  // 편의시설 목록 조회 (Hook을 조건문보다 먼저 호출)
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        setIsAmenityLoading(true);
        const response = await amenityApi.getAllAmenities();
        setAllAmenities(response.data);
      } catch (error) {
        console.error("편의시설 목록 조회 실패:", error);
      } finally {
        setIsAmenityLoading(false);
      }
    };

    if (user && user.role === "ADMIN") {
      fetchAmenities();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "숙소명을 입력해주세요.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "주소를 입력해주세요.";
    }

    if (formData.pricePerNight <= 0) {
      newErrors.pricePerNight = "올바른 가격을 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 숙소 등록
      const response = await accommodationApi.createAccommodation(formData);
      const newAccommodationId = response.data.id;

      // 2. 편의시설 연결
      if (selectedAmenities.length > 0) {
        try {
          await amenityApi.connectAmenitiesToAccommodation(newAccommodationId, {
            amenityIds: selectedAmenities,
          });
        } catch (amenityError) {
          console.error("편의시설 연결 실패:", amenityError);
          // 편의시설 연결 실패는 치명적이지 않으므로 계속 진행
        }
      }

      // 3. 이미지가 있으면 업로드
      if (selectedFiles.length > 0) {
        setIsUploadingImages(true);
        try {
          await accommodationApi.uploadAccommodationImages(
            newAccommodationId,
            selectedFiles
          );
          alert("숙소와 이미지가 성공적으로 등록되었습니다.");
        } catch (imageError) {
          console.error("이미지 업로드 실패:", imageError);
          alert(
            "숙소는 등록되었지만 이미지 업로드에 실패했습니다. 나중에 수정 페이지에서 이미지를 추가해주세요."
          );
        } finally {
          setIsUploadingImages(false);
        }
      } else {
        alert("숙소가 성공적으로 등록되었습니다.");
      }

      router.push("/admin/accommodations");
    } catch (error) {
      console.error("숙소 등록 실패:", error);
      alert("숙소 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));

    // 에러 메시지 제거
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    const invalidFiles = files.filter((file) => file.size > maxSize);
    if (invalidFiles.length > 0) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    // 이미지 파일 형식 검증
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const invalidTypes = files.filter(
      (file) => !validTypes.includes(file.type)
    );
    if (invalidTypes.length > 0) {
      alert("JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.");
      return;
    }

    setSelectedFiles(files);

    // 미리보기 URL 생성
    const urls = files.map((file) => URL.createObjectURL(file));
    // 기존 URL 해제
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(urls);
  };

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);

    // 제거되는 URL 해제
    URL.revokeObjectURL(previewUrls[index]);

    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  // 편의시설 선택/해제
  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin/accommodations"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← 숙소 관리로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">새 숙소 등록</h1>
          <p className="mt-2 text-gray-600">
            새로운 숙소 정보를 입력하고 등록하세요.
          </p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 숙소명 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                숙소명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="숙소 이름을 입력하세요"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 주소 */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="숙소 주소를 입력하세요"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* 설명 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                숙소 설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="숙소에 대한 상세 설명을 입력하세요"
              />
            </div>

            {/* 가격 */}
            <div>
              <label
                htmlFor="pricePerNight"
                className="block text-sm font-medium text-gray-700"
              >
                1박 요금 (원) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="pricePerNight"
                name="pricePerNight"
                value={formData.pricePerNight || ""}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.pricePerNight ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="예: 100000"
              />
              {errors.pricePerNight && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.pricePerNight}
                </p>
              )}
            </div>

            {/* 좌표 (선택사항) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latitude"
                  className="block text-sm font-medium text-gray-700"
                >
                  위도 (선택사항)
                </label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude || ""}
                  onChange={handleInputChange}
                  step="any"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 37.5665"
                />
              </div>
              <div>
                <label
                  htmlFor="longitude"
                  className="block text-sm font-medium text-gray-700"
                >
                  경도 (선택사항)
                </label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude || ""}
                  onChange={handleInputChange}
                  step="any"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 126.9780"
                />
              </div>
            </div>

            {/* 편의시설 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                편의시설 (선택사항)
              </label>
              {isAmenityLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    편의시설 목록 로딩 중...
                  </span>
                </div>
              ) : allAmenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allAmenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`amenity-${amenity.id}`}
                        checked={selectedAmenities.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`amenity-${amenity.id}`}
                        className="ml-2 flex items-center cursor-pointer"
                      >
                        {amenity.iconUrl ? (
                          <img
                            src={amenity.iconUrl}
                            alt={amenity.name}
                            className="w-5 h-5 object-cover rounded mr-2"
                          />
                        ) : (
                          <div className="w-5 h-5 bg-gray-200 rounded mr-2 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-gray-500"
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
                        <span className="text-sm text-gray-700">
                          {amenity.name}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">
                  등록된 편의시설이 없습니다.{" "}
                  <Link
                    href="/admin/amenities"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    편의시설 관리
                  </Link>
                  에서 먼저 편의시설을 등록해주세요.
                </p>
              )}
              {selectedAmenities.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {selectedAmenities.length}개의 편의시설이 선택되었습니다.
                </p>
              )}
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                숙소 이미지 (선택사항)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <svg
                    className="w-12 h-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      클릭하여 이미지 선택
                    </span>{" "}
                    또는 드래그 앤 드롭
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    최대 10MB, JPG/PNG/GIF 형식
                  </p>
                </label>
              </div>

              {/* 선택된 이미지 미리보기 */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    선택된 이미지 ({previewUrls.length}개)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`미리보기 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                            대표
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    첫 번째 이미지가 대표 이미지로 설정됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/accommodations"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImages}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting || isUploadingImages
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting
                  ? "숙소 등록 중..."
                  : isUploadingImages
                  ? "이미지 업로드 중..."
                  : "숙소 등록"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
