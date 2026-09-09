export type PaymentStatus = 'PENDING' | 'PAID' | 'MISSED' | 'SKIPPED';

export interface PaymentOccurrence {
  _id: string;
  billId: string;
  userId: string;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
