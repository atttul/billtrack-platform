import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/dashboard:
 *   get:
 *     summary: Retrieve dashboard aggregated metrics and upcoming bills
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics and active subscription summaries
 */
router.get('/', dashboardController.getDashboard);

export default router;
