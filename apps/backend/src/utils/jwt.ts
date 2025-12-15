import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwtSecret) as JWTPayload;
};

