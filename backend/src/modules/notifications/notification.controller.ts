import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';
import { sendSuccess } from '../../utils/response.utils.js';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page, limit } = req.query as any;
      const result = await notificationService.getUserNotifications(userId, page, limit);
      sendSuccess(res, result.data, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
