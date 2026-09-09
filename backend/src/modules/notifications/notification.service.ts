import { notificationRepository, NotificationRepository } from './notification.repository.js';
import { parsePaginationParams, formatPaginatedResult } from '../../utils/pagination.utils.js';

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository = notificationRepository) {}

  async getUserNotifications(userId: string, page?: string | number, limit?: string | number) {
    const params = parsePaginationParams(page, limit);
    const { data, total } = await this.notificationRepo.findByUserId(
      userId,
      params.limit,
      params.skip
    );
    return formatPaginatedResult(data, total, params);
  }
}

export const notificationService = new NotificationService();
