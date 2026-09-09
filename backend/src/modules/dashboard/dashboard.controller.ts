import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.utils.js';

export class DashboardController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await dashboardService.getDashboardSummary(userId);
      sendSuccess(res, data, 'Dashboard overview retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
