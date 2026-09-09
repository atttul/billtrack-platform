import { api } from './api';
import { PaymentOccurrence } from '../types/payment';
import { ApiResponseWrapper } from './auth.service';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const paymentService = {
  async getPaymentHistoryByBill(billId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<PaymentOccurrence>> {
    const res = (await api.get(`/bills/${billId}/payments?page=${page}&limit=${limit}`)) as unknown as ApiResponseWrapper<PaginatedResult<PaymentOccurrence>>;
    return res.data;
  },
};
