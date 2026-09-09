import { Request, Response, NextFunction } from 'express';
import { paymentOccurrenceRepository } from './paymentOccurrence.repository.js';
import { sendSuccess } from '../../utils/response.utils.js';
import { parsePaginationParams, formatPaginatedResult } from '../../utils/pagination.utils.js';

export class PaymentOccurrenceController {
  async getPaymentsByBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const billId = req.params.id;
      const { page, limit } = req.query as any;

      const params = parsePaginationParams(page, limit);
      const { data, total } = await paymentOccurrenceRepository.findByBillId(
        billId,
        userId,
        params.limit,
        params.skip
      );

      sendSuccess(res, formatPaginatedResult(data, total, params), 'Payment history retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const paymentOccurrenceController = new PaymentOccurrenceController();
