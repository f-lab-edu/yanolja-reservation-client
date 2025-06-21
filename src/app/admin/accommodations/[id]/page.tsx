"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { accommodationApi, amenityApi, getImageUrl } from "@/lib/api";
import {
  AccommodationRequest,
  AccommodationResponse,
  AccommodationImageResponse,
  AmenityResponse,
  AmenityConnectionRequest,
} from "@/types/accommodation";

export default function EditAccommodationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [accommodation, setAccommodation] =
    useState<AccommodationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [images, setImages] = useState<AccommodationImageResponse[]>([]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 편의시설 관련 상태
  const [allAmenities, setAllAmenities] = useState<AmenityResponse[]>([]);
  const [accommodationAmenities, setAccommodationAmenities] = useState<
    AmenityResponse[]
  >([]);
  const [isAmenityLoading, setIsAmenityLoading] = useState(false);

  const accommodationId = Number(params.id);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (accommodationId && user && user.role === "ADMIN") {
      fetchAccommodation();
      fetchImages();
      fetchAllAmenities();
      fetchAccommodationAmenities();
    }
  }, [accommodationId, user]);

  const fetchAccommodation = async () => {
    try {
      setIsLoading(true);
      const response = await accommodationApi.getAccommodationForAdmin(
        accommodationId
      );
      const data = response.data;
      setAccommodation(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        pricePerNight: data.pricePerNight,
      });
    } catch (error) {
      console.error("숙소 정보 조회 실패:", error);
      alert("숙소 정보를 불러오는데 실패했습니다.");
      router.push("/admin/accommodations");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      setIsImageLoading(true);
      const response = await accommodationApi.getAccommodationImages(
        accommodationId
      );
      setImages(response.data.images);
    } catch (error) {
      console.error("이미지 조회 실패:", error);
    } finally {
      setIsImageLoading(false);
    }
  };

  const fetchAllAmenities = async () => {
    try {
      const response = await amenityApi.getAllAmenities();
      setAllAmenities(response.data);
    } catch (error) {
      console.error("전체 편의시설 목록 조회 실패:", error);
    }
  };

  const fetchAccommodationAmenities = async () => {
    try {
      setIsAmenityLoading(true);
      const response = await amenityApi.getAccommodationAmenities(
        accommodationId
      );
      setAccommodationAmenities(response.data);
    } catch (error) {
      console.error("숙소 편의시설 조회 실패:", error);
    } finally {
      setIsAmenityLoading(false);
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

  const handleImageUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("업로드할 이미지를 선택해주세요.");
      return;
    }

    try {
      setIsImageLoading(true);
      setUploadProgress(0);

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await accommodationApi.uploadAccommodationImages(
        accommodationId,
        selectedFiles
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 이미지 목록 새로고침
      await fetchImages();

      // 선택된 파일과 미리보기 초기화
      setSelectedFiles([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setUploadProgress(0);

      alert("이미지가 성공적으로 업로드되었습니다.");
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
      setUploadProgress(0);
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    try {
      await accommodationApi.setMainImage(imageId);
      await fetchImages();
      alert("대표 이미지가 설정되었습니다.");
    } catch (error) {
      console.error("대표 이미지 설정 실패:", error);
      alert("대표 이미지 설정에 실패했습니다.");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      await accommodationApi.deleteAccommodationImage(imageId);
      await fetchImages();
      alert("이미지가 삭제되었습니다.");
    } catch (error) {
      console.error("이미지 삭제 실패:", error);
      alert("이미지 삭제에 실패했습니다.");
    }
  };

  const handleAddAmenity = async (amenityId: number) => {
    try {
      setIsAmenityLoading(true);
      const data: AmenityConnectionRequest = { amenityIds: [amenityId] };
      await amenityApi.connectAmenitiesToAccommodation(accommodationId, data);
      await fetchAccommodationAmenities();
      alert("편의시설이 추가되었습니다.");
    } catch (error) {
      console.error("편의시설 추가 실패:", error);
      alert("편의시설 추가에 실패했습니다.");
    } finally {
      setIsAmenityLoading(false);
    }
  };

  const handleRemoveAmenity = async (amenityId: number) => {
    if (!confirm("이 편의시설을 제거하시겠습니까?")) return;

    try {
      setIsAmenityLoading(true);
      await amenityApi.removeAmenityFromAccommodation(
        accommodationId,
        amenityId
      );
      await fetchAccommodationAmenities();
      alert("편의시설이 제거되었습니다.");
    } catch (error) {
      console.error("편의시설 제거 실패:", error);
      alert("편의시설 제거에 실패했습니다.");
    } finally {
      setIsAmenityLoading(false);
    }
  };

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
      await accommodationApi.updateAccommodation(accommodationId, formData);
      alert("숙소 정보가 성공적으로 수정되었습니다.");
      router.push("/admin/accommodations");
    } catch (error) {
      console.error("숙소 수정 실패:", error);
      alert("숙소 수정에 실패했습니다. 다시 시도해주세요.");
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

  if (!user || user.role !== "ADMIN" || !accommodation) {
    return null;
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                숙소 정보 수정
              </h1>
              <p className="mt-2 text-gray-600">
                숙소 정보를 수정하고 저장하세요.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">현재 상태:</span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  accommodation.status || "ACTIVE"
                )}`}
              >
                {getStatusText(accommodation.status || "ACTIVE")}
              </span>
            </div>
          </div>
        </div>

        {/* 숙소 기본 정보 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            현재 숙소 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">숙소 ID:</span>
              <span className="ml-2 text-gray-900">#{accommodation.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500">평점:</span>
              <span className="ml-2 text-gray-900">
                {accommodation.rating
                  ? `${accommodation.rating.toFixed(1)}점`
                  : "평점 없음"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500">리뷰 수:</span>
              <span className="ml-2 text-gray-900">
                {accommodation.reviewCount || 0}개
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500">등록된 객실:</span>
              <span className="ml-2 text-gray-900">
                {accommodation.rooms?.length || 0}개
              </span>
            </div>
          </div>
        </div>

        {/* 이미지 관리 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            이미지 관리
          </h2>

          {/* 이미지 업로드 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-700">
                이미지 업로드
              </h3>
              <div className="text-sm text-gray-500">
                최대 10MB, JPG/PNG/GIF 형식
              </div>
            </div>

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
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    클릭하여 이미지를 선택하거나 드래그하여 업로드
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    여러 파일을 동시에 선택할 수 있습니다
                  </p>
                </div>
              </label>
            </div>

            {/* 선택된 파일 미리보기 */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  선택된 파일 ({selectedFiles.length}개)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`미리보기 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {(selectedFiles[index].size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFiles([]);
                      previewUrls.forEach((url) => URL.revokeObjectURL(url));
                      setPreviewUrls([]);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    선택 취소
                  </button>
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isImageLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      isImageLoading
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isImageLoading ? "업로드 중..." : "업로드"}
                  </button>
                </div>

                {/* 업로드 진행률 */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress}% 완료
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 기존 이미지 목록 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-700">
                등록된 이미지 ({images.length}개)
              </h3>
              {isImageLoading && (
                <div className="text-sm text-gray-500">로딩 중...</div>
              )}
            </div>

            {images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 이미지가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt="숙소 이미지"
                      className="w-full h-48 object-cover rounded-lg"
                    />

                    {/* 대표 이미지 표시 */}
                    {image.isMain && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        대표 이미지
                      </div>
                    )}

                    {/* 액션 버튼들 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        {!image.isMain && (
                          <button
                            onClick={() => handleSetMainImage(image.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            대표 설정
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 편의시설 관리 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            편의시설 관리
          </h2>

          {/* 현재 연결된 편의시설 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">
              현재 편의시설 ({accommodationAmenities.length}개)
            </h3>
            {isAmenityLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : accommodationAmenities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                연결된 편의시설이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {accommodationAmenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center">
                      {amenity.iconUrl ? (
                        <img
                          src={amenity.iconUrl}
                          alt={amenity.name}
                          className="w-6 h-6 object-cover rounded mr-2"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-blue-200 rounded mr-2 flex items-center justify-center">
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
                      <span className="text-sm font-medium text-gray-900">
                        {amenity.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveAmenity(amenity.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-4 h-4"
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
                ))}
              </div>
            )}
          </div>

          {/* 편의시설 추가 */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">
              편의시설 추가
            </h3>
            {allAmenities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                등록된 편의시설이 없습니다.{" "}
                <Link
                  href="/admin/amenities"
                  className="text-blue-600 hover:text-blue-500"
                >
                  편의시설 관리 페이지
                </Link>
                에서 편의시설을 먼저 등록해주세요.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allAmenities
                  .filter(
                    (amenity) =>
                      !accommodationAmenities.some(
                        (acc) => acc.id === amenity.id
                      )
                  )
                  .map((amenity) => (
                    <button
                      key={amenity.id}
                      onClick={() => handleAddAmenity(amenity.id)}
                      className="flex items-center p-3 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                    >
                      {amenity.iconUrl ? (
                        <img
                          src={amenity.iconUrl}
                          alt={amenity.name}
                          className="w-6 h-6 object-cover rounded mr-2"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded mr-2 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {amenity.name}
                      </span>
                    </button>
                  ))}
              </div>
            )}
            {allAmenities.filter(
              (amenity) =>
                !accommodationAmenities.some((acc) => acc.id === amenity.id)
            ).length === 0 &&
              allAmenities.length > 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  모든 편의시설이 이미 연결되어 있습니다.
                </div>
              )}
          </div>
        </div>

        {/* 수정 폼 */}
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

            {/* 좌표 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latitude"
                  className="block text-sm font-medium text-gray-700"
                >
                  위도
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
                  경도
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
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "수정 중..." : "수정 저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
