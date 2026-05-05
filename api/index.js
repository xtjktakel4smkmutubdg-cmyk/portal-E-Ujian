import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import examsRoutes from './exams.js';
import attemptsRoutes from './attempts.js';
import reportsRoutes from './reports.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/attempts', attemptsRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Portal Ujian Online API is running' });
});

// For local development, Vercel serverless handles this differently
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
