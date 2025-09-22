// backend/src/controllers/meetingRoom/meetingRoom.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { UserRole, BookingStatus } from "@prisma/client";

// Create a new meeting room
export const createMeetingRoom = async (req: Request, res: Response) => {
  try {
    const { name, capacity, description, location } = req.body;
    const meetingRoom = await prisma.meetingRoom.create({
      data: { name, capacity, description, location },
    });
    return res.status(201).json(meetingRoom);
  } catch (error: any) {
    if (error.code === "P2002") {
      // Prisma error for unique constraint failed
      return res
        .status(409)
        .json({ message: "Meeting room with this name already exists." });
    }
    return res.status(500).json({
      message: "Failed to create meeting room.",
      error: error.message,
    });
  }
};

// Get all meeting rooms
export const getAllMeetingRooms = async (req: Request, res: Response) => {
  try {
    // Menghapus 'isDeleted: false' karena properti ini tidak ada di model MeetingRoom
    const meetingRooms = await prisma.meetingRoom.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return res.status(200).json(meetingRooms);
  } catch (error: any) {
    console.error("Error fetching meeting rooms:", error);
    return res.status(500).json({
      message: "Gagal mengambil daftar ruang rapat.",
      error: error.message,
    });
  }
};

// Get a single meeting room by ID
export const getMeetingRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const meetingRoom = await prisma.meetingRoom.findUnique({
      where: { id },
    });
    if (!meetingRoom) {
      return res.status(404).json({ message: "Meeting room not found." });
    }
    return res.status(200).json(meetingRoom);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to get meeting room.", error: error.message });
  }
};

// Update a meeting room by ID
export const updateMeetingRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, description, location } = req.body;
    const meetingRoom = await prisma.meetingRoom.update({
      where: { id },
      data: { name, capacity, description, location },
    });
    return res.status(200).json(meetingRoom);
  } catch (error: any) {
    if (error.code === "P2025") {
      // Prisma error for record not found
      return res.status(404).json({ message: "Meeting room not found." });
    }
    if (error.code === "P2002") {
      // Prisma error for unique constraint failed
      return res
        .status(409)
        .json({ message: "Meeting room with this name already exists." });
    }
    return res.status(500).json({
      message: "Failed to update meeting room.",
      error: error.message,
    });
  }
};

// Delete a meeting room by ID
export const deleteMeetingRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.meetingRoom.delete({
      where: { id },
    });
    return res.status(204).end();
  } catch (error: any) {
    if (error.code === "P2025") {
      // Prisma error for record not found
      return res.status(404).json({ message: "Meeting room not found." });
    }
    return res.status(500).json({
      message: "Failed to delete meeting room.",
      error: error.message,
    });
  }
};

export const getMeetingRoomCalendar = async (req: Request, res: Response) => {
  try {
    const { meetingRoomId } = req.params;

    if (!meetingRoomId) {
      return res
        .status(400)
        .json({ message: "ID ruang rapat tidak ditemukan." });
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        isDeleted: false,
        meetingRoomId: meetingRoomId,
        overallStatus: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.APPROVED,
            BookingStatus.PARTIALLY_APPROVED,
          ],
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const calendarEvents = meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.agenda,
      start: `${meeting.startDate.toISOString().split("T")[0]}T${
        meeting.startTime
      }:00`,
      end: `${meeting.endDate.toISOString().split("T")[0]}T${
        meeting.endTime
      }:00`,
      status: meeting.overallStatus,
      userName: meeting.user?.fullName,
    }));

    return res.status(200).json(calendarEvents);
  } catch (error: any) {
    console.error("Error fetching meeting room calendar:", error);
    return res
      .status(500)
      .json({ message: "Gagal mengambil data kalender ruang rapat." });
  }
};
