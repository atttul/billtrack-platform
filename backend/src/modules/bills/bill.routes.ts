import { Router } from 'express';
import { billController } from './bill.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createBillSchema,
  updateBillSchema,
  billIdParamSchema,
  billListQuerySchema,
} from './bill.validation.js';
import { paymentOccurrenceController } from '../payments/paymentOccurrence.controller.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/bills:
 *   post:
 *     summary: Create a new recurring bill
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, amount, categoryId, frequency, nextDueDate]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Netflix Subscription
 *               description:
 *                 type: string
 *                 example: Premium 4K plan
 *               amount:
 *                 type: number
 *                 example: 649
 *               currency:
 *                 type: string
 *                 example: INR
 *               categoryId:
 *                 type: string
 *                 example: 663f1a2b3c4d5e6f7a8b9c0d
 *               frequency:
 *                 type: string
 *                 enum: [WEEKLY, MONTHLY, YEARLY]
 *                 example: MONTHLY
 *               nextDueDate:
 *                 type: string
 *                 example: "2026-09-15"
 *               reminderDaysBefore:
 *                 type: number
 *                 example: 3
 *     responses:
 *       201:
 *         description: Bill created successfully
 *   get:
 *     summary: Get all bills for current user
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAUSED, CANCELLED]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bills
 */
router
  .route('/')
  .post(validateRequest(createBillSchema), billController.createBill)
  .get(validateRequest(billListQuerySchema), billController.getBills);

/**
 * @openapi
 * /api/v1/bills/{id}:
 *   get:
 *     summary: Get bill details by ID
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill details
 *   patch:
 *     summary: Update bill
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated bill
 *   delete:
 *     summary: Cancel bill
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill cancelled
 */
router
  .route('/:id')
  .get(validateRequest(billIdParamSchema), billController.getBillById)
  .patch(validateRequest(updateBillSchema), billController.updateBill)
  .delete(validateRequest(billIdParamSchema), billController.deleteBill);

/**
 * @openapi
 * /api/v1/bills/{id}/pause:
 *   post:
 *     summary: Pause bill recurrence
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill paused
 */
router.post('/:id/pause', validateRequest(billIdParamSchema), billController.pauseBill);

/**
 * @openapi
 * /api/v1/bills/{id}/resume:
 *   post:
 *     summary: Resume bill recurrence
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill resumed
 */
router.post('/:id/resume', validateRequest(billIdParamSchema), billController.resumeBill);

/**
 * @openapi
 * /api/v1/bills/{id}/pay:
 *   post:
 *     summary: Mark current occurrence as PAID and generate next occurrence
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment marked as paid
 */
router.post('/:id/pay', validateRequest(billIdParamSchema), billController.markPaid);

/**
 * @openapi
 * /api/v1/bills/{id}/skip:
 *   post:
 *     summary: Skip current occurrence and generate next occurrence
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment skipped
 */
router.post('/:id/skip', validateRequest(billIdParamSchema), billController.skipPayment);

/**
 * @openapi
 * /api/v1/bills/{id}/payments:
 *   get:
 *     summary: List payment occurrence history for bill
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of payment occurrences
 */
router.get('/:id/payments', validateRequest(billIdParamSchema), paymentOccurrenceController.getPaymentsByBill);

export default router;
