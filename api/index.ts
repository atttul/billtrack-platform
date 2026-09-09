import { app } from '../backend/src/app.js';
import { connectDatabase } from '../backend/src/config/database.js';

export default async function handler(req: any, res: any) {
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Vercel handler database connection error:', err);
  }
  return app(req, res);
}
