import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import inventoryRoutes from './routes/inventory.js';
import productRoutes from './routes/products.js';
import rawMaterialRoutes from './routes/rawMaterials.js';
import paymentRoutes from './routes/payments.js';
import jobWorkRoutes from './routes/jobWork.js';
import orderRoutes from './routes/orders.js';
import wastageRoutes from './routes/wastage.js';
import dispatchRoutes from './routes/dispatch.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biowaste_solutions')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/job-work', jobWorkRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/dispatch', dispatchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});