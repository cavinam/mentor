// backend/src/routes/meetingRoom.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "@prisma/client";
import {
  createMeetingRoom,
  getAllMeetingRooms,
  getMeetingRoomById,
  updateMeetingRoom,
  deleteMeetingRoom,
} from "../controllers/meetingRoom.controller";

const router = Router();

// Endpoint yang dilindungi: hanya admin yang bisa CRUD
router.post("/", authenticate, authorize([UserRole.ADMIN]), createMeetingRoom);
router.get(
  "/",
  authenticate,
  authorize([
    UserRole.ADMIN,
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
  ]),
  getAllMeetingRooms
);
router.get(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  getMeetingRoomById
);
router.put(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  updateMeetingRoom
);
router.delete(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  deleteMeetingRoom
);

export default router;
