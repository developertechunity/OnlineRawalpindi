// backend/src/modules/admin/admin.routes.ts

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
    getWithdrawals,
    updateWithdrawalStatus,
    deleteVendor,
    updateVendor,
    getBusinessSubscriptionRequests,
    approveBusinessSubscriptionRequest,
    rejectBusinessSubscriptionRequest,
    getBusinessTypes,
    getSubtypesByType
} from './admin.controller.js';
import { protect, restrictTo } from './admin.middleware.js';

const router = Router();

// ============================================
// VENDORS
// ============================================
router.get('/vendors', protect, restrictTo('admin'), getVendors);
router.put('/vendor/:id/status', protect, restrictTo('admin'), updateVendorStatus);
router.delete('/vendor/:id', protect, restrictTo('admin'), deleteVendor);
router.put('/vendor/:id', protect, restrictTo('admin'), updateVendor);

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
// WITHDRAWALS
// ============================================
router.get('/withdrawals', protect, restrictTo('admin'), getWithdrawals);
router.put('/withdrawal/:id/status', protect, restrictTo('admin'), updateWithdrawalStatus);

// ============================================
// ✅ BUSINESS SUBSCRIPTIONS (ONLY)
// ============================================
router.get('/business-subscriptions', protect, restrictTo('admin'), getBusinessSubscriptionRequests);
router.put('/business-subscription/:requestId/approve', protect, restrictTo('admin'), approveBusinessSubscriptionRequest);
router.put('/business-subscription/:requestId/reject', protect, restrictTo('admin'), rejectBusinessSubscriptionRequest);

// ============================================
// ✅ BUSINESS TYPES & SUBTYPES
// ============================================
router.get('/business/types', protect, restrictTo('admin'), getBusinessTypes);
router.get('/business/subtypes/:typeId', protect, restrictTo('admin'), getSubtypesByType);

export default router;