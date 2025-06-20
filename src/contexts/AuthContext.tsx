"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthContextType, User, RegisterRequest } from "@/types/auth";
import { authApi } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 앱 시작 시 토큰 확인
    const token = localStorage.getItem("accessToken");
    if (token) {
      // TODO: 사용자 정보 가져오기 API 호출
      // 임시로 로그인 상태로 설정
      setUser({
        id: 1,
        email: "user@example.com",
        name: "사용자",
      });
    }
    setLoading(false);
  }, []);

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
