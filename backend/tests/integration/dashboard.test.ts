import request from 'supertest';
import { app } from '../../src/app.js';
import { User } from '../../src/modules/users/user.model.js';
import { Bill } from '../../src/modules/bills/bill.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { PaymentOccurrence } from '../../src/modules/payments/paymentOccurrence.model.js';
import { setupTestDb, teardownTestDb } from '../testSetup.js';

let token: string;
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

  const registerRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Dashboard User',
    email: 'dash@example.com',
    password: 'password123',
  });
  token = registerRes.body.data.token;

  const catRes = await request(app)
    .get('/api/v1/categories')
    .set('Authorization', `Bearer ${token}`);
  categoryId = catRes.body.data[0]._id;
});

describe('Dashboard API Integration Tests', () => {
  it('should return aggregated monthly total, active count, and upcoming payments', async () => {
    // Add 2 bills
    await request(app)
      .post('/api/v1/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Internet',
        amount: 1000,
        categoryId,
        frequency: 'MONTHLY',
        nextDueDate: '2026-09-15',
      });

    await request(app)
      .post('/api/v1/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Gym',
        amount: 1500,
        categoryId,
        frequency: 'MONTHLY',
        nextDueDate: '2026-09-20',
      });

    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeSubscriptions).toBe(2);
    expect(res.body.data.monthlyTotal).toBe(2500);
    expect(res.body.data.upcomingPaymentsCount).toBe(2);
    expect(res.body.data.nextPayment.name).toBe('Internet');
  });
});
