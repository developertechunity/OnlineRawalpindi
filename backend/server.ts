import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './src/modules/auth/auth.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import riderRoutes from './src/modules/rider/rider.routes.js';
import vendorRoutes from './src/modules/vendor/vendor.routes.js';
import paymentRoutes from './src/modules/payment/payment.routes.js';

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
// ✅ ROUTES - MERGED
// ============================================
console.log('📂 Mounting routes...');

// Auth routes
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes mounted on /api/auth');

// Admin routes
app.use('/api/auth', adminRoutes);
console.log('✅ Admin routes mounted on /api/auth');

<<<<<<< HEAD
// ✅ DEBUGGING - Admin routes list
console.log('📋 ADMIN ROUTES REGISTERED:');
try {
    adminRoutes.stack.forEach((layer: any) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            console.log(`   ${methods} /api/auth${layer.route.path}`);
        }
    });
} catch (e) {
    console.log('   (Could not list routes)');
}

=======
>>>>>>> cde636d9b5fb00d45366249cf3bdf79103424c5e
// Rider routes
app.use('/api/auth', riderRoutes);
console.log('✅ Rider routes mounted on /api/auth');

<<<<<<< HEAD
// ✅ Vendor routes
app.use('/api/auth/vendor', vendorRoutes);
console.log('✅ Vendor routes mounted on /api/auth/vendor');
=======
// ✅ Vendor routes - /api/vendor pe mount karo (Admin aur Aapka dono)
app.use('/api/vendor', vendorRoutes);
console.log('✅ Vendor routes mounted on /api/vendor');

// ✅ Payment routes
app.use('/api/payment', paymentRoutes);
console.log('✅ Payment routes mounted on /api/payment');
>>>>>>> cde636d9b5fb00d45366249cf3bdf79103424c5e

// ✅ Payment routes
app.use('/api/payment', paymentRoutes);
console.log('✅ Payment routes mounted on /api/payment');

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

// ✅ Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

console.log('✅ Server starting...');
console.log('📋 Available Routes:');
console.log('   - GET  /api/test');
console.log('   - POST /api/auth/login');
console.log('   - GET  /api/auth/vendors (Admin)');
console.log('   - GET  /api/auth/withdrawals (Admin)');
console.log('   - GET  /api/auth/subscriptions (Admin)');
<<<<<<< HEAD
console.log('   - PUT  /api/auth/vendor/:id (Admin - Edit Profile) ✅');
console.log('   - GET  /api/auth/vendor/:id (Admin - Get Vendor) ✅');
console.log('   - GET  /api/auth/riders (Admin)');
console.log('   - GET  /api/auth/customers (Admin)');
=======
>>>>>>> cde636d9b5fb00d45366249cf3bdf79103424c5e
console.log('   - GET  /api/vendor/test (Vendor Test)');
console.log('   - GET  /api/vendor/dashboard-summary (Vendor)');
console.log('   - GET  /api/vendor/products (Vendor)');
console.log('   - GET  /api/vendor/business/types (Vendor Business)');
console.log('   - POST /api/vendor/business/register (Vendor Business)');
console.log(`💳 Payment: /api/payment`);

mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Test: http://localhost:${PORT}/api/test`);
});