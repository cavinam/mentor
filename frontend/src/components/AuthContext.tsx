"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken, removeToken } from "../lib/auth";
import { AuthContextType, AuthProviderProps } from "@/types/authss";

interface AuthContextWithReadyState extends AuthContextType {
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextWithReadyState | undefined>(
  undefined
);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false); // State baru
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsLoggedIn(true);
    }
    setIsAuthReady(true); // Set state menjadi true setelah selesai memeriksa token
  }, []);

  const login = (token: string) => {
    setToken(token);
    setIsLoggedIn(true);
    router.push("/");
  };

  const logout = () => {
    removeToken();
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
