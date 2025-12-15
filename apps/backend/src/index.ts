import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

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

// CORS allowed origins
const allowedOrigins = [
  // Domain without dash (gtim.local)
  'http://mentor.gtim.local:8080',
  'https://mentor.gtim.local:8080',
  'http://mentor.gtim.local',
  'https://mentor.gtim.local',
  // Domain with dash (g-tim.local)
  'http://mentor.g-tim.local:8080',
  'https://mentor.g-tim.local:8080',
  'http://mentor.g-tim.local:3000',
  'https://mentor.g-tim.local:3000',
  'http://mentor.g-tim.local',
  'https://mentor.g-tim.local',
];

// Generate IP range origins
const ipRanges = [
  { base: '192.168.100', start: 1, end: 255 },
  { base: '192.168.50', start: 1, end: 255 },
  { base: '192.168.55', start: 1, end: 255 },
  { base: '192.168.60', start: 1, end: 255 },
  { base: '192.168.65', start: 1, end: 255 },
];

ipRanges.forEach(range => {
  for (let i = range.start; i <= range.end; i++) {
    allowedOrigins.push(`http://${range.base}.${i}:8080`);
    allowedOrigins.push(`http://${range.base}.${i}`);
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Request logging

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
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🚀 MENTOR BACKEND SERVER                          ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║  📡 Port:        ${String(config.port).padEnd(50)}║`);
  console.log(`║  🌍 Environment: ${config.nodeEnv.padEnd(50)}║`);
  console.log(`║  🔗 Frontend:    ${config.frontendUrl.padEnd(50)}║`);
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║  🕐 Started at:  ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).padEnd(50)}║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log('');
});

export default app;
