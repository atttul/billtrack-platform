import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rateLimit.middleware.js';
import { sendSuccess } from './utils/response.utils.js';
import { NotFoundError } from './utils/errors.js';
import { getRedisConnection } from './config/redis.js';

import authRoutes from './modules/auth/auth.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import billRoutes from './modules/bills/bill.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

export const app = express();

// Security & Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all /api routes
app.use('/api', apiRateLimiter);

// OpenAPI Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let redisStatus = 'disconnected';

  if (env.NODE_ENV !== 'test') {
    try {
      const redis = getRedisConnection();
      const ping = await redis.ping();
      if (ping === 'PONG') redisStatus = 'connected';
    } catch {
      redisStatus = 'error';
    }
  } else {
    redisStatus = 'bypassed_in_test';
  }

  return sendSuccess(
    res,
    {
      status: 'ok',
      service: 'billtrack-backend',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: mongoStatus,
        redis: redisStatus,
      },
    },
    'Health check operational'
  );
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 Route Handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('Requested API endpoint does not exist'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);
