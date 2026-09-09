import { paymentOccurrenceRepository } from '../modules/payments/paymentOccurrence.repository.js';
import { normalizeToStartOfDay, calculateReminderDate } from '../utils/date.utils.js';
import { PaymentOccurrence } from '../modules/payments/paymentOccurrence.model.js';
import { Bill } from '../modules/bills/bill.model.js';
import { notificationRepository } from '../modules/notifications/notification.repository.js';
import { enqueueNotificationJob } from '../queues/notification.queue.js';
import { logger } from '../config/logger.js';
import { Types } from 'mongoose';

export async function markOverduePaymentsAsMissed(): Promise<number> {
  const startOfToday = normalizeToStartOfDay(new Date());

  try {
    const overdueOccurrences = await paymentOccurrenceRepository.findOverduePending(startOfToday);
    let count = 0;

    for (const occurrence of overdueOccurrences) {
      occurrence.status = 'MISSED';
      await occurrence.save();
      count++;
    }

    if (count > 0) {
      logger.info({ count }, 'Marked overdue payment occurrences as MISSED');
    }
    return count;
  } catch (error) {
    logger.error({ error }, 'Error executing markOverduePaymentsAsMissed job');
    return 0;
  }
}

export async function reconcileUpcomingReminders(): Promise<number> {
  const now = new Date();

  try {
    // Find all pending payment occurrences
    const pendingOccurrences = await PaymentOccurrence.find({ status: 'PENDING' })
      .populate('billId', 'status reminderDaysBefore')
      .exec();

    let queuedCount = 0;

    for (const occ of pendingOccurrences) {
      const bill: any = occ.billId;
      if (!bill || bill.status !== 'ACTIVE') continue;

      const reminderDaysBefore = bill.reminderDaysBefore ?? 3;
      const reminderDate = calculateReminderDate(occ.dueDate, reminderDaysBefore);

      // Check if reminder threshold is reached or passed
      if (now >= reminderDate) {
        let notification = await notificationRepository.findExistingNotification(
          occ.userId,
          occ._id,
          'EMAIL'
        );

        if (!notification) {
          try {
            notification = await notificationRepository.create({
              userId: occ.userId,
              billId: bill._id,
              paymentOccurrenceId: occ._id,
              type: 'EMAIL',
              scheduledAt: new Date(),
              status: 'PENDING',
            });
          } catch (err: any) {
            if (err.code === 11000) {
              notification = await notificationRepository.findExistingNotification(
                occ.userId,
                occ._id,
                'EMAIL'
              );
            }
          }
        }

        if (notification && notification.status === 'PENDING') {
          await enqueueNotificationJob(notification._id.toString());
          queuedCount++;
        }
      }
    }

    if (queuedCount > 0) {
      logger.info({ queuedCount }, 'Reconciled and enqueued upcoming reminders');
    }
    return queuedCount;
  } catch (error) {
    logger.error({ error }, 'Error executing reconcileUpcomingReminders job');
    return 0;
  }
}

export function startScheduler(intervalMs: number = 24 * 60 * 60 * 1000): NodeJS.Timeout {
  logger.info('⏰ Scheduler service initialized');

  // Run initial sweep
  runSchedulerTasks();

  // Schedule recurring sweep
  return setInterval(() => {
    runSchedulerTasks();
  }, intervalMs);
}

async function runSchedulerTasks(): Promise<void> {
  logger.info('🔄 Running scheduled maintenance tasks');
  await markOverduePaymentsAsMissed();
  await reconcileUpcomingReminders();
}
