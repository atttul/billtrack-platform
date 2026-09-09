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
    it('should mark current occurrence PAID and generate next occurrence for next month when due today', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const createRes = await request(app)
        .post('/api/v1/bills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Spotify',
          amount: 119,
          categoryId,
          frequency: 'MONTHLY',
          nextDueDate: todayStr,
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
    });

    it('should reject marking payment as paid if occurrence due date is in the future', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const createRes = await request(app)
        .post('/api/v1/bills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Future Netflix',
          amount: 649,
          categoryId,
          frequency: 'MONTHLY',
          nextDueDate: futureDate,
        });

      const billId = createRes.body.data._id;
      const initialNextDueDate = createRes.body.data.nextDueDate;

      const payRes = await request(app)
        .post(`/api/v1/bills/${billId}/pay`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(payRes.status).toBe(400);
      expect(payRes.body.success).toBe(false);
      expect(payRes.body.message).toBe('Payment cannot be marked as paid before its due date');

      // Verify state was not modified
      const occurrences = await PaymentOccurrence.find({ billId });
      expect(occurrences.length).toBe(1);
      expect(occurrences[0].status).toBe('PENDING');

      const billAfter = await Bill.findById(billId);
      expect(new Date(billAfter!.nextDueDate).toISOString()).toBe(new Date(initialNextDueDate).toISOString());
    });

    it('should allow marking payment as paid when due date is in the past', async () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const createRes = await request(app)
        .post('/api/v1/bills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Past Due Rent',
          amount: 15000,
          categoryId,
          frequency: 'MONTHLY',
          nextDueDate: pastDate,
        });

      const billId = createRes.body.data._id;

      const payRes = await request(app)
        .post(`/api/v1/bills/${billId}/pay`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(payRes.status).toBe(200);
      expect(payRes.body.success).toBe(true);
      expect(payRes.body.data.status).toBe('PAID');
    });

    it('should reject consecutive duplicate payment attempts when next occurrence is in the future', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const createRes = await request(app)
        .post('/api/v1/bills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Gym',
          amount: 2000,
          categoryId,
          frequency: 'MONTHLY',
          nextDueDate: todayStr,
        });

      const billId = createRes.body.data._id;

      // First payment succeeds
      const firstPay = await request(app)
        .post(`/api/v1/bills/${billId}/pay`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(firstPay.status).toBe(200);

      // Immediate second payment attempt fails
      const secondPay = await request(app)
        .post(`/api/v1/bills/${billId}/pay`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(secondPay.status).toBe(400);
      expect(secondPay.body.message).toBe('Payment cannot be marked as paid before its due date');
    });
  });
});
