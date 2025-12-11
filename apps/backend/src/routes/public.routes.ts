import { Router, Request, Response } from 'express';
import { meetingService } from '../services/meeting.service';
import { roomService } from '../services/room.service';

const router = Router();

// GET /api/public/today-bookings - Get today's bookings (no auth required)
router.get('/today-bookings', async (_req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const result = await meetingService.getAll({
            page: 1,
            limit: 100,
            startDate: today,
            endDate: today,
        });

        // Filter out CANCELED and REJECTED bookings
        const filteredData = result.data.filter(
            (booking: { overallStatus: string }) =>
                booking.overallStatus !== 'CANCELED' &&
                booking.overallStatus !== 'REJECTED'
        );

        res.json({
            success: true,
            data: filteredData,
        });
    } catch (error) {
        throw error;
    }
});

// GET /api/public/check-room-availability - Check all rooms availability (no auth required)
router.get('/check-room-availability', async (req: Request, res: Response) => {
    try {
        const { date, startTime, endTime } = req.query;

        if (!date || !startTime || !endTime) {
            res.status(400).json({
                success: false,
                message: 'Missing required parameters: date, startTime, endTime',
            });
            return;
        }

        const result = await roomService.checkAllAvailability({
            date: date as string,
            startTime: startTime as string,
            endTime: endTime as string,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        throw error;
    }
});

export default router;
