import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'EMAIL' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  billId: mongoose.Types.ObjectId;
  paymentOccurrenceId: mongoose.Types.ObjectId;
  type: NotificationType;
  scheduledAt: Date;
  sentAt?: Date | null;
  status: NotificationStatus;
  retryCount: number;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    billId: {
      type: Schema.Types.ObjectId,
      ref: 'Bill',
      required: true,
    },
    paymentOccurrenceId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentOccurrence',
      required: true,
    },
    type: {
      type: String,
      enum: ['EMAIL', 'IN_APP'],
      default: 'EMAIL',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Idempotency constraint: Unique combination of user + payment occurrence + type
notificationSchema.index(
  { userId: 1, paymentOccurrenceId: 1, type: 1 },
  { unique: true }
);
notificationSchema.index({ status: 1, scheduledAt: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
