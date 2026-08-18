import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import dbRoutes from './routes/db.routes.js';
import authRoutes from './routes/auth.routes.js';
import questionRoutes from './routes/question.routes.js';
import cbtSessionRoutes from './routes/cbtSession.routes.js';
import cbtBookmarkRoutes from './routes/cbtBookmark.routes.js';
import userSettingsRoutes from './routes/userSettings.routes.js';
import userScheduleRoutes from './routes/userSchedule.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/health', dbRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/cbt-sessions', cbtSessionRoutes);
app.use('/api/cbt-bookmarks', cbtBookmarkRoutes);
app.use('/api/users', userSettingsRoutes);
app.use('/api/users', userScheduleRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

export default app;
