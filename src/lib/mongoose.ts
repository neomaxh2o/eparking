import mongoose from 'mongoose';

declare global {
  // Cache global para la conexión mongoose
  // eslint-disable-next-line no-var
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-parking';

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable de entorno MONGODB_URI');
}

globalThis.mongooseConnection ??= { conn: null, promise: null };

async function connectToDatabase(): Promise<typeof mongoose> {
  if (globalThis.mongooseConnection!.conn) {
    console.log('🔁 Usando conexión mongoose cacheada');
    return globalThis.mongooseConnection!.conn;
  }

  if (!globalThis.mongooseConnection!.promise) {
    console.log('🔌 Intentando conectar a MongoDB');
    globalThis.mongooseConnection!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: true,       // allow buffering until connection is ready (safer in dev)
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    globalThis.mongooseConnection!.conn = await globalThis.mongooseConnection!.promise;
    console.log('✅ MongoDB conectado correctamente');
  } catch (error) {
    globalThis.mongooseConnection!.promise = null; // reset para reintentar
    console.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }

  return globalThis.mongooseConnection!.conn;
}

export default connectToDatabase;
