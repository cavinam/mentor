// backend/src/controllers/user.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Informasi user yang sudah diautentikasi ada di req.user
    console.log("User accessing getAllUsers:", req.user);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Gagal mengambil data pengguna.",
      error: error.message,
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    // req.user.id berasal dari token JWT yang sudah diverifikasi
    const userIdFromToken = req.user?.id;

    if (!userIdFromToken) {
      return res
        .status(403)
        .json({ message: "Informasi pengguna tidak ditemukan di token." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdFromToken },
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    res.status(200).json(user);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      message: "Gagal mengambil profil pengguna.",
      error: error.message,
    });
  }
};
