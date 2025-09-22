// backend/src/routes/department.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "@prisma/client";
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department/department.controller";

const router = Router();

// Endpoint yang dilindungi: hanya admin yang bisa CRUD
router.post("/", authenticate, authorize([UserRole.ADMIN]), createDepartment);
router.get(
  "/",
  authenticate,
  authorize([
    UserRole.ADMIN,
    UserRole.USER,
    UserRole.SECTION_HEAD,
    UserRole.HRGA_MANAGER,
  ]),
  getAllDepartments
);
router.get(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  getDepartmentById
);
router.put("/:id", authenticate, authorize([UserRole.ADMIN]), updateDepartment);
router.delete(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  deleteDepartment
);

export default router;
