import mongoose, { Schema, Document } from 'mongoose';

export type AuditAction =
  | 'BILL_CREATED'
  | 'BILL_UPDATED'
  | 'BILL_PAUSED'
  | 'BILL_RESUMED'
  | 'BILL_CANCELLED'
  | 'PAYMENT_MARKED_PAID'
  | 'PAYMENT_SKIPPED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_DELETED';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  entityType: 'BILL' | 'PAYMENT_OCCURRENCE' | 'CATEGORY' | 'USER';
  entityId: mongoose.Types.ObjectId;
  action: AuditAction;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['BILL', 'PAYMENT_OCCURRENCE', 'CATEGORY', 'USER'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
