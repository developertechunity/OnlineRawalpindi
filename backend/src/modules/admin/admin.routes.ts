// backend/src/modules/admin/admin.routes.ts

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../auth/User.model.js';
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
    getSubtypesByType,
    getVendorBusinesses,
    getBusinessById,
    updateBusiness,
    deleteBusinessSubscription,
    updateVendorId
} from './admin.controller.js';
import { protect, restrictTo } from './admin.middleware.js';

const router = Router();

// ============================================
// ✅ MULTER CONFIGURATION
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDF are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter
});

const uploadVendorFiles = upload.fields([
    { name: 'cnicFront', maxCount: 1 },
    { name: 'cnicBack', maxCount: 1 },
    { name: 'businessLicense', maxCount: 1 },
    { name: 'businessLogo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]);

const uploadBusinessFiles = upload.fields([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'businessLogo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]);

// ============================================
// ✅ VENDORS - ALL ROUTES
// ============================================
router.get('/vendors', protect, restrictTo('admin'), getVendors);
router.put('/vendor/:id/status', protect, restrictTo('admin'), updateVendorStatus);
router.delete('/vendor/:id', protect, restrictTo('admin'), deleteVendor);

// ✅ EDIT PROFILE ROUTE - FIXED
router.put('/vendor/:id', protect, restrictTo('admin'), uploadVendorFiles, updateVendor);

// ✅ Vendor ID update
router.put('/vendor/:id/vendor-id', protect, restrictTo('admin'), updateVendorId);

// ✅ Single vendor fetch
router.get('/vendor/:id', protect, restrictTo('admin'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const vendor = await User.findOne({ _id: id, role: 'vendor' }).select('-password');
        
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        res.json({
            success: true,
            vendor: {
                id: vendor._id,
                shopName: vendor.shopName || '',
                ownerName: vendor.name || '',
                email: vendor.email || '',
                phone: vendor.phone || '',
                shopAddress: vendor.shopAddress || '',
                ntnNumber: vendor.ntnNumber || '',
                whatsapp: vendor.whatsapp || '',
                city: vendor.city || '',
                country: vendor.country || '',
                streetAddress: vendor.streetAddress || '',
                status: vendor.approvalStatus || 'pending',
                date: vendor.createdAt ? new Date(vendor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                cnicFront: vendor.cnicFront || '',
                cnicBack: vendor.cnicBack || '',
                businessLicense: vendor.businessLicense || '',
                businessLogo: vendor.businessLogo || '',
                coverImage: vendor.coverImage || '',
                galleryImages: vendor.galleryImages || [],
                businessType: vendor.businessType || '',
                businessTimings: vendor.businessTimings || '',
                businessPhone: vendor.businessPhone || '',
                businessWhatsapp: vendor.businessWhatsapp || '',
                businessLandline: vendor.businessLandline || '',
                businessEmail: vendor.businessEmail || '',
                businessCity: vendor.businessCity || '',
                businessCountry: vendor.businessCountry || '',
                businessNtn: vendor.businessNtn || '',
                businessWebsite: vendor.businessWebsite || '',
                socialLink: vendor.socialLink || '',
                mapLocation: vendor.mapLocation || ''
            }
        });
    } catch (error: any) {
        console.error('❌ Error fetching vendor:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

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
// BUSINESS SUBSCRIPTIONS
// ============================================
router.get('/business-subscriptions', protect, restrictTo('admin'), getBusinessSubscriptionRequests);
router.put('/business-subscription/:requestId/approve', protect, restrictTo('admin'), approveBusinessSubscriptionRequest);
router.put('/business-subscription/:requestId/reject', protect, restrictTo('admin'), rejectBusinessSubscriptionRequest);
router.delete('/business-subscription/:id', protect, restrictTo('admin'), deleteBusinessSubscription);

// ============================================
// BUSINESS TYPES & SUBTYPES
// ============================================
router.get('/business/types', protect, restrictTo('admin'), getBusinessTypes);
router.get('/business/subtypes/:typeId', protect, restrictTo('admin'), getSubtypesByType);

// ============================================
// BUSINESS ROUTES
// ============================================
router.get('/vendor/:vendorId/businesses', protect, restrictTo('admin'), getVendorBusinesses);
router.get('/business/:businessId', protect, restrictTo('admin'), getBusinessById);
router.put('/business/:businessId', protect, restrictTo('admin'), uploadBusinessFiles, updateBusiness);

export default router;