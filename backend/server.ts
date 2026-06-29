import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/modules/auth/auth.routes.js'; // <--- Aakhir me .js lazmi lagayein
import adminRoutes from './src/modules/admin/admin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));
app.use(express.json());

// ============================================
// REGISTER MODULE ROUTES
// ============================================
app.use('/api/auth', authRoutes);

// Taki aap ka frontend route bilkul break na ho aur `/api/auth/vendors` wahi kaam kare
app.use('/api/auth', adminRoutes); 

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'DigitalRawalpindi API is running perfectly in Modular Architecture!' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`... Register: POST /api/auth/register`);
});