// backend/src/middlewares/hashPassword.middleware.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

// Middleware untuk mengenkripsi password
export const hashPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pastikan req.body.password ada sebelum mencoba mengenkripsi
    if (!req.body.password) {
      return res.status(400).json({
        message: "Gagal memproses password.",
        error: "Password tidak ditemukan di body request.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    next();
  } catch (error: any) {
    console.error("Error hashing password:", error);
    return res.status(500).json({
      message: "Gagal memproses password.",
      error: error.message,
    });
  }
};
