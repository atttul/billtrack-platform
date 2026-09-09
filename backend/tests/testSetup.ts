import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

jest.setTimeout(60000);

let mongoServer: MongoMemoryServer | null = null;

export async function setupTestDb(): Promise<void> {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.5',
      },
    });
  }
  const uri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

export async function teardownTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}
