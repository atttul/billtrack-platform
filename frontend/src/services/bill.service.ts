import { api } from './api';
import { Bill, CreateBillPayload, UpdateBillPayload, BillFilterQuery } from '../types/bill';
import { PaymentOccurrence } from '../types/payment';
import { ApiResponseWrapper } from './auth.service';

export const billService = {
  async createBill(payload: CreateBillPayload): Promise<Bill> {
    const res = (await api.post('/bills', payload)) as unknown as ApiResponseWrapper<Bill>;
    return res.data;
  },

  async getBills(query: BillFilterQuery = {}): Promise<Bill[]> {
    const params = new URLSearchParams();
    if (query.status) params.append('status', query.status);
    if (query.categoryId) params.append('categoryId', query.categoryId);
    if (query.search) params.append('search', query.search);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());

    const res = (await api.get(`/bills?${params.toString()}`)) as unknown as ApiResponseWrapper<Bill[]>;
    return res.data;
  },

  async getBillById(id: string): Promise<Bill> {
    const res = (await api.get(`/bills/${id}`)) as unknown as ApiResponseWrapper<Bill>;
    return res.data;
  },

  async updateBill(id: string, payload: UpdateBillPayload): Promise<Bill> {
    const res = (await api.patch(`/bills/${id}`, payload)) as unknown as ApiResponseWrapper<Bill>;
    return res.data;
  },

  async pauseBill(id: string): Promise<Bill> {
    const res = (await api.post(`/bills/${id}/pause`)) as unknown as ApiResponseWrapper<Bill>;
    return res.data;
  },

  async resumeBill(id: string): Promise<Bill> {
    const res = (await api.post(`/bills/${id}/resume`)) as unknown as ApiResponseWrapper<Bill>;
    return res.data;
  },

  async cancelBill(id: string): Promise<Bill> {
    const res = (await api.delete(`/bills/${id}`)) as unknown as ApiResponseWrapper<Bill>;
    return res.data;
  },

  async markPaid(id: string): Promise<PaymentOccurrence> {
    const res = (await api.post(`/bills/${id}/pay`)) as unknown as ApiResponseWrapper<PaymentOccurrence>;
    return res.data;
  },

  async skipPayment(id: string): Promise<PaymentOccurrence> {
    const res = (await api.post(`/bills/${id}/skip`)) as unknown as ApiResponseWrapper<PaymentOccurrence>;
    return res.data;
  },
};
