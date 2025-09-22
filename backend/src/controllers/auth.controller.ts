// backend/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { generateToken } from "../utils/jwt";
import { UserRole } from "@prisma/client";

// ===============================================
// REGISTER NEW USER
// ===============================================
export const register = async (req: Request, res: Response) => {
  // Tambahkan departmentId pada destructuring body request
  const { userId, email, password, fullName, role, departmentId } = req.body;

  if (!userId || !email || !password || !fullName) {
    return res.status(400).json({
      message:
        "Mohon lengkapi semua field yang diperlukan: User ID, Email, Password, Full Name.",
    });
  }

  let userRole: UserRole = UserRole.USER;
  if (role && Object.values(UserRole).includes(role.toUpperCase())) {
    userRole = role.toUpperCase() as UserRole;
  } else if (role) {
    return res.status(400).json({
      message: `Role '${role}' tidak valid. Role yang diizinkan: ${Object.values(
        UserRole
      ).join(", ")}`,
    });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ userId: userId }, { email: email }],
      },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User ID atau Email sudah terdaftar." });
    }

    const newUser = await prisma.user.create({
      data: {
        userId,
        email,
        password: password,
        fullName,
        role: userRole,
        departmentId,
      },
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: "Registrasi berhasil!", user: newUser });
  } catch (error: any) {
    console.error("Error during registration:", error);
    res.status(500).json({
      message: "Terjadi kesalahan server saat registrasi.",
      error: error.message,
    });
  }
};

// ===============================================
// LOGIN USER
// ===============================================
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password harus diisi." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    // Generate JWT Token
    const token = generateToken({
      id: user.id,
      role: user.role,
      departmentId: user.departmentId ?? undefined,
    });

    res.status(200).json({
      message: "Login berhasil!",
      token,
      user: {
        id: user.id,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Error during login:", error);
    res.status(500).json({
      message: "Terjadi kesalahan server saat login.",
      error: error.message,
    });
  }
};

// ===============================================
// LOGOUT USER
// ===============================================
export const logout = (req: Request, res: Response) => {
  res
    .status(200)
    .json({ message: "Logout berhasil (token harus dihapus di sisi klien)." });
};
