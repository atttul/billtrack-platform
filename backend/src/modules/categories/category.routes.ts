import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './category.validation.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     summary: Create custom user category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Subscriptions
 *               icon:
 *                 type: string
 *                 example: tag
 *               color:
 *                 type: string
 *                 example: "#64748b"
 *     responses:
 *       201:
 *         description: Category created
 *   get:
 *     summary: List user default and custom categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of categories
 */
router
  .route('/')
  .post(validateRequest(createCategorySchema), categoryController.createCategory)
  .get(categoryController.getCategories);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Update custom category
 *     tags: [Categories]
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
 *         description: Category updated
 *   delete:
 *     summary: Delete custom category
 *     tags: [Categories]
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
 *         description: Category deleted
 */
router
  .route('/:id')
  .patch(validateRequest(updateCategorySchema), categoryController.updateCategory)
  .delete(validateRequest(categoryIdParamSchema), categoryController.deleteCategory);

export default router;
