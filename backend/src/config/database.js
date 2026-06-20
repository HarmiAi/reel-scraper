import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDB = async () => {
  if (!MONGODB_URI) {
    console.warn('⚠️ MongoDB Connection Warning: MONGODB_URI is not defined in environment variables. Database features will be disabled.');
    return null;
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout limit
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.warn('⚠️ Server will run in OFFLINE/DEMO mode (database logging disabled).');
    return null; // Resolve null to allow server bootstrap
  }
};

// Monitor connection states
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB runtime connection error: ${err}`);
});
