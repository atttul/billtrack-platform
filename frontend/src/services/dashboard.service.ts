import { api } from './api';
import { DashboardSummary } from '../types/dashboard';
import { ApiResponseWrapper } from './auth.service';

export const dashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = (await api.get('/dashboard')) as unknown as ApiResponseWrapper<DashboardSummary>;
    return res.data;
  },
};
