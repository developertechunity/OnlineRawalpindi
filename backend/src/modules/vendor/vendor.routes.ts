// backend/src/modules/vendor/vendor.routes.ts

import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import { upload } from './vendor.middleware.js';
import {
    getVendorDashboardData,
    getProducts,
    addProduct,
    deleteProduct,
    getEmployees,
    addEmployee,
    deleteEmployee,
    upgradeSubscriptionRequest,
    requestTrialExtension,
    getTrialStatus,
    startFreeTrial,
    cancelSubscriptionRequest,
    requestWithdrawal,
    getWithdrawalHistory
} from './vendor.controller.js';

const router = express.Router();

// =========================================================
// ✅ MIDDLEWARE: Extract userId from req.user
// =========================================================
const setUserId = (req: any, res: any, next: any) => {
    if (req.user) {
        req.userId = req.user._id || req.user.id;
    }
    next();
};

// =========================================================
// ✅ TEST ROUTE - Check if vendor routes work
// =========================================================
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ Vendor routes are working!',
        timestamp: new Date().toISOString()
    });
});

// =========================================================
// ✅ PROTECTED ROUTES
// =========================================================

// ---------- DASHBOARD ----------
router.get('/dashboard-summary', protect, setUserId, getVendorDashboardData);
router.get('/trial-status', protect, setUserId, getTrialStatus);

// ---------- PRODUCTS ----------
router.get('/products', protect, setUserId, getProducts);
router.post('/products/add', protect, setUserId, upload.array('images', 5), addProduct);
router.delete('/products/:productId', protect, setUserId, deleteProduct);

// ---------- EMPLOYEES ----------
router.get('/employees', protect, setUserId, getEmployees);
router.post('/employees/add', protect, setUserId, addEmployee);
router.delete('/employees/:employeeId', protect, setUserId, deleteEmployee);

// ---------- WITHDRAWAL ----------
router.post('/withdrawal/request', protect, setUserId, requestWithdrawal);
router.get('/withdrawal/history', protect, setUserId, getWithdrawalHistory);

// ---------- SUBSCRIPTION ----------
router.post('/subscription/start-trial', protect, setUserId, startFreeTrial);
router.post('/subscription/upgrade', protect, setUserId, upgradeSubscriptionRequest);
router.post('/subscription/cancel-request', protect, setUserId, cancelSubscriptionRequest);
router.post('/subscription/extend-trial', protect, setUserId, requestTrialExtension);

export default router;