// Export MongoDB connection and models from this barrel file
import dbConnect from './connection';

// Export the connection
export { default } from './connection';

// Also export any models
export * from './models/project';
