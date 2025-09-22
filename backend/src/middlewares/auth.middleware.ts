// backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { UserRole } from "@prisma/client";

// Middleware untuk memeriksa dan memverifikasi JWT
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Akses ditolak. Token tidak ditemukan." });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res
      .status(403)
      .json({ message: "Token tidak valid atau kadaluarsa." });
  }

  // Fix: Use correct property name for departmentId in token payload
  let departmentId =
    (decoded as any).departmentId || (decoded as any).userDepartmentId;

  // If departmentId is missing in token, fetch from DB as fallback
  if (!departmentId) {
    try {
      const prismaModule = await import("../utils/prisma");
      const prisma = prismaModule.default;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { departmentId: true },
      });
      departmentId = user?.departmentId;
    } catch (error) {
      console.error("Failed to fetch user departmentId:", error);
    }
  }

  req.user = {
    id: decoded.id,
    role: decoded.role as UserRole,
    departmentId: departmentId, // Add departmentId from token payload or DB
  };

  next();
};

// Middleware untuk memeriksa peran pengguna (otorisasi)
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Akses ditolak. Peran "${req.user?.role}" tidak diizinkan untuk operasi ini.`,
      });
    }

    next();
  };
};
