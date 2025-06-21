export interface UserInfoResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: "USER" | "ADMIN";
  socialProvider?: "GOOGLE" | "KAKAO" | null;
  profileImageUrl?: string;
}

export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  password?: string;
}

export interface UserProfile extends UserInfoResponse {
  // 추가 프로필 정보가 필요한 경우 여기에 추가
}

// 사용자 검색 조건 (관리자용)
export interface UserSearchCondition {
  name?: string;
  email?: string;
  role?: "USER" | "ADMIN";
  socialProvider?: "GOOGLE" | "KAKAO";
}
