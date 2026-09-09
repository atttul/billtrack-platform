import { z } from 'zod';

export const createBillSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().optional().default(''),
    amount: z.number().positive('Amount must be greater than zero'),
    currency: z.string().length(3).optional().default('INR'),
    categoryId: z.string().min(1, 'Category ID is required'),
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
    nextDueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    }),
    reminderDaysBefore: z.number().min(0).max(30).optional().default(3),
  }),
});

export const updateBillSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Bill ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    amount: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    categoryId: z.string().min(1).optional(),
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    nextDueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid due date format',
      })
      .optional(),
    reminderDaysBefore: z.number().min(0).max(30).optional(),
  }),
});

export const billIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Bill ID is required'),
  }),
});

export const billListQuerySchema = z.object({
  query: z.object({
    status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type CreateBillInput = z.infer<typeof createBillSchema>['body'];
export type UpdateBillInput = z.infer<typeof updateBillSchema>['body'];
