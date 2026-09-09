import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { closeRedisConnection } from './config/redis.js';
import { startReminderWorker } from './workers/reminder.worker.js';
import { startNotificationWorker } from './workers/notification.worker.js';
import { startScheduler } from './jobs/scheduler.js';
import { logger } from './config/logger.js';
import http from 'http';

let server: http.Server;
let reminderWorker: any = null;
let notificationWorker: any = null;
let schedulerTimer: any = null;

async function bootstrap() {
  try {
    // 1. Connect to MongoDB Atlas (billtrack_db)
    await connectDatabase();

    // 2. Start Background Workers and Scheduler if not in test mode
    if (env.NODE_ENV !== 'test') {
      reminderWorker = startReminderWorker();
      notificationWorker = startNotificationWorker();
      schedulerTimer = startScheduler();
    }

    // 3. Start Express HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 BillTrack Backend API server listening on port [${env.PORT}] in [${env.NODE_ENV}] mode`
      );
      logger.info(`📚 Swagger Documentation UI: http://localhost:${env.PORT}/api/docs`);
    });
  } catch (error) {
    logger.error({ error }, '❌ Bootstrap startup failure');
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`⚠️ Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
    });
  }

  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    logger.info('Scheduler stopped.');
  }

  if (reminderWorker) {
    await reminderWorker.close();
    logger.info('Reminder worker closed.');
  }

  if (notificationWorker) {
    await notificationWorker.close();
    logger.info('Notification worker closed.');
  }

  await closeRedisConnection();
  await disconnectDatabase();

  logger.info('👋 Graceful shutdown complete. Exiting.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap();
