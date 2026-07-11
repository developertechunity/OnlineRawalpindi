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
    requestTrialExtension,
    getTrialStatus,
    startFreeTrial,
    cancelSubscriptionRequest,
    requestWithdrawal,
    getWithdrawalHistory,
    // Business Registration Functions
    getBusinessTypes,
    getSubtypesByType,
    registerBusiness,
    getVendorBusinesses,
    switchDefaultBusiness,
    getSubscriptionStatus,
    requestBusinessSubscription,
    getBusinessSubscriptionStatus,
    getBusinessSubscriptionHistory
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
// DASHBOARD
// =========================================================
router.get('/dashboard-summary', protect, getVendorDashboardData);
router.get('/trial-status', protect, getTrialStatus);

// =========================================================
// ✅ SUBSCRIPTION STATUS
// =========================================================
router.get('/subscription/status', protect, getSubscriptionStatus);

// =========================================================
// ✅ BUSINESS SUBSCRIPTION ROUTES
// =========================================================
router.post('/business/:businessId/subscription/request', protect, requestBusinessSubscription);
router.get('/business/:businessId/subscription/status', protect, getBusinessSubscriptionStatus);
router.get('/business/subscriptions/history', protect, getBusinessSubscriptionHistory);

// =========================================================
// PRODUCTS
// =========================================================
router.get('/products', protect, getProducts);
router.post('/products/add', protect, upload.array('images', 5), addProduct);
router.delete('/products/:productId', protect, deleteProduct);

// =========================================================
// EMPLOYEES
// =========================================================
router.get('/employees', protect, getEmployees);
router.post('/employees/add', protect, addEmployee);
router.delete('/employees/:employeeId', protect, deleteEmployee);

// =========================================================
// WITHDRAWAL
// =========================================================
router.post('/withdrawal/request', protect, requestWithdrawal);
router.get('/withdrawal/history', protect, getWithdrawalHistory);

// =========================================================
// SUBSCRIPTION - TRIAL & UPGRADE
// =========================================================
router.post('/subscription/start-trial', protect, startFreeTrial);
router.post('/subscription/cancel-request', protect, cancelSubscriptionRequest);
router.post('/subscription/extend-trial', protect, requestTrialExtension);

// =========================================================
// BUSINESS REGISTRATION ROUTES
// =========================================================
router.get('/business/types', protect, getBusinessTypes);
router.get('/business/subtypes/:typeId', protect, getSubtypesByType);
router.post('/business/register', protect, upload.fields([
    { name: 'businessLogo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]), registerBusiness);
router.get('/business/list', protect, getVendorBusinesses);
router.put('/business/default/:businessId', protect, switchDefaultBusiness);

export default router;