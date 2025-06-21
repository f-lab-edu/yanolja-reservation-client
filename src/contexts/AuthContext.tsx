"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthContextType, User, RegisterRequest } from "@/types/auth";
import { authApi, cookieUtils, userApi } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 앱 시작 시 토큰 확인
    checkAuthStatus();
  }, []);

  const fetchUserInfo = async (token: string): Promise<User | null> => {
    try {
      const response = await userApi.getCurrentUser();
      const userData = response.data;

      // 백엔드의 UserInfoResponse를 프론트엔드의 User 타입으로 변환
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        nickname: undefined, // 백엔드에 nickname 필드가 없음
        profileImage: userData.profileImageUrl,
        role: userData.role === "ADMIN" ? "ADMIN" : "USER",
      };
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      return null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      // 먼저 localStorage에서 토큰 확인
      let accessToken = localStorage.getItem("accessToken");
      let refreshToken = localStorage.getItem("refreshToken");

      // localStorage에 토큰이 없으면 쿠키에서 확인 (OAuth2 로그인 후)
      if (!accessToken) {
        const cookieAccessToken = cookieUtils.getCookie("access_token");
        const cookieRefreshToken = cookieUtils.getCookie("refresh_token");

        if (cookieAccessToken && cookieRefreshToken) {
          // 쿠키에서 토큰을 localStorage로 이동
          localStorage.setItem("accessToken", cookieAccessToken);
          localStorage.setItem("refreshToken", cookieRefreshToken);

          // 쿠키에서 토큰 삭제
          cookieUtils.deleteCookie("access_token");
          cookieUtils.deleteCookie("refresh_token");

          accessToken = cookieAccessToken;
          refreshToken = cookieRefreshToken;
        }
      }

      if (accessToken) {
        // 실제 사용자 정보 가져오기
        const userData = await fetchUserInfo(accessToken);
        if (userData) {
          setUser(userData);
        } else {
          // 사용자 정보를 가져올 수 없으면 토큰 삭제
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
    } catch (error) {
      console.error("인증 상태 확인 오류:", error);
      // 에러 발생 시 토큰 정리
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authApi.login({ email, password });

      if (response.success) {
        // 토큰 저장
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // 실제 사용자 정보 가져오기
        const userData = await fetchUserInfo(response.data.accessToken);
        if (userData) {
          setUser(userData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("로그인 오류:", error);
      // 에러를 그대로 다시 던져서 컴포넌트에서 구체적인 처리가 가능하도록 함
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData: RegisterRequest): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authApi.register(registerData);

      if (response.success) {
        // 회원가입 성공
        return true;
      }
      return false;
    } catch (error) {
      console.error("회원가입 오류:", error);
      // 에러를 그대로 다시 던져서 컴포넌트에서 구체적인 처리가 가능하도록 함
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error("로그아웃 오류:", error);
    } finally {
      // 로컬 상태 정리
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // 쿠키도 정리 (혹시 남아있을 수 있는 토큰들)
      cookieUtils.deleteCookie("access_token");
      cookieUtils.deleteCookie("refresh_token");

      setUser(null);
    }
  };

  const value: AuthContextType = {
    isAuthenticated: !!user,
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
