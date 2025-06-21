"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { roomApi, accommodationApi, roomOptionApi } from "@/lib/api";
import { RoomRequest, RoomResponse, RoomOption, RoomImage } from "@/types/room";
import { AccommodationListResponse } from "@/types/accommodation";
import { getImageUrl } from "@/lib/api";

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [accommodations, setAccommodations] = useState<
    AccommodationListResponse[]
  >([]);
  const [availableOptions, setAvailableOptions] = useState<RoomOption[]>([]);
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [images, setImages] = useState<RoomImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);
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
    if (roomId) {
      fetchRoomData();
      fetchAccommodations();
      fetchRoomOptions();
    }
  }, [roomId]);

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      newImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviewUrls]);

  const fetchRoomData = async () => {
    try {
      const [roomResponse, imagesResponse] = await Promise.all([
        roomApi.getRoomById(roomId),
        roomApi.getRoomImages(roomId),
      ]);

      const roomData = roomResponse.data;
      setRoom(roomData);
      setImages(imagesResponse.data.images);

      setFormData({
        accommodationId: roomData.accommodationId,
        name: roomData.name,
        description: roomData.description,
        capacity: roomData.capacity,
        pricePerNight: roomData.pricePerNight,
        optionIds: roomData.options.map((option) => option.id),
      });
    } catch (err) {
      console.error("객실 정보 조회 실패:", err);
      alert("객실 정보를 불러올 수 없습니다.");
      router.push("/admin/rooms");
    } finally {
      setInitialLoading(false);
    }
  };

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
      await roomApi.updateRoom(roomId, formData);
      alert("객실 정보가 성공적으로 수정되었습니다.");
      router.push("/admin/rooms");
    } catch (err) {
      console.error("객실 수정 실패:", err);
      alert(err instanceof Error ? err.message : "객실 수정에 실패했습니다.");
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewImageFiles(files);

    // 기존 미리보기 URL 정리
    newImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

    // 새 미리보기 URL 생성
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviewUrls(previewUrls);
  };

  const handleImageUpload = async () => {
    if (newImageFiles.length === 0) return;

    try {
      await roomApi.uploadRoomImages(roomId, newImageFiles);
      // 이미지 목록 새로고침
      const imagesResponse = await roomApi.getRoomImages(roomId);
      setImages(imagesResponse.data.images);

      // 선택된 파일들과 미리보기 정리
      setNewImageFiles([]);
      newImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setNewImagePreviewUrls([]);

      alert("이미지가 성공적으로 업로드되었습니다.");
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert(
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다."
      );
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    try {
      await roomApi.setRoomMainImage(imageId);
      // 이미지 목록 새로고침
      const imagesResponse = await roomApi.getRoomImages(roomId);
      setImages(imagesResponse.data.images);
      alert("대표 이미지가 변경되었습니다.");
    } catch (err) {
      console.error("대표 이미지 설정 실패:", err);
      alert(
        err instanceof Error ? err.message : "대표 이미지 설정에 실패했습니다."
      );
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      await roomApi.deleteRoomImage(imageId);
      // 이미지 목록 새로고침
      const imagesResponse = await roomApi.getRoomImages(roomId);
      setImages(imagesResponse.data.images);
      alert("이미지가 삭제되었습니다.");
    } catch (err) {
      console.error("이미지 삭제 실패:", err);
      alert(err instanceof Error ? err.message : "이미지 삭제에 실패했습니다.");
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">객실 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            객실을 찾을 수 없습니다
          </h2>
          <button
            onClick={() => router.push("/admin/rooms")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            객실 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">객실 수정</h1>
          <p className="mt-2 text-gray-600">{room.name}의 정보를 수정합니다.</p>
        </div>

        <div className="space-y-6">
          {/* 객실 정보 수정 폼 */}
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
                        checked={
                          formData.optionIds?.includes(option.id) || false
                        }
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

            {/* 버튼 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push("/admin/rooms")}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "수정 중..." : "객실 수정"}
              </button>
            </div>
          </form>

          {/* 객실 이미지 관리 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              객실 이미지
            </h2>

            {/* 이미지 업로드 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 이미지 업로드
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        업로드
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewImageFiles([]);
                          newImagePreviewUrls.forEach((url) =>
                            URL.revokeObjectURL(url)
                          );
                          setNewImagePreviewUrls([]);
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    {newImagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={url}
                            alt={`새 이미지 미리보기 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            첫번째
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = newImageFiles.filter(
                              (_, i) => i !== index
                            );
                            const newUrls = newImagePreviewUrls.filter(
                              (_, i) => i !== index
                            );
                            setNewImageFiles(newFiles);
                            setNewImagePreviewUrls(newUrls);
                            URL.revokeObjectURL(url);
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

            {/* 현재 이미지 목록 */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt="객실 이미지"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {image.isMain && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        대표
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {!image.isMain && (
                        <button
                          onClick={() => handleSetMainImage(image.id)}
                          className="bg-white text-gray-600 p-1 rounded text-xs hover:bg-gray-100"
                          title="대표 이미지로 설정"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="bg-white text-red-600 p-1 rounded text-xs hover:bg-gray-100"
                        title="삭제"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                등록된 이미지가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
