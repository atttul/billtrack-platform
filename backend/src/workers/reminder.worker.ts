import { Worker, Job } from 'bullmq';
import { getRedisOptions } from '../config/redis.js';
import { env } from '../config/env.js';
import { REMINDER_QUEUE_NAME, ReminderJobPayload } from '../queues/queue.constants.js';
import { paymentOccurrenceRepository } from '../modules/payments/paymentOccurrence.repository.js';
import { billRepository } from '../modules/bills/bill.repository.js';
import { notificationRepository } from '../modules/notifications/notification.repository.js';
import { enqueueNotificationJob } from '../queues/notification.queue.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';

export function startReminderWorker(): Worker<ReminderJobPayload> | null {
  if (env.NODE_ENV === 'test') {
    return null;
  }

  const worker = new Worker<ReminderJobPayload>(
    REMINDER_QUEUE_NAME,
    async (job: Job<ReminderJobPayload>) => {
      const { userId, billId, paymentOccurrenceId } = job.data;
      logger.info({ jobId: job.id, paymentOccurrenceId }, 'Processing reminder job');

      // 1. Fetch PaymentOccurrence and Bill
      const occurrence = await paymentOccurrenceRepository.findById(paymentOccurrenceId);
      if (!occurrence || occurrence.status !== 'PENDING') {
        logger.info({ paymentOccurrenceId }, 'Occurrence is not pending. Skipping reminder.');
        return;
      }

      const bill = await billRepository.findById(billId);
      if (!bill || bill.status !== 'ACTIVE') {
        logger.info({ billId }, 'Bill is not active. Skipping reminder.');
        return;
      }

      // 2. Check for existing notification (Idempotency Guard)
      let notification = await notificationRepository.findExistingNotification(
        userId,
        paymentOccurrenceId,
        'EMAIL'
      );

      if (!notification) {
        try {
          notification = await notificationRepository.create({
            userId: new Types.ObjectId(userId),
            billId: new Types.ObjectId(billId),
            paymentOccurrenceId: new Types.ObjectId(paymentOccurrenceId),
            type: 'EMAIL',
            scheduledAt: new Date(),
            status: 'PENDING',
          });
        } catch (err: any) {
          // If duplicate key error due to race condition, retrieve existing
          if (err.code === 11000) {
            notification = await notificationRepository.findExistingNotification(
              userId,
              paymentOccurrenceId,
              'EMAIL'
            );
          } else {
            throw err;
          }
        }
      }

      if (notification && notification.status !== 'SENT') {
        // 3. Enqueue to Notification Queue
        await enqueueNotificationJob(notification._id.toString());
      }
    },
    {
      connection: {
        url: env.REDIS_URL,
        ...getRedisOptions(),
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Reminder worker completed job');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Reminder worker job failed');
  });

  logger.info('🚀 Reminder Worker started');
  return worker;
}
