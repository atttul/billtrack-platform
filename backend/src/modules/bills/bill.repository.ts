import { Bill, IBill, BillStatus } from './bill.model.js';
import { Types } from 'mongoose';

export interface BillFilterOptions {
  status?: BillStatus;
  categoryId?: string;
  search?: string;
}

export class BillRepository {
  async create(data: Partial<IBill>): Promise<IBill> {
    const bill = new Bill(data);
    return bill.save();
  }

  async findById(id: string | Types.ObjectId): Promise<IBill | null> {
    return Bill.findById(id).populate('categoryId', 'name icon color').exec();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IBill | null> {
    return Bill.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    })
      .populate('categoryId', 'name icon color')
      .exec();
  }

  async findAllByUser(
    userId: string | Types.ObjectId,
    filters: BillFilterOptions = {},
    limit: number = 20,
    skip: number = 0
  ): Promise<{ data: IBill[]; total: number }> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.categoryId) {
      query.categoryId = new Types.ObjectId(filters.categoryId);
    }

    if (filters.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      Bill.find(query)
        .populate('categoryId', 'name icon color')
        .sort({ nextDueDate: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Bill.countDocuments(query),
    ]);

    return { data, total };
  }

  async update(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    data: Partial<IBill>
  ): Promise<IBill | null> {
    return Bill.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      data,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name icon color')
      .exec();
  }

  async updateStatus(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    status: BillStatus
  ): Promise<IBill | null> {
    return Bill.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { status },
      { new: true }
    )
      .populate('categoryId', 'name icon color')
      .exec();
  }

  async countActiveByUser(userId: string | Types.ObjectId): Promise<number> {
    return Bill.countDocuments({
      userId: new Types.ObjectId(userId),
      status: 'ACTIVE',
    });
  }
}

export const billRepository = new BillRepository();
