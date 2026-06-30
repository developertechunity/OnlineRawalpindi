// backend/src/modules/vendor/vendor.routes.ts

import express from 'express';
import { protect } from '../auth/auth.middleware.js';
import { upload } from './vendor.middleware.js';  // ✅ Import upload
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
// ✅ TEST ROUTE
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
router.get('/dashboard-summary', protect, getVendorDashboardData);
router.get('/trial-status', protect, getTrialStatus);

// ---------- PRODUCTS ----------
router.get('/products', protect, getProducts);
router.post('/products/add', protect, upload.array('images', 5), addProduct);  // ✅ Added upload middleware
router.delete('/products/:productId', protect, deleteProduct);

// ---------- EMPLOYEES ----------
router.get('/employees', protect, getEmployees);
router.post('/employees/add', protect, addEmployee);
router.delete('/employees/:employeeId', protect, deleteEmployee);

router.post('/withdrawal/request', protect, requestWithdrawal);
router.get('/withdrawal/history', protect, getWithdrawalHistory);
// ---------- SUBSCRIPTION ----------
router.post('/subscription/start-trial', protect, startFreeTrial);
router.post('/subscription/upgrade', protect, upgradeSubscriptionRequest);
router.post('/subscription/cancel-request', protect, cancelSubscriptionRequest);
router.post('/subscription/extend-trial', protect, requestTrialExtension);

export default router;