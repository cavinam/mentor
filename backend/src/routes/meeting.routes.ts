// backend/src/routes/meeting.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "@prisma/client";
import {
  approveOrRejectMeeting,
  createMeeting,
  getAllMeetings,
  getMyMeetings,
  getMeetingById,
  getPendingApprovals,
  cancelMeeting,
  updateMeeting,
  forceUpdateMeetingStatus,
  getCalendarEvents, // Pastikan fungsi ini diimpor
} from "../controllers/meeting/meeting.controller";

const router = Router();

router.get(
  "/calendar",
  authenticate,
  authorize([
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
    UserRole.ADMIN,
  ]),
  getCalendarEvents
);

// Urutan router sangat penting!
// Endpoint POST untuk membuat booking meeting
router.post(
  "/",
  authenticate,
  authorize([
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
    UserRole.ADMIN,
  ]),
  createMeeting
);

// Endpoint GET untuk mendapatkan semua booking
router.get(
  "/",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SECTION_HEAD, UserRole.HRGA_MANAGER]),
  getAllMeetings
);

// Endpoint GET untuk meeting yang butuh persetujuan
// INI HARUS DI ATAS ENDPOINT DENGAN PARAMETER :ID
router.get(
  "/pending-approvals",
  authenticate,
  authorize([UserRole.SECTION_HEAD, UserRole.HRGA_MANAGER, UserRole.ADMIN]),
  getPendingApprovals
);

// Endpoint GET untuk daftar booking milik user yang login
router.get(
  "/mine",
  authenticate,
  authorize([
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
    UserRole.ADMIN,
  ]),
  getMyMeetings
);

// Endpoint GET untuk mendapatkan detail satu booking berdasarkan ID
// Ini adalah endpoint paling umum, letakkan di bagian bawah
router.get(
  "/:id",
  authenticate,
  authorize([
    UserRole.ADMIN,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
    UserRole.USER,
  ]),
  getMeetingById
);

// Approve Meeting
router.patch(
  "/:id/approve",
  authenticate,
  authorize([UserRole.SECTION_HEAD, UserRole.HRGA_MANAGER, UserRole.ADMIN]),
  approveOrRejectMeeting
);

// Cancel meeting
router.patch(
  "/:id/cancel",
  authenticate,
  authorize([
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
    UserRole.ADMIN,
  ]),
  cancelMeeting
);

// Update Meeting
router.patch(
  "/:meetingId",
  authenticate,
  authorize([
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
    UserRole.ADMIN,
  ]),
  updateMeeting
);

// Admin Update Meeting
router.patch(
  "/:id/force-status",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.HRGA_MANAGER]),
  forceUpdateMeetingStatus
);

export default router;
