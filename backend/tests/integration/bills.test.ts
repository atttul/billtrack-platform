import request from 'supertest';
import { app } from '../../src/app.js';
import { User } from '../../src/modules/users/user.model.js';
import { Bill } from '../../src/modules/bills/bill.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { PaymentOccurrence } from '../../src/modules/payments/paymentOccurrence.model.js';
import { setupTestDb, teardownTestDb } from '../testSetup.js';

let tokenA: string;
let tokenB: string;
let categoryId: string;

beforeAll(async () => {
  await setupTestDb();
}, 60000);

afterAll(async () => {
  await teardownTestDb();
}, 60000);

beforeEach(async () => {
  await User.deleteMany({});
  await Bill.deleteMany({});
  await Category.deleteMany({});
  await PaymentOccurrence.deleteMany({});

  // Register User A
  const resA = await request(app).post('/api/v1/auth/register').send({
    name: 'User A',
    email: 'userA@example.com',
    password: 'password123',
  });
  tokenA = resA.body.data.token;

  // Register User B
  const resB = await request(app).post('/api/v1/auth/register').send({
    name: 'User B',
    email: 'userB@example.com',
    password: 'password123',
  });
  tokenB = resB.body.data.token;

  // Fetch categories seeded for User A
  const catRes = await request(app)
    .get('/api/v1/categories')
    .set('Authorization', `Bearer ${tokenA}`);
  categoryId = catRes.body.data[0]._id;
});

describe('Bills & Payments API Integration Tests', () => {
  describe('POST /api/v1/bills', () => {
    it('should create a bill and generate initial payment occurrence', async () => {
      const payload = {
        name: 'Netflix',
        amount: 649,
        currency: 'INR',
        categoryId,
        frequency: 'MONTHLY',
        nextDueDate: '2026-10-10',
        reminderDaysBefore: 3,
      };

      const res = await request(app)
        .post('/api/v1/bills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Netflix');

      const billId = res.body.data._id;
      const occurrences = await PaymentOccurrence.find({ billId });
      expect(occurrences.length).toBe(1);
      expect(occurrences[0].status).toBe('PENDING');
      expect(occurrences[0].amount).toBe(649);
    });
  });

  describe('Tenancy Protection', () => {
    it('should prevent User B from reading User A\'s bill', async () => {
      const createRes = await request(app)
        .post('/api/v1/bills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Secret Subscription',
          amount: 100,
          categoryId,
          frequency: 'MONTHLY',
          nextDueDate: '2026-10-10',
        });

      const billId = createRes.body.data._id;

      const resB = await request(app)
        .get(`/api/v1/bills/${billId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(404);
    });
  });

  describe('Payment Lifecycle (Mark Paid & Recurrence)', () => {
    it('should mark current occurrence PAID and generate next occurrence for next month', async () => {
      const createRes = await request(app)
        .post('/api/v1/bills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Spotify',
          amount: 119,
          categoryId,
          frequency: 'MONTHLY',
          nextDueDate: '2026-09-10',
        });

      const billId = createRes.body.data._id;

      // Mark payment as paid
      const payRes = await request(app)
        .post(`/api/v1/bills/${billId}/pay`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(payRes.status).toBe(200);
      expect(payRes.body.success).toBe(true);
      expect(payRes.body.data.status).toBe('PAID');

      // Check occurrences
      const occurrences = await PaymentOccurrence.find({ billId }).sort({ dueDate: 1 });
      expect(occurrences.length).toBe(2);
      expect(occurrences[0].status).toBe('PAID');
      expect(occurrences[1].status).toBe('PENDING');
      expect(new Date(occurrences[1].dueDate).toISOString().slice(0, 10)).toBe('2026-10-10');
    });
  });
});
