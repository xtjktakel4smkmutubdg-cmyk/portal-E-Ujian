import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.js';
import adminAuthRoutes from './admin-auth.js';
import usersRoutes from './users.js';
import examsRoutes from './exams.js';
import sessionsRoutes from './sessions.js';
import exportRoutes from './export.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes — Student
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);

// Routes — Admin
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/export', exportRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Portal E-Ujian API v2.0 is running', timestamp: new Date().toISOString() });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Portal E-Ujian API running on port ${port}`);
  });
}

export default app;
