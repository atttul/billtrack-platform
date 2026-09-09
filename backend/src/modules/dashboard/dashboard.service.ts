import { Bill } from '../bills/bill.model.js';
import { PaymentOccurrence } from '../payments/paymentOccurrence.model.js';
import { Types } from 'mongoose';

export interface DashboardSummary {
  monthlyTotal: number;
  upcomingPaymentsCount: number;
  activeSubscriptions: number;
  nextPayment: {
    billId: string;
    name: string;
    amount: number;
    currency: string;
    dueDate: Date;
    category?: {
      name: string;
      icon: string;
      color: string;
    };
  } | null;
  categorySummary: Array<{
    categoryId: string;
    categoryName: string;
    icon: string;
    color: string;
    monthlySpend: number;
  }>;
  upcomingPayments: Array<{
    id: string;
    billId: string;
    name: string;
    amount: number;
    currency: string;
    dueDate: Date;
    status: string;
  }>;
}

export class DashboardService {
  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const userObjId = new Types.ObjectId(userId);

    // 1. Fetch active bills with populated category
    const activeBills = await Bill.find({ userId: userObjId, status: 'ACTIVE' })
      .populate('categoryId', 'name icon color')
      .exec();

    // Calculate monthly recurring total and category breakdown
    let monthlyTotal = 0;
    const categoryMap: Map<string, { categoryId: string; categoryName: string; icon: string; color: string; monthlySpend: number }> = new Map();

    for (const bill of activeBills) {
      let monthlyAmount = bill.amount;
      if (bill.frequency === 'WEEKLY') {
        monthlyAmount = bill.amount * 4.333; // Average weeks in a month
      } else if (bill.frequency === 'YEARLY') {
        monthlyAmount = bill.amount / 12;
      }

      monthlyTotal += monthlyAmount;

      const cat: any = bill.categoryId;
      if (cat) {
        const catIdStr = cat._id.toString();
        const existing = categoryMap.get(catIdStr) || {
          categoryId: catIdStr,
          categoryName: cat.name || 'Other',
          icon: cat.icon || 'tag',
          color: cat.color || '#64748b',
          monthlySpend: 0,
        };
        existing.monthlySpend += Math.round(monthlyAmount * 100) / 100;
        categoryMap.set(catIdStr, existing);
      }
    }

    // 2. Fetch upcoming / pending payment occurrences
    const upcomingOccurrences = await PaymentOccurrence.find({
      userId: userObjId,
      status: { $in: ['PENDING', 'MISSED'] },
    })
      .populate('billId', 'name amount currency categoryId')
      .sort({ dueDate: 1 })
      .limit(10)
      .exec();

    const upcomingPaymentsCount = await PaymentOccurrence.countDocuments({
      userId: userObjId,
      status: { $in: ['PENDING', 'MISSED'] },
    });

    const upcomingList = upcomingOccurrences.map((occ) => {
      const bill: any = occ.billId;
      return {
        id: occ._id.toString(),
        billId: bill?._id?.toString() || occ.billId.toString(),
        name: bill?.name || 'Unknown Bill',
        amount: occ.amount,
        currency: bill?.currency || 'INR',
        dueDate: occ.dueDate,
        status: occ.status,
      };
    });

    const nextPaymentItem = upcomingOccurrences.length > 0 ? upcomingOccurrences[0] : null;
    let nextPayment = null;

    if (nextPaymentItem) {
      const bill: any = nextPaymentItem.billId;
      nextPayment = {
        billId: bill?._id?.toString() || nextPaymentItem.billId.toString(),
        name: bill?.name || 'Unknown Bill',
        amount: nextPaymentItem.amount,
        currency: bill?.currency || 'INR',
        dueDate: nextPaymentItem.dueDate,
      };
    }

    return {
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      upcomingPaymentsCount,
      activeSubscriptions: activeBills.length,
      nextPayment,
      categorySummary: Array.from(categoryMap.values()),
      upcomingPayments: upcomingList,
    };
  }
}

export const dashboardService = new DashboardService();
