// backend/src/controllers/equipment/equipment.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { BookingStatus } from "@prisma/client";

// Create a new equipment
export const createEquipment = async (req: Request, res: Response) => {
  try {
    const { name, type, quantity, description } = req.body;
    const equipment = await prisma.equipment.create({
      data: { name, type, quantity, description },
    });
    return res.status(201).json(equipment);
  } catch (error: any) {
    if (error.code === "P2002") {
      // Prisma error for unique constraint failed
      return res
        .status(409)
        .json({ message: "Equipment with this name already exists." });
    }
    return res
      .status(500)
      .json({ message: "Failed to create equipment.", error: error.message });
  }
};

// Get all equipment
export const getAllEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await prisma.equipment.findMany();
    return res.status(200).json(equipment);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to get equipment.", error: error.message });
  }
};

// Get a single equipment by ID
export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const equipment = await prisma.equipment.findUnique({
      where: { id },
    });
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found." });
    }
    return res.status(200).json(equipment);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to get equipment.", error: error.message });
  }
};

// Update an equipment by ID
export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, quantity, description } = req.body;
    const equipment = await prisma.equipment.update({
      where: { id },
      data: { name, type, quantity, description },
    });
    return res.status(200).json(equipment);
  } catch (error: any) {
    if (error.code === "P2025") {
      // Prisma error for record not found
      return res.status(404).json({ message: "Equipment not found." });
    }
    if (error.code === "P2002") {
      // Prisma error for unique constraint failed
      return res
        .status(409)
        .json({ message: "Equipment with this name already exists." });
    }
    return res
      .status(500)
      .json({ message: "Failed to update equipment.", error: error.message });
  }
};

// Delete an equipment by ID
export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.equipment.delete({
      where: { id },
    });
    return res.status(204).end();
  } catch (error: any) {
    if (error.code === "P2025") {
      // Prisma error for record not found
      return res.status(404).json({ message: "Equipment not found." });
    }
    return res
      .status(500)
      .json({ message: "Failed to delete equipment.", error: error.message });
  }
};

// Get availability of all equipment for a given time range
export const getEquipmentAvailability = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, startTime, endTime, excludeMeetingId } =
      req.query as {
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
        excludeMeetingId?: string;
      };

    if (!startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        message:
          "startDate, endDate, startTime, endTime are required (YYYY-MM-DD and HH:mm or HH:mm:ss)",
      });
    }

    const toHHmmss = (t: string) => (t.length === 5 ? `${t}:00` : t);

    const checkStartDate = new Date(startDate);
    const checkEndDate = new Date(endDate);
    const checkStartTime = toHHmmss(startTime);
    const checkEndTime = toHHmmss(endTime);

    // All equipment with total stock
    const equipmentList = await prisma.equipment.findMany({
      select: { id: true, name: true, quantity: true },
    });

    // Booked quantities for overlapping meetings (excluding the current one if provided)
    const overlapping = await prisma.meetingEquipment.findMany({
      where: {
        meeting: {
          isDeleted: false,
          ...(excludeMeetingId ? { NOT: { id: excludeMeetingId } } : {}),
          overallStatus: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.APPROVED,
              BookingStatus.PARTIALLY_APPROVED,
            ],
          },
          AND: [
            { startDate: { lte: checkEndDate } },
            { endDate: { gte: checkStartDate } },
            {
              OR: [
                {
                  startTime: { lte: checkEndTime },
                  endTime: { gte: checkStartTime },
                },
                {
                  startTime: { gte: checkStartTime },
                  endTime: { lte: checkEndTime },
                },
              ],
            },
          ],
        },
      },
      select: {
        equipmentId: true,
        quantity: true,
      },
    });

    const bookedMap = new Map<string, number>();
    overlapping.forEach((row) => {
      bookedMap.set(
        row.equipmentId,
        (bookedMap.get(row.equipmentId) || 0) + row.quantity
      );
    });

    const result = equipmentList.map((eq) => {
      const booked = bookedMap.get(eq.id) || 0;
      const remaining = Math.max(0, eq.quantity - booked);
      return {
        id: eq.id,
        name: eq.name,
        total: eq.quantity,
        booked,
        remaining,
        unavailable: remaining <= 0,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error computing equipment availability:", error);
    return res.status(500).json({
      message: "Failed to compute equipment availability.",
      error: error.message,
    });
  }
};
