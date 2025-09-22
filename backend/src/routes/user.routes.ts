// backend/src/routes/user.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { getAllUsers, getUserProfile } from "../controllers/user.controller";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/all",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.HRGA_MANAGER]),
  getAllUsers
);
router.get("/profile", authenticate, getUserProfile);

export default router;
