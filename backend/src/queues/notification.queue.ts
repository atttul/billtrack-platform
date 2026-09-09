import { Queue } from 'bullmq';
import { getRedisOptions } from '../config/redis.js';
import { env } from '../config/env.js';
import { NOTIFICATION_QUEUE_NAME, NotificationJobPayload } from './queue.constants.js';
import { logger } from '../config/logger.js';

let notificationQueue: Queue<NotificationJobPayload> | null = null;

export function getNotificationQueue(): Queue<NotificationJobPayload> | null {
  if (env.NODE_ENV === 'test') {
    return null;
  }

  if (!notificationQueue) {
    try {
      notificationQueue = new Queue<NotificationJobPayload>(NOTIFICATION_QUEUE_NAME, {
        connection: {
          url: env.REDIS_URL,
          ...getRedisOptions(),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 min, 2 min, 4 min
          },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      });
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize notification queue');
    }
  }

  return notificationQueue;
}

export async function enqueueNotificationJob(notificationId: string): Promise<void> {
  const queue = getNotificationQueue();
  if (!queue) return;

  const jobId = `notification:${notificationId}`;

  try {
    await queue.add('send-notification', { notificationId }, { jobId });
    logger.info({ jobId }, 'Enqueued notification job');
  } catch (error) {
    logger.warn({ error, jobId }, 'Failed to enqueue notification job');
  }
}
