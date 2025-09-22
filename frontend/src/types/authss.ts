// src/types/auth.ts
import { ReactNode } from "react";

export interface AuthContextType {
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
  user?: { id: string; role: string };
}

export interface AuthProviderProps {
  children: ReactNode;
}
