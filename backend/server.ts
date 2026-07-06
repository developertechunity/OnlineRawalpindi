// backend/server.ts

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/modules/auth/auth.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import riderRoutes from './src/modules/rider/rider.routes.js';
import vendorRoutes from './src/modules/vendor/vendor.routes.js';
import paymentRoutes from './src/modules/payment/payment.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ✅ CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================
// ✅ ROUTES - CORRECTED
// ============================================
console.log('📂 Mounting routes...');

// Auth routes
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes mounted on /api/auth');

// Admin routes - FIXED: /api/admin not /api/auth
app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes mounted on /api/admin');

// Rider routes - FIXED: /api/rider not /api/auth
app.use('/api/rider', riderRoutes);
console.log('✅ Rider routes mounted on /api/rider');

// ✅ Vendor routes - CORRECT: /api/vendor (not /api/auth/vendor)
app.use('/api/vendor', vendorRoutes);
console.log('✅ Vendor routes mounted on /api/vendor');

// ✅ Payment routes
app.use('/api/payment', paymentRoutes);
console.log('✅ Payment routes mounted on /api/payment');

// Test routes
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: '✅ Backend is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'DigitalRawalpindi API is running!' });
});

console.log('✅ Server starting...');
console.log('📋 Available Routes:');
console.log('   - GET  /api/test');
console.log('   - POST /api/auth/login');
console.log('   - GET  /api/admin/vendors (Admin)');
console.log('   - GET  /api/vendor/test (Vendor Test)');
console.log('   - GET  /api/vendor/dashboard-summary (Vendor)');
console.log('   - GET  /api/vendor/products (Vendor)');
console.log('   - GET  /api/payment/test (Payment Test)');

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
    console.log(`💳 Payment: /api/payment`);
    console.log(`📁 Uploads: /uploads`);
    console.log(`📡 Test: http://localhost:${PORT}/api/test`);
});