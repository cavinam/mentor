import { body } from 'express-validator';

// Auth validators
export const loginSchema = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

// User validators
export const createUserSchema = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('role')
    .isIn(['ADMIN', 'SECTION_HEAD', 'HRGA_MANAGER', 'USER'])
    .withMessage('Invalid role'),
  body('departmentId').optional().isUUID().withMessage('Invalid department ID'),
];

export const updateUserSchema = [
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'SECTION_HEAD', 'HRGA_MANAGER', 'USER'])
    .withMessage('Invalid role'),
  body('departmentId').optional().isUUID().withMessage('Invalid department ID'),
];

// Department validators
export const createDepartmentSchema = [
  body('name').notEmpty().withMessage('Department name is required'),
];

export const updateDepartmentSchema = [
  body('name').optional().notEmpty().withMessage('Department name cannot be empty'),
];

// Room validators
export const createRoomSchema = [
  body('name').notEmpty().withMessage('Room name is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('description').optional().isString(),
];

export const updateRoomSchema = [
  body('name').optional().notEmpty().withMessage('Room name cannot be empty'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  body('description').optional().isString(),
];

// Equipment validators
export const createEquipmentSchema = [
  body('name').notEmpty().withMessage('Equipment name is required'),
  body('description').optional().isString(),
];

export const updateEquipmentSchema = [
  body('name').optional().notEmpty().withMessage('Equipment name cannot be empty'),
  body('description').optional().isString(),
];

// Meeting validators
export const createMeetingSchema = [
  body('agenda').notEmpty().withMessage('Agenda is required'),
  body('gtimName').optional().isString(),
  body('visitorName').optional().isString(),
  body('companyName').optional().isString(),
  body('startDate').isISO8601().withMessage('Invalid start date format'),
  body('endDate').isISO8601().withMessage('Invalid end date format'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('allDay').isBoolean().withMessage('All day must be boolean'),
  body('request').optional().isString(),
  body('isGenbaVisit').isBoolean().withMessage('Is genba visit must be boolean'),
  body('meetingRoomId').optional().isUUID().withMessage('Invalid meeting room ID'),
  body('equipments').optional().isArray(),
  body('equipments.*.equipmentId').isUUID().withMessage('Invalid equipment ID'),
  body('equipments.*.quantity').isInt({ min: 1 }).withMessage('Equipment quantity must be at least 1'),
];

export const updateMeetingSchema = [
  body('agenda').optional().notEmpty().withMessage('Agenda cannot be empty'),
  body('gtimName').optional().isString(),
  body('visitorName').optional().isString(),
  body('companyName').optional().isString(),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  body('startTime').optional().notEmpty().withMessage('Start time cannot be empty'),
  body('endTime').optional().notEmpty().withMessage('End time cannot be empty'),
  body('allDay').optional().isBoolean().withMessage('All day must be boolean'),
  body('request').optional().isString(),
  body('isGenbaVisit').optional().isBoolean().withMessage('Is genba visit must be boolean'),
  body('meetingRoomId').optional().isUUID().withMessage('Invalid meeting room ID'),
];

// Approval validators
export const approveActionSchema = [
  body('remark').optional().isString().withMessage('Remark must be a string'),
];

export const rejectActionSchema = [
  body('remark').notEmpty().withMessage('Remark is required for rejection'),
];
