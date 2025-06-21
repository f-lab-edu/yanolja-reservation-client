"use client";

import { useState, useEffect } from "react";
import { roomOptionApi } from "@/lib/api";
import { RoomOption, RoomOptionRequest } from "@/types/room";

export default function RoomOptionsPage() {
  const [options, setOptions] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<RoomOption | null>(null);
  const [formData, setFormData] = useState<RoomOptionRequest>({
    name: "",
    price: 0,
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const response = await roomOptionApi.getAllRoomOptions();
      setOptions(response.data);
    } catch (err) {
      console.error("객실 옵션 목록 조회 실패:", err);
      setError(
        err instanceof Error
          ? err.message
          : "객실 옵션 목록을 불러올 수 없습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (option?: RoomOption) => {
    if (option) {
      setEditingOption(option);
      setFormData({
        name: option.name,
        price: option.price,
      });
    } else {
      setEditingOption(null);
      setFormData({
        name: "",
        price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOption(null);
    setFormData({
      name: "",
      price: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("옵션 이름을 입력해주세요.");
      return;
    }

    if (formData.price < 0) {
      alert("가격은 0원 이상이어야 합니다.");
      return;
    }

    try {
      if (editingOption) {
        await roomOptionApi.updateRoomOption(editingOption.id, formData);
        alert("객실 옵션이 수정되었습니다.");
      } else {
        await roomOptionApi.createRoomOption(formData);
        alert("객실 옵션이 등록되었습니다.");
      }

      handleCloseModal();
      fetchOptions();
    } catch (err) {
      console.error("객실 옵션 저장 실패:", err);
      alert(
        err instanceof Error ? err.message : "객실 옵션 저장에 실패했습니다."
      );
    }
  };

  const handleDelete = async (option: RoomOption) => {
    if (!confirm(`'${option.name}' 옵션을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await roomOptionApi.deleteRoomOption(option.id);
      alert("객실 옵션이 삭제되었습니다.");
      fetchOptions();
    } catch (err) {
      console.error("객실 옵션 삭제 실패:", err);
      alert(
        err instanceof Error ? err.message : "객실 옵션 삭제에 실패했습니다."
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">객실 옵션 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            오류 발생
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOptions}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">객실 옵션 관리</h1>
            <p className="mt-2 text-gray-600">
              객실에 추가할 수 있는 옵션을 관리합니다.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            새 옵션 등록
          </button>
        </div>

        {/* 옵션 목록 */}
        {options.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              등록된 옵션이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              새로운 객실 옵션을 등록해보세요.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              첫 번째 옵션 등록하기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">옵션 목록</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      옵션 이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      추가 가격
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {options.map((option) => (
                    <tr key={option.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {option.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₩{option.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleOpenModal(option)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(option)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingOption ? "옵션 수정" : "새 옵션 등록"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    옵션 이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 조식 서비스"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    추가 가격 (원) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25000"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingOption ? "수정" : "등록"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
