import { Worker, Job } from 'bullmq';
import { getRedisOptions } from '../config/redis.js';
import { env } from '../config/env.js';
import { NOTIFICATION_QUEUE_NAME, NotificationJobPayload } from '../queues/queue.constants.js';
import { notificationRepository } from '../modules/notifications/notification.repository.js';
import { userRepository } from '../modules/users/user.repository.js';
import { billRepository } from '../modules/bills/bill.repository.js';
import { paymentOccurrenceRepository } from '../modules/payments/paymentOccurrence.repository.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../config/logger.js';

export function startNotificationWorker(): Worker<NotificationJobPayload> | null {
  if (env.NODE_ENV === 'test') {
    return null;
  }

  const worker = new Worker<NotificationJobPayload>(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job<NotificationJobPayload>) => {
      const { notificationId } = job.data;
      logger.info({ jobId: job.id, notificationId }, 'Processing notification job');

      const notification = await notificationRepository.findById(notificationId);
      if (!notification || notification.status === 'SENT') {
        logger.info({ notificationId }, 'Notification not found or already sent');
        return;
      }

      const [user, bill, occurrence] = await Promise.all([
        userRepository.findById(notification.userId),
        billRepository.findById(notification.billId),
        paymentOccurrenceRepository.findById(notification.paymentOccurrenceId),
      ]);

      if (!user || !bill || !occurrence) {
        logger.warn(
          { notificationId, userFound: !!user, billFound: !!bill, occurrenceFound: !!occurrence },
          'Missing entity data for notification. Marking FAILED.'
        );
        await notificationRepository.updateStatus(notificationId, 'FAILED', null, 'Missing entity dependencies');
        return;
      }

      try {
        await emailService.sendReminderEmail({
          toEmail: user.email,
          userName: user.name,
          billName: bill.name,
          amount: occurrence.amount,
          currency: bill.currency,
          dueDate: occurrence.dueDate,
        });

        await notificationRepository.updateStatus(notificationId, 'SENT', new Date(), null);
        logger.info({ notificationId, recipient: user.email }, 'Notification delivered successfully');
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown email delivery error';
        await notificationRepository.updateStatus(notificationId, 'FAILED', null, errorMsg);
        logger.error({ notificationId, error: errorMsg }, 'Notification dispatch failed');
        throw error; // Rethrow to trigger BullMQ exponential backoff retry
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
    logger.info({ jobId: job.id }, 'Notification worker completed job');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Notification worker job failed');
  });

  logger.info('🚀 Notification Worker started');
  return worker;
}
