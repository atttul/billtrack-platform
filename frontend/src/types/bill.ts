import { Category } from './category';

export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type BillStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface Bill {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  categoryId: Category;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  reminderDaysBefore: number;
  status: BillStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillPayload {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  categoryId: string;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  reminderDaysBefore?: number;
}

export interface UpdateBillPayload {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  categoryId?: string;
  frequency?: RecurrenceFrequency;
  nextDueDate?: string;
  reminderDaysBefore?: number;
}

export interface BillFilterQuery {
  status?: BillStatus;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
