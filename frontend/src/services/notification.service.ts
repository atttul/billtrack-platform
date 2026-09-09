import { api } from './api';
import { Notification } from '../types/notification';
import { ApiResponseWrapper } from './auth.service';

export const notificationService = {
  async getNotifications(page: number = 1, limit: number = 20): Promise<Notification[]> {
    const res = (await api.get(`/notifications?page=${page}&limit=${limit}`)) as unknown as ApiResponseWrapper<Notification[]>;
    return res.data;
  },
};
