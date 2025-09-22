// backend/src/controllers/department/department.controller.ts
import { Request, Response } from "express";
import prisma from "../../utils/prisma";

// Create a new department
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const department = await prisma.department.create({
      data: { name },
    });
    return res.status(201).json(department);
  } catch (error: any) {
    if (error.code === "P2002") {
      // Prisma error for unique constraint failed
      return res
        .status(409)
        .json({ message: "Department with this name already exists." });
    }
    return res
      .status(500)
      .json({ message: "Failed to create department.", error: error.message });
  }
};

// Get all departments
export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany();
    return res.status(200).json(departments);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to get departments.", error: error.message });
  }
};

// Get a single department by ID
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      return res.status(404).json({ message: "Department not found." });
    }
    return res.status(200).json(department);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Failed to get department.", error: error.message });
  }
};

// Update a department by ID
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const department = await prisma.department.update({
      where: { id },
      data: { name },
    });
    return res.status(200).json(department);
  } catch (error: any) {
    if (error.code === "P2025") {
      // Prisma error for record not found
      return res.status(404).json({ message: "Department not found." });
    }
    if (error.code === "P2002") {
      // Prisma error for unique constraint failed
      return res
        .status(409)
        .json({ message: "Department with this name already exists." });
    }
    return res
      .status(500)
      .json({ message: "Failed to update department.", error: error.message });
  }
};

// Delete a department by ID
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({
      where: { id },
    });
    return res.status(204).end();
  } catch (error: any) {
    if (error.code === "P2025") {
      // Prisma error for record not found
      return res.status(404).json({ message: "Department not found." });
    }
    return res
      .status(500)
      .json({ message: "Failed to delete department.", error: error.message });
  }
};
