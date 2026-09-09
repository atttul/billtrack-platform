export type NotificationType = 'EMAIL' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  _id: string;
  userId: string;
  billId: {
    _id: string;
    name: string;
    amount: number;
    currency: string;
  };
  paymentOccurrenceId: string;
  type: NotificationType;
  scheduledAt: string;
  sentAt?: string | null;
  status: NotificationStatus;
  retryCount: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}
