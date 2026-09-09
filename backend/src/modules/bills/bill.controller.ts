import { Request, Response, NextFunction } from 'express';
import { billService } from './bill.service.js';
import { sendSuccess } from '../../utils/response.utils.js';

export class BillController {
  async createBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const bill = await billService.createBill(userId, req.body);
      sendSuccess(res, bill, 'Bill created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getBills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, categoryId, search, page, limit } = req.query as any;
      const result = await billService.getUserBills(
        userId,
        { status, categoryId, search },
        page,
        limit
      );
      sendSuccess(res, result.data, 'Bills retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getBillById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const billId = req.params.id;
      const bill = await billService.getBillById(userId, billId);
      sendSuccess(res, bill, 'Bill retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const billId = req.params.id;
      const bill = await billService.updateBill(userId, billId, req.body);
      sendSuccess(res, bill, 'Bill updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async pauseBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const billId = req.params.id;
      const bill = await billService.pauseBill(userId, billId);
      sendSuccess(res, bill, 'Bill paused successfully');
    } catch (error) {
      next(error);
    }
  }

  async resumeBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const billId = req.params.id;
      const bill = await billService.resumeBill(userId, billId);
      sendSuccess(res, bill, 'Bill resumed successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const billId = req.params.id;
      const bill = await billService.cancelBill(userId, billId);
      sendSuccess(res, bill, 'Bill cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  async markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const billId = req.params.id;
      const occurrence = await billService.markPaymentPaid(userId, billId);
      sendSuccess(res, occurrence, 'Payment marked as paid');
    } catch (error) {
      next(error);
    }
  }

  async skipPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const billId = req.params.id;
      const occurrence = await billService.skipPayment(userId, billId);
      sendSuccess(res, occurrence, 'Payment occurrence skipped');
    } catch (error) {
      next(error);
    }
  }
}

export const billController = new BillController();
