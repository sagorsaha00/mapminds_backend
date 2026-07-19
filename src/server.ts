import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import tripRoutes from './routes/tripRoutes';
import aiRoutes from './routes/aiRoutes';
import userRoutes from './routes/userRoutes';
import { notFound, errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', service: 'trailmind-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`TrailMind API running on port ${PORT}`));
});
