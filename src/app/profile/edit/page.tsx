"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/lib/api";
import { UserInfoResponse, UserUpdateRequest } from "@/types/user";

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<UserUpdateRequest>({
    name: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserInfo();
    }
  }, [user]);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = user?.id
        ? await userApi.getUserInfo(user.id)
        : await userApi.getCurrentUser();
      const data = response.data;
      setUserInfo(data);
      setFormData({
        name: data.name,
        phone: data.phone || "",
        password: "",
      });
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      alert("사용자 정보를 불러오는데 실패했습니다.");
      router.push("/profile");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phoneNumber;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    if (formData.phone && formData.phone.length > 0) {
      const phoneRegex = /^010-\d{4}-\d{4}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "올바른 전화번호 형식이 아닙니다. (010-0000-0000)";
      }
    }

    if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 8) {
        newErrors.password = "비밀번호는 8자리 이상이어야 합니다.";
      } else if (
        !/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
          formData.password
        )
      ) {
        newErrors.password =
          "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !userInfo) {
      return;
    }

    // 변경사항이 없으면 제출하지 않음
    if (!hasChanges) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 빈 값은 제외하고 전송
      const updateData: UserUpdateRequest = {};
      if (formData.name && formData.name !== userInfo.name) {
        updateData.name = formData.name;
      }
      if (formData.phone && formData.phone !== userInfo.phone) {
        updateData.phone = formData.phone;
      }
      if (formData.password && formData.password.length > 0) {
        updateData.password = formData.password;
      }

      await userApi.updateUser(userInfo.id, updateData);
      alert("프로필이 성공적으로 수정되었습니다.");
      router.push("/profile");
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      alert("프로필 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    // 전화번호 자동 포맷팅
    if (name === "phone") {
      processedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // 변경사항 감지
    if (userInfo) {
      const originalValue =
        name === "password" ? "" : (userInfo as any)[name] || "";
      setHasChanges(
        processedValue !== originalValue ||
          Object.keys(formData).some(
            (key) =>
              key !== name &&
              (formData as any)[key] !==
                (key === "password" ? "" : (userInfo as any)[key] || "")
          )
      );
    }

    // 에러 메시지 제거
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getSocialProviderName = (provider: string | null | undefined) => {
    switch (provider) {
      case "GOOGLE":
        return "구글";
      case "KAKAO":
        return "카카오";
      default:
        return "일반 회원가입";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            ← 프로필로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">프로필 수정</h1>
          <p className="mt-2 text-gray-600">개인정보를 수정하고 저장하세요.</p>
        </div>

        {/* 현재 정보 표시 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            현재 계정 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">이메일:</span>
              <span className="ml-2 text-gray-900">{userInfo.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500">계정 유형:</span>
              <span className="ml-2 text-gray-900">
                {getSocialProviderName(userInfo.socialProvider)}
              </span>
            </div>
          </div>
          {userInfo.socialProvider && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>알림:</strong> 소셜 로그인 계정의 경우 이메일은 변경할
                수 없습니다.
                {userInfo.socialProvider &&
                  " 또한 비밀번호 변경 시 소셜 로그인 대신 이메일/비밀번호 로그인을 사용해야 합니다."}
              </p>
            </div>
          )}
        </div>

        {/* 수정 폼 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이름 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="이름을 입력하세요"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                전화번호
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="010-0000-0000"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                새 비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="변경하려면 새 비밀번호를 입력하세요"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                비밀번호는 8자리 이상, 영문/숫자/특수문자를 포함해야 합니다.
              </p>
            </div>

            {/* 변경사항 알림 */}
            {hasChanges && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  변경된 내용이 있습니다. 저장하시겠습니까?
                </p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/profile"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !hasChanges}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting || !hasChanges
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "저장 중..." : "변경사항 저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
