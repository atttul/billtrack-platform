import { Queue } from 'bullmq';
import { getRedisOptions } from '../config/redis.js';
import { env } from '../config/env.js';
import { REMINDER_QUEUE_NAME, ReminderJobPayload } from './queue.constants.js';
import { logger } from '../config/logger.js';

let reminderQueue: Queue<ReminderJobPayload> | null = null;

export function getReminderQueue(): Queue<ReminderJobPayload> | null {
  if (env.NODE_ENV === 'test') {
    return null;
  }

  if (!reminderQueue) {
    try {
      reminderQueue = new Queue<ReminderJobPayload>(REMINDER_QUEUE_NAME, {
        connection: {
          url: env.REDIS_URL,
          ...getRedisOptions(),
        },
        defaultJobOptions: {
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      });
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize reminder queue');
    }
  }

  return reminderQueue;
}

export async function scheduleReminderJob(
  payload: ReminderJobPayload,
  delayMs: number
): Promise<void> {
  const queue = getReminderQueue();
  if (!queue) return;

  const jobId = `reminder:${payload.paymentOccurrenceId}`;

  try {
    // Remove any previous job with same ID if present
    const existing = await queue.getJob(jobId);
    if (existing) {
      await existing.remove();
    }

    await queue.add('process-reminder', payload, {
      jobId,
      delay: Math.max(0, delayMs),
    });

    logger.info({ jobId, delayMs }, 'Scheduled reminder job');
  } catch (error) {
    logger.warn({ error, jobId }, 'Failed to schedule reminder job in Redis BullMQ');
  }
}
