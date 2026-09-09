import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PAID' | 'MISSED' | 'SKIPPED';

export interface IPaymentOccurrence extends Document {
  _id: mongoose.Types.ObjectId;
  billId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  dueDate: Date;
  amount: number;
  status: PaymentStatus;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentOccurrenceSchema = new Schema<IPaymentOccurrence>(
  {
    billId: {
      type: Schema.Types.ObjectId,
      ref: 'Bill',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be a non-negative number'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'MISSED', 'SKIPPED'],
      default: 'PENDING',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentOccurrenceSchema.index({ userId: 1, dueDate: 1 });
paymentOccurrenceSchema.index({ billId: 1, dueDate: 1 }, { unique: true });
paymentOccurrenceSchema.index({ status: 1, dueDate: 1 });

export const PaymentOccurrence = mongoose.model<IPaymentOccurrence>(
  'PaymentOccurrence',
  paymentOccurrenceSchema
);
