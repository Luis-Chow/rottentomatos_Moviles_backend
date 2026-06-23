import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';

let memoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<string> {
  let uri = env.mongoUri;

  if (!uri) {
    // Sin MONGODB_URI levanta una DB en RAM (ideal para desarrollo local sin instalar Mongo).
    // Import dinamico: en produccion (con Atlas) nunca se carga este paquete (es devDependency).
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('[db] MONGODB_URI vacio: usando mongodb-memory-server (en RAM)');
  }

  await mongoose.connect(uri);
  console.log('[db] conectado a MongoDB');
  return uri;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
