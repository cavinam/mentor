import { Request } from "express";
import { UserRole } from "@prisma/client";

declare module "express" {
  export interface Request {
    user?: {
      id: string;
      role: UserRole;
      departmentId?: string; // Add departmentId to user object
    };
  }
}
