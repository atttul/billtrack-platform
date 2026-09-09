import mongoose, { Schema, Document } from 'mongoose';
import { RecurrenceFrequency } from '../../utils/date.utils.js';

export type BillStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface IBill extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  categoryId: mongoose.Types.ObjectId;
  frequency: RecurrenceFrequency;
  nextDueDate: Date;
  reminderDaysBefore: number;
  status: BillStatus;
  createdAt: Date;
  updatedAt: Date;
}

const billSchema = new Schema<IBill>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Bill name is required'],
      trim: true,
      maxlength: [100, 'Bill name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    frequency: {
      type: String,
      enum: ['WEEKLY', 'MONTHLY', 'YEARLY'],
      required: [true, 'Recurrence frequency is required'],
    },
    nextDueDate: {
      type: Date,
      required: [true, 'Next due date is required'],
    },
    reminderDaysBefore: {
      type: Number,
      default: 3,
      min: [0, 'Reminder days before cannot be negative'],
      max: [30, 'Reminder days before cannot exceed 30 days'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
billSchema.index({ userId: 1, status: 1 });

export const Bill = mongoose.model<IBill>('Bill', billSchema);
