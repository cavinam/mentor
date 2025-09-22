// backend/src/routes/equipment.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "@prisma/client";
import {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  getEquipmentAvailability,
} from "../controllers/equipment.controller";

const router = Router();

// Endpoint yang dilindungi: hanya admin yang bisa CRUD
router.post("/", authenticate, authorize([UserRole.ADMIN]), createEquipment);
router.get(
  "/",
  authenticate,
  authorize([
    UserRole.ADMIN,
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
  ]),
  getAllEquipment
);

// Equipment availability for a given time range
router.get(
  "/availability",
  authenticate,
  authorize([
    UserRole.ADMIN,
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
  ]),
  getEquipmentAvailability
);

router.get("/:id", authenticate, authorize([UserRole.ADMIN]), getEquipmentById);
router.put("/:id", authenticate, authorize([UserRole.ADMIN]), updateEquipment);
router.delete(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  deleteEquipment
);

export default router;
