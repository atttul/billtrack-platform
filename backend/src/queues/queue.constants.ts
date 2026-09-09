export const REMINDER_QUEUE_NAME = 'reminder-queue';
export const NOTIFICATION_QUEUE_NAME = 'notification-queue';

export interface ReminderJobPayload {
  userId: string;
  billId: string;
  paymentOccurrenceId: string;
}

export interface NotificationJobPayload {
  notificationId: string;
}
