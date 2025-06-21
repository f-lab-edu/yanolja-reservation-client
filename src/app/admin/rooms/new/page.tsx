"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { roomApi, accommodationApi, roomOptionApi } from "@/lib/api";
import { RoomRequest, RoomOption } from "@/types/room";
import { AccommodationListResponse } from "@/types/accommodation";

export default function NewRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accommodations, setAccommodations] = useState<
    AccommodationListResponse[]
  >([]);
  const [availableOptions, setAvailableOptions] = useState<RoomOption[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState<RoomRequest>({
    accommodationId: 0,
    name: "",
    description: "",
    capacity: 1,
    pricePerNight: 0,
    optionIds: [],
  });
  const [errors, setErrors] = useState<Partial<RoomRequest>>({});

  useEffect(() => {
    fetchAccommodations();
    fetchRoomOptions();
  }, []);

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const fetchAccommodations = async () => {
    try {
      const response = await accommodationApi.getAllAccommodations();
      setAccommodations(response.data);
    } catch (err) {
      console.error("숙소 목록 조회 실패:", err);
    }
  };

  const fetchRoomOptions = async () => {
    try {
      const response = await roomOptionApi.getAllRoomOptions();
      setAvailableOptions(response.data);
    } catch (err) {
      console.error("객실 옵션 목록 조회 실패:", err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RoomRequest> = {};

    if (!formData.accommodationId) {
      newErrors.accommodationId = 0;
    }
    if (!formData.name.trim()) {
      newErrors.name = "객실 이름을 입력해주세요.";
    }
    if (!formData.description.trim()) {
      newErrors.description = "객실 설명을 입력해주세요.";
    }
    if (formData.capacity < 1) {
      newErrors.capacity = 1;
    }
    if (formData.pricePerNight < 0) {
      newErrors.pricePerNight = 0;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // 먼저 객실을 생성
      const roomResponse = await roomApi.createRoom(formData);
      const roomId = roomResponse.data.id;

      // 이미지가 선택된 경우 업로드
      if (selectedImages.length > 0) {
        try {
          await roomApi.uploadRoomImages(roomId, selectedImages, 0); // 첫 번째 이미지를 대표 이미지로
        } catch (imageErr) {
          console.error("이미지 업로드 실패:", imageErr);
          alert("객실은 등록되었지만 이미지 업로드에 실패했습니다.");
        }
      }

      alert("객실이 성공적으로 등록되었습니다.");
      router.push("/admin/rooms");
    } catch (err) {
      console.error("객실 등록 실패:", err);
      alert(err instanceof Error ? err.message : "객실 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "accommodationId" ||
        name === "capacity" ||
        name === "pricePerNight"
          ? Number(value)
          : value,
    }));
  };

  const handleOptionToggle = (optionId: number) => {
    setFormData((prev) => ({
      ...prev,
      optionIds: prev.optionIds?.includes(optionId)
        ? prev.optionIds.filter((id) => id !== optionId)
        : [...(prev.optionIds || []), optionId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">새 객실 등록</h1>
          <p className="mt-2 text-gray-600">새로운 객실 정보를 입력해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              기본 정보
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {/* 숙소 선택 */}
              <div>
                <label
                  htmlFor="accommodationId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  숙소 선택 *
                </label>
                <select
                  id="accommodationId"
                  name="accommodationId"
                  value={formData.accommodationId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>숙소를 선택해주세요</option>
                  {accommodations.map((accommodation) => (
                    <option key={accommodation.id} value={accommodation.id}>
                      {accommodation.name}
                    </option>
                  ))}
                </select>
                {errors.accommodationId !== undefined && (
                  <p className="mt-1 text-sm text-red-600">
                    숙소를 선택해주세요.
                  </p>
                )}
              </div>

              {/* 객실 이름 */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  객실 이름 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 디럭스 더블룸"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* 객실 설명 */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  객실 설명 *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="객실에 대한 자세한 설명을 입력해주세요."
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* 수용 인원 및 가격 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="capacity"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    수용 인원 *
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600">
                      수용 인원은 1명 이상이어야 합니다.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pricePerNight"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    1박 가격 (원) *
                  </label>
                  <input
                    type="number"
                    id="pricePerNight"
                    name="pricePerNight"
                    value={formData.pricePerNight}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100000"
                    required
                  />
                  {errors.pricePerNight && (
                    <p className="mt-1 text-sm text-red-600">
                      가격은 0원 이상이어야 합니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 객실 옵션 선택 */}
          {availableOptions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                객실 옵션
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableOptions.map((option) => (
                  <div key={option.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`option-${option.id}`}
                      checked={formData.optionIds?.includes(option.id) || false}
                      onChange={() => handleOptionToggle(option.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`option-${option.id}`}
                      className="ml-3 text-sm text-gray-700"
                    >
                      {option.name}
                      <span className="text-gray-500 ml-2">
                        (+₩{option.price.toLocaleString()})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이미지 업로드 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              객실 이미지
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 업로드 (선택사항)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setSelectedImages(files);

                  // 미리보기 URL 생성
                  const previewUrls = files.map((file) =>
                    URL.createObjectURL(file)
                  );
                  setImagePreviewUrls(previewUrls);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                여러 이미지를 선택할 수 있습니다. 첫 번째 이미지가 대표 이미지로
                설정됩니다.
              </p>

              {/* 이미지 미리보기 */}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    선택된 이미지 미리보기
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={url}
                            alt={`미리보기 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            대표
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = selectedImages.filter(
                              (_, i) => i !== index
                            );
                            const newUrls = imagePreviewUrls.filter(
                              (_, i) => i !== index
                            );
                            setSelectedImages(newFiles);
                            setImagePreviewUrls(newUrls);
                            URL.revokeObjectURL(url); // 메모리 정리
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

          {/* 버튼 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "등록 중..." : "객실 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
