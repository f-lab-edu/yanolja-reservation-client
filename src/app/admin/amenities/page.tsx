"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { amenityApi } from "@/lib/api";
import { AmenityResponse, AmenityRequest } from "@/types/accommodation";

export default function AdminAmenitiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [amenities, setAmenities] = useState<AmenityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityResponse | null>(
    null
  );
  const [formData, setFormData] = useState<AmenityRequest>({
    name: "",
    iconUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 파일 업로드 관련 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchAmenities();
    }
  }, [user]);

  // 모달이 열렸을 때 body 스크롤 방지 및 ESC 키 처리
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeModal();
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isModalOpen]);

  const fetchAmenities = async () => {
    try {
      setIsLoading(true);
      const response = await amenityApi.getAllAmenities();
      setAmenities(response.data);
    } catch (error) {
      console.error("편의시설 목록 조회 실패:", error);
      setError("편의시설 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingAmenity(null);
    setFormData({ name: "", iconUrl: "" });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (amenity: AmenityResponse) => {
    setIsEditing(true);
    setEditingAmenity(amenity);
    setFormData({ name: amenity.name, iconUrl: amenity.iconUrl || "" });
    setFormErrors({});
    setSelectedFile(null);
    setPreviewUrl(amenity.iconUrl || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingAmenity(null);
    setFormData({ name: "", iconUrl: "" });
    setFormErrors({});
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "편의시설 이름을 입력해주세요.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingAmenity) {
        await amenityApi.updateAmenity(editingAmenity.id, formData);
        alert("편의시설이 성공적으로 수정되었습니다.");
      } else {
        await amenityApi.createAmenity(formData);
        alert("편의시설이 성공적으로 등록되었습니다.");
      }

      await fetchAmenities();
      closeModal();
    } catch (error) {
      console.error("편의시설 저장 실패:", error);
      alert(`편의시설 ${isEditing ? "수정" : "등록"}에 실패했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (amenityId: number, amenityName: string) => {
    if (!confirm(`"${amenityName}" 편의시설을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await amenityApi.deleteAmenity(amenityId);
      alert("편의시설이 성공적으로 삭제되었습니다.");
      await fetchAmenities();
    } catch (error) {
      console.error("편의시설 삭제 실패:", error);
      alert("편의시설 삭제에 실패했습니다.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 에러 메시지 제거
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 형식 검증
      const validTypes = [
        "image/png",
        "image/jpg",
        "image/jpeg",
        "image/svg+xml",
      ];
      if (!validTypes.includes(file.type)) {
        alert("PNG, JPG, JPEG, SVG 파일만 업로드 가능합니다.");
        return;
      }

      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하만 가능합니다.");
        return;
      }

      setSelectedFile(file);

      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 기존 URL 입력 필드 클리어
      setFormData((prev) => ({ ...prev, iconUrl: "" }));
    }
  };

  const handleUploadIcon = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const response = await amenityApi.uploadAmenityIcon(selectedFile);
      const iconUrl = response.data;

      // 서버 URL을 절대 경로로 변환
      const fullIconUrl = iconUrl.startsWith("http")
        ? iconUrl
        : `http://localhost:8080${iconUrl}`;

      setFormData((prev) => ({ ...prev, iconUrl: fullIconUrl }));
      alert("아이콘이 성공적으로 업로드되었습니다.");
    } catch (error) {
      console.error("아이콘 업로드 실패:", error);
      alert("아이콘 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
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
              <h1 className="text-3xl font-bold text-gray-900">
                편의시설 관리
              </h1>
              <p className="mt-2 text-gray-600">
                숙소 편의시설을 등록하고 관리하세요.
              </p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openCreateModal();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              새 편의시설 등록
            </button>
          </div>
        </div>

        {/* 편의시설 목록 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                편의시설 목록을 불러오는 중...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fetchAmenities();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                다시 시도
              </button>
            </div>
          ) : amenities.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">등록된 편의시설이 없습니다.</p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openCreateModal();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                첫 번째 편의시설 등록하기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      아이콘
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {amenities.map((amenity) => (
                    <tr key={amenity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {amenity.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {amenity.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {amenity.iconUrl ? (
                          <img
                            src={amenity.iconUrl}
                            alt={amenity.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-gray-400"
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openEditModal(amenity);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            수정
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(amenity.id, amenity.name);
                            }}
                            className="text-red-600 hover:text-red-900"
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
          )}
        </div>
      </div>

      {/* 편의시설 등록/수정 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={closeModal}
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            {/* 배경 오버레이 */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

            {/* 모달 콘텐츠 */}
            <div
              className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {isEditing ? "편의시설 수정" : "새 편의시설 등록"}
                      </h3>

                      <div className="space-y-4">
                        {/* 편의시설 이름 */}
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            편의시설 이름{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors.name
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="예: 무료 Wi-Fi"
                          />
                          {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.name}
                            </p>
                          )}
                        </div>

                        {/* 아이콘 업로드/URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            아이콘 (선택사항)
                          </label>

                          {/* 업로드 방식과 URL 입력 방식 탭 */}
                          <div className="border border-gray-300 rounded-md p-4">
                            <div className="mb-4">
                              <div className="flex space-x-4 mb-3">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="iconMethod"
                                    value="upload"
                                    defaultChecked
                                    className="mr-2"
                                  />
                                  파일 업로드
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="iconMethod"
                                    value="url"
                                    className="mr-2"
                                  />
                                  URL 입력
                                </label>
                              </div>

                              {/* 파일 업로드 영역 */}
                              <div className="mb-3">
                                <input
                                  type="file"
                                  accept="image/png,image/jpg,image/jpeg,image/svg+xml"
                                  onChange={handleFileSelect}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, JPEG, SVG 파일 (최대 5MB)
                                </p>
                              </div>

                              {/* 업로드 버튼 */}
                              {selectedFile && (
                                <button
                                  type="button"
                                  onClick={handleUploadIcon}
                                  disabled={isUploading}
                                  className={`w-full mb-3 py-2 px-4 rounded-md text-sm font-medium ${
                                    isUploading
                                      ? "bg-gray-400 cursor-not-allowed text-white"
                                      : "bg-green-600 hover:bg-green-700 text-white"
                                  }`}
                                >
                                  {isUploading
                                    ? "업로드 중..."
                                    : "아이콘 업로드"}
                                </button>
                              )}

                              {/* URL 입력 필드 */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  또는 직접 URL 입력:
                                </label>
                                <input
                                  type="url"
                                  name="iconUrl"
                                  value={formData.iconUrl}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="https://example.com/icon.png"
                                />
                              </div>
                            </div>

                            {/* 미리보기 */}
                            {(previewUrl || formData.iconUrl) && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-600 mb-2">
                                  미리보기:
                                </p>
                                <img
                                  src={previewUrl || formData.iconUrl}
                                  alt="아이콘 미리보기"
                                  className="w-8 h-8 object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? "저장 중..." : isEditing ? "수정" : "등록"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      closeModal();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
