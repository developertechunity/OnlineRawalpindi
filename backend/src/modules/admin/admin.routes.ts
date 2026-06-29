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
    deleteAnnouncement
} from './admin.controller.js';
import { protect, restrictTo } from '../auth/auth.middleware.js';

const router = Router();

// Base Platform Traffic
router.get('/vendors', protect, restrictTo('admin'), getVendors);
router.put('/vendor/:id/status', protect, restrictTo('admin'), updateVendorStatus);
router.get('/riders', protect, restrictTo('admin'), getRiders);
router.get('/customers', protect, restrictTo('admin'), getCustomers);

// Corporate Infrastructure 
router.get('/employees', protect, restrictTo('admin'), getEmployees);
router.post('/employee', protect, restrictTo('admin'), createEmployee);
router.delete('/employee/:id', protect, restrictTo('admin'), deleteEmployee);

// Revenue Models
router.get('/commissions', protect, restrictTo('admin'), getCommissions);
router.post('/commission', protect, restrictTo('admin'), createCommission);
router.delete('/commission/:id', protect, restrictTo('admin'), deleteCommission);

// Vouchers Marketing
router.get('/coupons', protect, restrictTo('admin'), getCoupons);
router.post('/coupon', protect, restrictTo('admin'), createCoupon);
router.delete('/coupon/:id', protect, restrictTo('admin'), deleteCoupon);

// Network Broadcast System
router.get('/announcements', protect, restrictTo('admin'), getAnnouncements);
router.post('/announcement', protect, restrictTo('admin'), createAnnouncement);
router.delete('/announcement/:id', protect, restrictTo('admin'), deleteAnnouncement);

export default router;