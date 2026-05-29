import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import bootstrapRoutes from './routes/bootstrapRoutes';
import orderRoutes from './routes/orderRoutes';
import productRoutes from './routes/productRoutes';
import storeOrderRoutes from './routes/storeOrderRoutes';
import userRoutes from './routes/userRoutes';
import settingsRoutes from './routes/settingsRoutes';
import chatbotRoutes from './routes/chatbotRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/bootstrap', bootstrapRoutes);
app.use('/api/recycle-orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/store-orders', storeOrderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chatbot', chatbotRoutes);

export default app;
