import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const TARGET_DB_NAME = 'billtrack_db';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    // Safeguard: explicitly force billtrack_db database name
    const connection = await mongoose.connect(env.MONGO_URI, {
      dbName: TARGET_DB_NAME,
    });

    logger.info(`✅ Connected to MongoDB Atlas - Database: [${connection.connection.name}]`);
  } catch (error) {
    logger.error({ error }, '❌ MongoDB connection error');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('🔌 Disconnected from MongoDB Atlas');
  } catch (error) {
    logger.error({ error }, '❌ Error disconnecting from MongoDB');
  }
}
