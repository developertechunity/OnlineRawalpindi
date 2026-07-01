import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './src/modules/auth/auth.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import riderRoutes from './src/modules/rider/rider.routes.js';
import vendorRoutes from './src/modules/vendor/vendor.routes.js';

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

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================
// ✅ ROUTES
// ============================================
console.log('📂 Mounting routes...');

app.use('/api/auth', authRoutes);
console.log('✅ Auth routes mounted on /api/auth');

app.use('/api/auth', adminRoutes);
console.log('✅ Admin routes mounted on /api/auth');

app.use('/api/auth', riderRoutes);
console.log('✅ Rider routes mounted on /api/auth');

// ✅ FIX: Vendor routes ko /api/auth/vendor pe mount karo
app.use('/api/auth/vendor', vendorRoutes);
console.log('✅ Vendor routes mounted on /api/auth/vendor');

// ✅ Test routes
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
console.log('   - GET  /api/auth/vendors (Admin)');
console.log('   - GET  /api/auth/withdrawals (Admin)');
console.log('   - GET  /api/auth/subscriptions (Admin)');
console.log('   - GET  /api/auth/vendor/test (Vendor Test)');
console.log('   - GET  /api/auth/vendor/dashboard-summary (Vendor)');
console.log('   - GET  /api/auth/vendor/products (Vendor)');

mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Test: http://localhost:${PORT}/api/test`);
});