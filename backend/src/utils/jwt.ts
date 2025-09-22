// backend/src/utils/jwt.ts
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "GTIMBOOKING";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "1h";

interface TokenPayload {
  id: string;
  role: UserRole;
  departmentId?: string; // Add optional departmentId
}

export const generateToken = (payload: TokenPayload): string => {
  return (jwt.sign as any)(payload as object, JWT_SECRET_KEY, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = (jwt.verify as any)(token, JWT_SECRET_KEY) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};
