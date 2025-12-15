import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Helper function for formatted timestamp
const getTimestamp = (): string => {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Helper function for clean error logging
const logError = (
  level: 'ERROR' | 'WARN' | 'INFO',
  statusCode: number,
  message: string,
  req: Request,
  details?: string
) => {
  const timestamp = getTimestamp();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress || '-';

  console.log('');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🕐 ${timestamp}`);
  console.log(`${level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : 'ℹ️'} [${level}] ${statusCode} - ${message}`);
  console.log(`📍 ${method} ${path}`);
  console.log(`🌐 IP: ${ip}`);
  if (details) {
    console.log(`📝 Details: ${details}`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      logError('WARN', 409, 'Duplicate entry', req, `Field: ${err.meta?.target}`);
      return res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
        error: err.meta?.target,
      });
    }
    if (err.code === 'P2025') {
      logError('WARN', 404, 'Record not found', req);
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }
    // Other Prisma errors
    logError('ERROR', 500, `Database error [${err.code}]`, req, err.message);
    return res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }

  // Application errors (custom AppError)
  if (err instanceof AppError) {
    const level = err.statusCode >= 500 ? 'ERROR' : 'WARN';
    logError(level, err.statusCode, err.message, req);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Invalid credentials - common auth error
  if (err.message === 'Invalid credentials') {
    logError('WARN', 401, 'Login failed - Invalid credentials', req);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // User not found
  if (err.message === 'User not found') {
    logError('WARN', 404, 'User not found', req);
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Default/Unknown errors
  logError('ERROR', 500, 'Internal server error', req, err.message);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
