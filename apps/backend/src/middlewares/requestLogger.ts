import { Request, Response, NextFunction } from 'express';

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

// Status code color emoji
const getStatusEmoji = (statusCode: number): string => {
    if (statusCode >= 500) return '🔴';
    if (statusCode >= 400) return '🟠';
    if (statusCode >= 300) return '🔵';
    if (statusCode >= 200) return '🟢';
    return '⚪';
};

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const timestamp = getTimestamp();
        const method = req.method;
        const path = req.originalUrl || req.url;
        const statusCode = res.statusCode;
        const ip = req.ip || req.socket.remoteAddress || '-';
        const emoji = getStatusEmoji(statusCode);

        // Only log API requests, skip static files
        if (path.startsWith('/api') || path === '/health') {
            console.log(
                `${emoji} [${timestamp}] ${method.padEnd(7)} ${statusCode} ${path} - ${duration}ms (${ip})`
            );
        }
    });

    next();
};
