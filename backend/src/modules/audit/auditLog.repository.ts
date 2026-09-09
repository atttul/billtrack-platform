import { AuditLog, IAuditLog, AuditAction } from './auditLog.model.js';
import { Types } from 'mongoose';

export class AuditLogRepository {
  async create(logData: Partial<IAuditLog>): Promise<IAuditLog> {
    const log = new AuditLog(logData);
    return log.save();
  }

  async findByUserId(userId: string | Types.ObjectId, limit: number = 50): Promise<IAuditLog[]> {
    return AuditLog.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

export const auditLogRepository = new AuditLogRepository();
