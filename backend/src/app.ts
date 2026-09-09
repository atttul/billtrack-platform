import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
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

// 1. CORS Configuration (Must be FIRST before any other middleware)
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : ['*'];

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    if (!requestOrigin) {
      return callback(null, true);
    }

    const cleanOrigin = requestOrigin.replace(/\/$/, '');

    if (env.CORS_ORIGIN === '*' || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    if (/^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// 2. Security & Parsing Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Database Connection Middleware (ensures Mongoose is connected on Serverless requests)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  if (env.NODE_ENV !== 'test') {
    try {
      await connectDatabase();
    } catch {
      // Continue to next so errorHandler catches it cleanly
    }
  }
  next();
});

// 4. Rate Limiting Middleware
app.use('/api', apiRateLimiter);

// 5. OpenAPI Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 6. Health Check Endpoint
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

// 7. API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 8. 404 Route Handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('Requested API endpoint does not exist'));
});

// 9. Centralized Error Handling Middleware
app.use(errorHandler);
