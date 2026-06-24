import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import reelRoutes from './routes/reelRoutes.js';
import userRoutes from './routes/userRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import facebookRoutes from './routes/facebookRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { startCleanupJob } from './controllers/reelController.js';

// Load environmental keys
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://reel-scraper-silk.vercel.app'
    ],
    credentials: true
  })
);

// Parse incoming request JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reels Backend Running',
  });
});

// API healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'active', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', timestamp: new Date() });
});

// Register REST Routes
app.use('/api/reels', reelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/facebook', facebookRoutes);

// Register 404 Route Not Found Handler
app.use(notFound);

// Centralized error handler middleware
app.use(errorHandler);

// Bootstrap Server & Connect DB
const startServer = async () => {
  try {
    // Attempt Mongoose Connection to MongoDB Atlas
    await connectDB();

    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 THE SAVE TUBE MVC BACKEND IS ACTIVE`);
      console.log(`➜  Local Host:  http://localhost:${PORT}`);
      console.log(`➜  Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`➜  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=========================================`);
    });

    // Start background temp files cleanup job
    startCleanupJob();
  } catch (err) {
    console.error(`💥 Failed to bootstrap backend server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
