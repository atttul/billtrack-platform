import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const TARGET_DB_NAME = 'billtrack_db';

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!cachedPromise) {
    mongoose.set('strictQuery', true);
    cachedPromise = mongoose.connect(env.MONGO_URI, {
      dbName: TARGET_DB_NAME,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    const conn = await cachedPromise;
    logger.info(`✅ Connected to MongoDB Atlas - Database: [${conn.connection.name}]`);
    return conn;
  } catch (error) {
    cachedPromise = null;
    logger.error({ error }, '❌ MongoDB connection error');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    cachedPromise = null;
    logger.info('🔌 Disconnected from MongoDB Atlas');
  } catch (error) {
    logger.error({ error }, '❌ Error disconnecting from MongoDB');
  }
}
