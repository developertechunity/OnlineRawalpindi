// backend/src/modules/payment/payment.routes.ts

import express from 'express';
import { protect, restrictTo } from '../auth/auth.middleware.js';
import {
    createPayment,
    confirmCOD,
    depositCODToAdmin,
    processRefund,
    getPayments,
    getPaymentDetails,
    getPaymentStatistics,
    handleStripeWebhook,
    handleEasyPaisaWebhook,
    handleJazzCashWebhook
} from './payment.controller.js';

const router = express.Router();

// ============================================
// ✅ TEST ROUTE - To check if payment routes are working
// ============================================
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ Payment routes are working!',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// PUBLIC WEBHOOK ROUTES
// ============================================
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.post('/webhook/easypaisa', express.json(), handleEasyPaisaWebhook);
router.post('/webhook/jazzcash', express.json(), handleJazzCashWebhook);

// ============================================
// CUSTOMER ROUTES
// ============================================
router.post('/create', protect, restrictTo('customer'), createPayment);

// ============================================
// RIDER ROUTES
// ============================================
router.post('/confirm-cod', protect, restrictTo('rider'), confirmCOD);
router.post('/deposit-cod', protect, restrictTo('rider', 'admin'), depositCODToAdmin);

// ============================================
// ADMIN ROUTES
// ============================================
router.post('/refund/:paymentId', protect, restrictTo('admin'), processRefund);
router.get('/statistics', protect, restrictTo('admin'), getPaymentStatistics);

// ============================================
// ALL ROLES ROUTES (Customer, Vendor, Rider, Admin)
// ============================================
router.get('/history', protect, getPayments);
router.get('/details/:paymentId', protect, getPaymentDetails);

export default router;