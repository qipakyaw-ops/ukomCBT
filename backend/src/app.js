import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import dbRoutes from './routes/db.routes.js';
import authRoutes from './routes/auth.routes.js';
import questionRoutes from './routes/question.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/health', dbRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

export default app;
