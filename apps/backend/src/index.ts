import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import meetingRoutes from './routes/meetings.routes';
import roomRoutes from './routes/rooms.routes';
import departmentRoutes from './routes/departments.routes';
import equipmentRoutes from './routes/equipment.routes';
import approvalRoutes from './routes/approvals.routes';
import approverRoutes from './routes/approvers.routes';
import historyRoutes from './routes/history.routes';
import publicRoutes from './routes/public.routes';

const app: ReturnType<typeof express> = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/approvers', approverRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/public', publicRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
});

export default app;
