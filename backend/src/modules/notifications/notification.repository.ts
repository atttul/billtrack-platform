import { Notification, INotification, NotificationStatus } from './notification.model.js';
import { Types } from 'mongoose';

export class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(data);
    return notification.save();
  }

  async findById(id: string | Types.ObjectId): Promise<INotification | null> {
    return Notification.findById(id)
      .populate('userId', 'name email')
      .populate('billId', 'name amount currency')
      .exec();
  }

  async findByUserId(
    userId: string | Types.ObjectId,
    limit: number = 20,
    skip: number = 0
  ): Promise<{ data: INotification[]; total: number }> {
    const query = { userId: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
      Notification.find(query)
        .populate('billId', 'name amount currency')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Notification.countDocuments(query),
    ]);

    return { data, total };
  }

  async findExistingNotification(
    userId: string | Types.ObjectId,
    paymentOccurrenceId: string | Types.ObjectId,
    type: string = 'EMAIL'
  ): Promise<INotification | null> {
    return Notification.findOne({
      userId: new Types.ObjectId(userId),
      paymentOccurrenceId: new Types.ObjectId(paymentOccurrenceId),
      type,
    }).exec();
  }

  async updateStatus(
    id: string | Types.ObjectId,
    status: NotificationStatus,
    sentAt: Date | null = null,
    errorMessage: string | null = null
  ): Promise<INotification | null> {
    const update: any = { status, errorMessage };
    if (sentAt) update.sentAt = sentAt;
    if (status === 'FAILED') update.$inc = { retryCount: 1 };

    return Notification.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}

export const notificationRepository = new NotificationRepository();
