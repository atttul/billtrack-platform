import { billRepository, BillRepository, BillFilterOptions } from './bill.repository.js';
import { CreateBillInput, UpdateBillInput } from './bill.validation.js';
import { categoryRepository, CategoryRepository } from '../categories/category.repository.js';
import {
  paymentOccurrenceRepository,
  PaymentOccurrenceRepository,
} from '../payments/paymentOccurrence.repository.js';
import { auditLogService, AuditLogService } from '../audit/auditLog.service.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';
import {
  normalizeToStartOfDay,
  calculateNextDueDate,
  calculateReminderDate,
} from '../../utils/date.utils.js';
import { parsePaginationParams, formatPaginatedResult } from '../../utils/pagination.utils.js';
import { scheduleReminderJob } from '../../queues/reminder.queue.js';
import { Types } from 'mongoose';

export class BillService {
  constructor(
    private billRepo: BillRepository = billRepository,
    private categoryRepo: CategoryRepository = categoryRepository,
    private paymentRepo: PaymentOccurrenceRepository = paymentOccurrenceRepository,
    private auditService: AuditLogService = auditLogService
  ) {}

  async createBill(userId: string, input: CreateBillInput) {
    // 1. Verify Category exists and belongs to user or system
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    if (category.userId && category.userId.toString() !== userId) {
      throw new ForbiddenError('Invalid category selection');
    }

    const nextDueDate = normalizeToStartOfDay(input.nextDueDate);

    // 2. Create Bill
    const bill = await this.billRepo.create({
      userId: new Types.ObjectId(userId),
      name: input.name,
      description: input.description,
      amount: input.amount,
      currency: input.currency || 'INR',
      categoryId: new Types.ObjectId(input.categoryId),
      frequency: input.frequency,
      nextDueDate,
      reminderDaysBefore: input.reminderDaysBefore ?? 3,
      status: 'ACTIVE',
    });

    // 3. Create first PaymentOccurrence
    const occurrence = await this.paymentRepo.create({
      billId: bill._id,
      userId: new Types.ObjectId(userId),
      dueDate: nextDueDate,
      amount: bill.amount,
      status: 'PENDING',
    });

    // 4. Schedule BullMQ Reminder Job
    const reminderDate = calculateReminderDate(nextDueDate, bill.reminderDaysBefore);
    const delayMs = reminderDate.getTime() - Date.now();
    await scheduleReminderJob(
      {
        userId,
        billId: bill._id.toString(),
        paymentOccurrenceId: occurrence._id.toString(),
      },
      delayMs
    );

    // 5. Audit Log
    await this.auditService.logEvent(userId, 'BILL', bill._id, 'BILL_CREATED', {
      name: bill.name,
      amount: bill.amount,
      nextDueDate,
    });

    return this.billRepo.findById(bill._id);
  }

  async getUserBills(
    userId: string,
    filters: BillFilterOptions = {},
    page?: string | number,
    limit?: string | number
  ) {
    const params = parsePaginationParams(page, limit);
    const { data, total } = await this.billRepo.findAllByUser(
      userId,
      filters,
      params.limit,
      params.skip
    );
    return formatPaginatedResult(data, total, params);
  }

  async getBillById(userId: string, billId: string) {
    const bill = await this.billRepo.findByIdAndUser(billId, userId);
    if (!bill) {
      throw new NotFoundError('Bill not found or access denied');
    }
    return bill;
  }

  async updateBill(userId: string, billId: string, input: UpdateBillInput) {
    const existingBill = await this.billRepo.findByIdAndUser(billId, userId);
    if (!existingBill) {
      throw new NotFoundError('Bill not found or access denied');
    }

    if (input.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) throw new NotFoundError('Category not found');
    }

    const updateData: any = { ...input };
    if (input.nextDueDate) {
      updateData.nextDueDate = normalizeToStartOfDay(input.nextDueDate);
    }
    if (input.categoryId) {
      updateData.categoryId = new Types.ObjectId(input.categoryId);
    }

    const updatedBill = await this.billRepo.update(billId, userId, updateData);

    // If nextDueDate or amount changed, update pending payment occurrence
    if (input.nextDueDate || input.amount) {
      const pendingOccurrence = await this.paymentRepo.findPendingByBillId(billId, userId);
      if (pendingOccurrence) {
        if (input.amount) pendingOccurrence.amount = input.amount;
        if (input.nextDueDate) pendingOccurrence.dueDate = updateData.nextDueDate;
        await pendingOccurrence.save();

        const reminderDate = calculateReminderDate(
          pendingOccurrence.dueDate,
          updatedBill?.reminderDaysBefore ?? 3
        );
        await scheduleReminderJob(
          {
            userId,
            billId,
            paymentOccurrenceId: pendingOccurrence._id.toString(),
          },
          reminderDate.getTime() - Date.now()
        );
      }
    }

    await this.auditService.logEvent(userId, 'BILL', billId, 'BILL_UPDATED', updateData);

    return updatedBill;
  }

  async pauseBill(userId: string, billId: string) {
    const bill = await this.billRepo.findByIdAndUser(billId, userId);
    if (!bill) throw new NotFoundError('Bill not found or access denied');

    const updated = await this.billRepo.updateStatus(billId, userId, 'PAUSED');
    await this.auditService.logEvent(userId, 'BILL', billId, 'BILL_PAUSED');
    return updated;
  }

  async resumeBill(userId: string, billId: string) {
    const bill = await this.billRepo.findByIdAndUser(billId, userId);
    if (!bill) throw new NotFoundError('Bill not found or access denied');

    const updated = await this.billRepo.updateStatus(billId, userId, 'ACTIVE');
    await this.auditService.logEvent(userId, 'BILL', billId, 'BILL_RESUMED');
    return updated;
  }

  async cancelBill(userId: string, billId: string) {
    const bill = await this.billRepo.findByIdAndUser(billId, userId);
    if (!bill) throw new NotFoundError('Bill not found or access denied');

    const updated = await this.billRepo.updateStatus(billId, userId, 'CANCELLED');
    await this.auditService.logEvent(userId, 'BILL', billId, 'BILL_CANCELLED');
    return updated;
  }

  async markPaymentPaid(userId: string, billId: string) {
    const bill = await this.billRepo.findByIdAndUser(billId, userId);
    if (!bill) throw new NotFoundError('Bill not found or access denied');

    const occurrence = await this.paymentRepo.findPendingByBillId(billId, userId);
    if (!occurrence) {
      throw new BadRequestError('No pending payment occurrence found for this bill');
    }

    // Compare occurrence dueDate normalized UTC with today's normalized UTC date
    const startOfToday = normalizeToStartOfDay(new Date());
    const occurrenceDueDate = normalizeToStartOfDay(occurrence.dueDate);

    if (occurrenceDueDate.getTime() > startOfToday.getTime()) {
      throw new BadRequestError('Payment cannot be marked as paid before its due date');
    }

    // 1. Transition status to PAID
    occurrence.status = 'PAID';
    occurrence.paidAt = new Date();
    await occurrence.save();

    await this.auditService.logEvent(userId, 'PAYMENT_OCCURRENCE', occurrence._id, 'PAYMENT_MARKED_PAID', {
      billId,
      amount: occurrence.amount,
      dueDate: occurrence.dueDate,
    });

    // 2. If Bill is ACTIVE, generate next occurrence
    if (bill.status === 'ACTIVE') {
      const anchorDay = occurrence.dueDate.getUTCDate();
      const nextDueDate = calculateNextDueDate(occurrence.dueDate, bill.frequency, anchorDay);

      bill.nextDueDate = nextDueDate;
      await bill.save();

      // Create next PaymentOccurrence
      const nextOccurrence = await this.paymentRepo.create({
        billId: bill._id,
        userId: new Types.ObjectId(userId),
        dueDate: nextDueDate,
        amount: bill.amount,
        status: 'PENDING',
      });

      // Schedule Reminder Job for next occurrence
      const reminderDate = calculateReminderDate(nextDueDate, bill.reminderDaysBefore);
      await scheduleReminderJob(
        {
          userId,
          billId: bill._id.toString(),
          paymentOccurrenceId: nextOccurrence._id.toString(),
        },
        reminderDate.getTime() - Date.now()
      );
    }

    return occurrence;
  }

  async skipPayment(userId: string, billId: string) {
    const bill = await this.billRepo.findByIdAndUser(billId, userId);
    if (!bill) throw new NotFoundError('Bill not found or access denied');

    const occurrence = await this.paymentRepo.findPendingByBillId(billId, userId);
    if (!occurrence) {
      throw new BadRequestError('No pending payment occurrence found for this bill');
    }

    // 1. Transition status to SKIPPED
    occurrence.status = 'SKIPPED';
    await occurrence.save();

    await this.auditService.logEvent(userId, 'PAYMENT_OCCURRENCE', occurrence._id, 'PAYMENT_SKIPPED', {
      billId,
      dueDate: occurrence.dueDate,
    });

    // 2. If Bill is ACTIVE, generate next occurrence
    if (bill.status === 'ACTIVE') {
      const anchorDay = occurrence.dueDate.getUTCDate();
      const nextDueDate = calculateNextDueDate(occurrence.dueDate, bill.frequency, anchorDay);

      bill.nextDueDate = nextDueDate;
      await bill.save();

      const nextOccurrence = await this.paymentRepo.create({
        billId: bill._id,
        userId: new Types.ObjectId(userId),
        dueDate: nextDueDate,
        amount: bill.amount,
        status: 'PENDING',
      });

      const reminderDate = calculateReminderDate(nextDueDate, bill.reminderDaysBefore);
      await scheduleReminderJob(
        {
          userId,
          billId: bill._id.toString(),
          paymentOccurrenceId: nextOccurrence._id.toString(),
        },
        reminderDate.getTime() - Date.now()
      );
    }

    return occurrence;
  }
}

export const billService = new BillService();
