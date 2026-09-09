import { PaymentOccurrence, IPaymentOccurrence, PaymentStatus } from './paymentOccurrence.model.js';
import { Types } from 'mongoose';

export class PaymentOccurrenceRepository {
  async create(data: Partial<IPaymentOccurrence>): Promise<IPaymentOccurrence> {
    const occurrence = new PaymentOccurrence(data);
    return occurrence.save();
  }

  async findById(id: string | Types.ObjectId): Promise<IPaymentOccurrence | null> {
    return PaymentOccurrence.findById(id).exec();
  }

  async findByBillId(
    billId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    limit: number = 20,
    skip: number = 0
  ): Promise<{ data: IPaymentOccurrence[]; total: number }> {
    const query = {
      billId: new Types.ObjectId(billId),
      userId: new Types.ObjectId(userId),
    };

    const [data, total] = await Promise.all([
      PaymentOccurrence.find(query).sort({ dueDate: -1 }).skip(skip).limit(limit).exec(),
      PaymentOccurrence.countDocuments(query),
    ]);

    return { data, total };
  }

  async findLatestOccurrence(billId: string | Types.ObjectId): Promise<IPaymentOccurrence | null> {
    return PaymentOccurrence.findOne({ billId: new Types.ObjectId(billId) })
      .sort({ dueDate: -1 })
      .exec();
  }

  async findPendingByBillId(
    billId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IPaymentOccurrence | null> {
    return PaymentOccurrence.findOne({
      billId: new Types.ObjectId(billId),
      userId: new Types.ObjectId(userId),
      status: { $in: ['PENDING', 'MISSED'] },
    })
      .sort({ dueDate: 1 })
      .exec();
  }

  async updateStatus(
    id: string | Types.ObjectId,
    status: PaymentStatus,
    paidAt: Date | null = null
  ): Promise<IPaymentOccurrence | null> {
    return PaymentOccurrence.findByIdAndUpdate(
      id,
      { status, paidAt },
      { new: true, runValidators: true }
    ).exec();
  }

  async findUpcomingByUser(
    userId: string | Types.ObjectId,
    limit: number = 10
  ): Promise<IPaymentOccurrence[]> {
    return PaymentOccurrence.find({
      userId: new Types.ObjectId(userId),
      status: { $in: ['PENDING', 'MISSED'] },
    })
      .populate('billId', 'name categoryId frequency reminderDaysBefore')
      .sort({ dueDate: 1 })
      .limit(limit)
      .exec();
  }

  async findOverduePending(beforeDate: Date): Promise<IPaymentOccurrence[]> {
    return PaymentOccurrence.find({
      status: 'PENDING',
      dueDate: { $lt: beforeDate },
    }).exec();
  }
}

export const paymentOccurrenceRepository = new PaymentOccurrenceRepository();
