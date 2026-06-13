import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/index.js';
import authRoutes from './routes/auth.js';
import wardrobeRoutes from './routes/wardrobe.js';
import scheduleRoutes from './routes/schedule.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/schedule', scheduleRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
