import mongoose from 'mongoose';

// Ensure we're connecting to the sakura database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sakura';

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add mongoose to the NodeJS global type
declare global {
  var mongooseCache: Cached;
}

// Initialize the cached variable
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect() {
  if (global.mongooseCache.conn) {
    console.log('[MongoDB] Using existing connection');
    return global.mongooseCache.conn;
  }

  if (!global.mongooseCache.promise) {
    console.log('[MongoDB] Creating new connection to:', MONGODB_URI);
    const opts = {
      bufferCommands: false,
      dbName: 'sakura', // Explicitly set the database name to ensure we use sakura
    };

    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, opts);
  }
  
  try {
    global.mongooseCache.conn = await global.mongooseCache.promise;
    console.log('[MongoDB] Successfully connected to database');
    
    // List all collections if the connection is successful
    if (global.mongooseCache.conn?.connection?.db) {
      console.log('[MongoDB] Database name:', 
        global.mongooseCache.conn.connection.db.databaseName);
      
      const collections = await global.mongooseCache.conn.connection.db.listCollections().toArray();
      console.log('[MongoDB] Available collections:', collections.map(c => c.name));
    }
    
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    global.mongooseCache.promise = null;
    throw error;
  }

  return global.mongooseCache.conn;
}

export default dbConnect;
