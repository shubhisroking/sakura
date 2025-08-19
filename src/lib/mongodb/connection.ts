import mongoose from 'mongoose';

// Ensure we're connecting to the sakura database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sakura';

interface Cached {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
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
    // Extract the original connection string before adding parameters
    const baseUri = MONGODB_URI.includes('?') 
      ? MONGODB_URI.split('?')[0] 
      : MONGODB_URI;
      
    // Parse existing query parameters
    const queryParams = new URLSearchParams(
      MONGODB_URI.includes('?') ? MONGODB_URI.split('?')[1] : ''
    );
    
    // Ensure we're explicitly setting the database name in both the URL and options
    const finalUri = `${baseUri.endsWith('/') ? baseUri.slice(0, -1) : baseUri}/sakura?${queryParams.toString()}`;
    
    console.log('[MongoDB] Creating new connection with explicit database name');
    const opts = {
      bufferCommands: false,
      dbName: 'sakura', // Explicitly set the database name to ensure we use sakura
    };

    console.log('[MongoDB] Connection options:', opts);
    global.mongooseCache.promise = mongoose.connect(finalUri, opts);
  }
  
  try {
    global.mongooseCache.conn = await global.mongooseCache.promise;
    console.log('[MongoDB] Successfully connected to database');
    
    // Log detailed connection information
    if (global.mongooseCache.conn?.connection?.db) {
      console.log('[MongoDB] Database name:', 
        global.mongooseCache.conn.connection.db.databaseName);
      
      try {
        const collections = await global.mongooseCache.conn.connection.db.listCollections().toArray();
        console.log('[MongoDB] Available collections:', collections.map(c => c.name));
      } catch (err) {
        console.warn('[MongoDB] Could not list collections:', err);
      }
    }
    
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    console.error('[MongoDB] Error details:', JSON.stringify(error, null, 2));
    global.mongooseCache.promise = null;
    throw error;
  }

  return global.mongooseCache.conn;
}

export default dbConnect;
