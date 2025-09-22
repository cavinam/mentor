// backend/src/index.ts
/// <reference path="./types/express.d.ts" />

import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import prisma from "./utils/prisma";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import meetingRoomRoutes from "./routes/meetingRoom.routes";
import departmentRoutes from "./routes/department.routes";
import equipmentRoutes from "./routes/equipment.routes";
import meetingRoutes from "./routes/meeting.routes";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/meeting-rooms", meetingRoomRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send(
    "Halo dari Express.js Backend (TypeScript)! Aplikasi Booking Meeting Room."
  );
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
  console.log(
    `Terhubung ke database di: ${
      process.env.DATABASE_URL?.split("@")[1].split("?")[0]
    }`
  );
  console.log(`Endpoint autentikasi: http://localhost:${PORT}/api/auth`);
  console.log(`Endpoint pengguna: http://localhost:${PORT}/api/users`);
});
