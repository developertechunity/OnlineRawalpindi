// backend/src/modules/auth/auth.routes.ts

import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from './User.model.js';
import { protect } from './auth.middleware.js';
import { login, register, getMe, updateVendorId } from './auth.controller.js';

const router = express.Router();

// ============================================
// ✅ MULTER SETUP FOR FILE UPLOADS
// ============================================
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// ============================================
// AUTH ROUTES
// ============================================

// ✅ Register with file upload support
router.post(
    '/register',
    upload.fields([
        { name: 'cnicFront', maxCount: 1 },
        { name: 'cnicBack', maxCount: 1 },
        { name: 'businessLicense', maxCount: 1 }
    ]),
    register
);

// ✅ Login
router.post('/login', login);

// ✅ Get Current User
router.get('/me', protect, getMe);

// ✅ UPDATE VENDOR ID (Fix padding issue)
router.put('/vendor/:id/vendor-id', updateVendorId);

// ============================================
// ✅ TEMPORARY: Create Admin User
// ============================================
router.post('/create-admin', async (req, res) => {
    try {
        const existing = await User.findOne({ email: 'admin@gmail.com' });
        if (existing) {
            return res.json({ 
                success: true, 
                message: 'Admin already exists',
                admin: {
                    id: existing._id,
                    name: existing.name,
                    email: existing.email,
                    role: existing.role
                }
            });
        }
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const admin = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'admin',
            approvalStatus: 'approved',
            subscriptionPlan: 'free',
            subscriptionStatus: 'active',
            totalEarnings: 0,
            availableBalance: 0,
            pendingWithdrawals: 0,
            totalOrdersCount: 0,
            hasRequestedExtension: false
        });
        
        await admin.save();
        
        res.json({ 
            success: true, 
            message: '✅ Admin created successfully!',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error: any) {
        console.error('❌ Error creating admin:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

export default router;