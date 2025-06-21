"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthContextType, User, RegisterRequest } from "@/types/auth";
import { authApi, cookieUtils } from "@/lib/api";

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
        // TODO: 사용자 정보 가져오기 API 호출
        // 임시로 로그인 상태로 설정
        setUser({
          id: 1,
          email: "user@example.com",
          name: "사용자",
        });
      }
    } catch (error) {
      console.error("인증 상태 확인 오류:", error);
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

        // TODO: 사용자 정보 가져오기
        // 임시로 사용자 설정
        setUser({
          id: 1,
          email,
          name: "사용자",
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("로그인 오류:", error);
      return false;
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
