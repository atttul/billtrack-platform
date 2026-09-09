import { auditLogRepository, AuditLogRepository } from './auditLog.repository.js';
import { AuditAction } from './auditLog.model.js';
import { Types } from 'mongoose';
import { logger } from '../../config/logger.js';

export class AuditLogService {
  constructor(private repo: AuditLogRepository = auditLogRepository) {}

  async logEvent(
    userId: string | Types.ObjectId,
    entityType: 'BILL' | 'PAYMENT_OCCURRENCE' | 'CATEGORY' | 'USER',
    entityId: string | Types.ObjectId,
    action: AuditAction,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await this.repo.create({
        userId: new Types.ObjectId(userId),
        entityType,
        entityId: new Types.ObjectId(entityId),
        action,
        metadata,
      });
    } catch (error) {
      logger.error({ error, userId, action }, 'Failed to record audit log');
    }
  }
}

export const auditLogService = new AuditLogService();
