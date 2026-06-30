import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    register,
    login,
    forgotPassword,
    resetPassword
} from './auth.controller.js';

const router = Router();

// ============================================
// MULTER CONFIGURATION - FILE UPLOAD
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ============================================
// PUBLIC ROUTES
// ============================================

// Test route
router.get('/test', (req, res) => {
    res.json({ success: true, message: '✅ Auth routes working!' });
});

// Register with file upload (CNIC + Business License for vendors)
router.post('/register', upload.fields([
    { name: 'cnicFront', maxCount: 1 },
    { name: 'cnicBack', maxCount: 1 },
    { name: 'businessLicense', maxCount: 1 } // ✅ Business License - Optional
]), register);

// Login
router.post('/login', login);

// Forgot Password
router.post('/forgot-password', forgotPassword);

// Reset Password
router.post('/reset-password', resetPassword);

export default router;