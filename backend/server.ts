// backend/server.ts

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/modules/auth/auth.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import vendorRoutes from './src/modules/vendor/vendor.routes.js';
import paymentRoutes from './src/modules/payment/payment.routes.js';  // ✅ Added

// ✅ For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));

// ✅ Webhook routes must be BEFORE express.json()
app.use('/api/payment/webhook/stripe', express.raw({ type: 'application/json' }));
app.use('/api/payment/webhook/easypaisa', express.json());
app.use('/api/payment/webhook/jazzcash', express.json());

// ✅ JSON middleware
app.use(express.json());

// ✅ Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ✅ REGISTER ALL ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/payment', paymentRoutes);  // ✅ Added payment routes

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'DigitalRawalpindi API is running!' });
});

console.log('✅ Server starting...');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔑 Auth: /api/auth`);
    console.log(`📋 Admin: /api/admin`);
    console.log(`📦 Vendor: /api/vendor`);
    console.log(`💳 Payment: /api/payment`);  // ✅ Added
    console.log(`📁 Uploads: /uploads`);
});