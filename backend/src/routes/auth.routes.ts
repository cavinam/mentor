// backend/src/routes/auth.routes.ts
import { Router } from "express";
import { register, login, logout } from "../controllers/auth.controller";
import { hashPassword } from "../middlewares/hashPassword.middleware";

const router = Router();

router.post("/register", hashPassword, register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
