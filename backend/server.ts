import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/modules/auth/auth.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import riderRoutes from './src/modules/rider/rider.routes.js'; // ✅ IMPORTANT

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));
app.use(express.json());

// ============================================
// REGISTER ALL ROUTES - YEH IMPORTANT HAI
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/auth', adminRoutes);
app.use('/api/auth', riderRoutes); // ✅ YEH HONA CHAHIYE

app.get('/', (req, res) => {
    res.json({ message: 'DigitalRawalpindi API is running!' });
});

console.log('✅ Server starting...');

mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('✅ Routes registered:');
    console.log('   - GET  /api/auth/rider/profile');
    console.log('   - GET  /api/auth/rider/deliveries');
    console.log('   - GET  /api/auth/rider/stats');
    console.log('   - GET  /api/auth/rider/status');
});