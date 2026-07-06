import { Router } from 'express';
import { 
    getVendors, 
    updateVendorStatus, 
    getRiders, 
    getCustomers,
    getEmployees,
    createEmployee,
    deleteEmployee,
    getCommissions,
    createCommission,
    deleteCommission,
    getCoupons,
    createCoupon,
    deleteCoupon,
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    // ✅ IMPORT WITHDRAWAL & SUBSCRIPTION FUNCTIONS
    getWithdrawals,
    updateWithdrawalStatus,
    getSubscriptionRequests,
    updateSubscriptionStatus
} from './admin.controller.js';
import { protect, restrictTo } from '../auth/auth.middleware.js';

const router = Router();

// ============================================
// VENDORS
// ============================================
router.get('/vendors', protect, restrictTo('admin'), getVendors);
router.put('/vendor/:id/status', protect, restrictTo('admin'), updateVendorStatus);

// ============================================
// RIDERS & CUSTOMERS
// ============================================
router.get('/riders', protect, restrictTo('admin'), getRiders);
router.get('/customers', protect, restrictTo('admin'), getCustomers);

// ============================================
// EMPLOYEES
// ============================================
router.get('/employees', protect, restrictTo('admin'), getEmployees);
router.post('/employee', protect, restrictTo('admin'), createEmployee);
router.delete('/employee/:id', protect, restrictTo('admin'), deleteEmployee);

// ============================================
// COMMISSIONS
// ============================================
router.get('/commissions', protect, restrictTo('admin'), getCommissions);
router.post('/commission', protect, restrictTo('admin'), createCommission);
router.delete('/commission/:id', protect, restrictTo('admin'), deleteCommission);

// ============================================
// COUPONS
// ============================================
router.get('/coupons', protect, restrictTo('admin'), getCoupons);
router.post('/coupon', protect, restrictTo('admin'), createCoupon);
router.delete('/coupon/:id', protect, restrictTo('admin'), deleteCoupon);

// ============================================
// ANNOUNCEMENTS
// ============================================
router.get('/announcements', protect, restrictTo('admin'), getAnnouncements);
router.post('/announcement', protect, restrictTo('admin'), createAnnouncement);
router.delete('/announcement/:id', protect, restrictTo('admin'), deleteAnnouncement);

// ============================================
// ✅ WITHDRAWALS
// ============================================
router.get('/withdrawals', protect, restrictTo('admin'), getWithdrawals);
router.put('/withdrawal/:id/status', protect, restrictTo('admin'), updateWithdrawalStatus);

// ============================================
// ✅ SUBSCRIPTIONS
// ============================================
router.get('/subscriptions', protect, restrictTo('admin'), getSubscriptionRequests);
router.put('/subscription/:id/status', protect, restrictTo('admin'), updateSubscriptionStatus);

export default router;