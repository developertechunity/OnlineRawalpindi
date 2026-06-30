import { Router } from 'express';
import { 
    getVendors, 
    updateVendorStatus,
    getVendorDetails,
    getPendingSubscriptionRequests,
    approveSubscriptionRequest,
    getSubscriptionStatistics,
    getVendorAnalytics,
    bulkUpdateVendorStatus,
    deleteVendor
} from './admin.controller.js';
import { protect, restrictTo } from '../auth/auth.middleware.js';

const router = Router();

// ============================================
// AUTHENTICATION & AUTHORIZATION
// All routes require: 
// 1. Valid JWT token (protect)
// 2. User role must be 'admin' (restrictTo)
// ============================================

// ============================================
// VENDOR MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/vendors
 * Get all vendors with their details
 * Query params: 
 *   - status: filter by approval status (pending/approved/rejected)
 *   - subscription: filter by subscription plan (free/monthly/yearly)
 *   - search: search by name or email
 *   - limit: number of results (default: 20)
 *   - page: page number (default: 1)
 */
router.get(
    '/vendors', 
    protect, 
    restrictTo('admin'), 
    getVendors
);

/**
 * GET /api/admin/vendors/:id
 * Get complete vendor details including products and employees
 */
router.get(
    '/vendors/:id', 
    protect, 
    restrictTo('admin'), 
    getVendorDetails
);

/**
 * PUT /api/admin/vendors/:id/status
 * Update single vendor approval status
 * Body: { status: 'approved' | 'rejected' | 'pending' }
 */
router.put(
    '/vendors/:id/status', 
    protect, 
    restrictTo('admin'), 
    updateVendorStatus
);

/**
 * PUT /api/admin/vendors/bulk/status
 * Bulk update vendor approval status
 * Body: { vendorIds: ['id1', 'id2'], status: 'approved' | 'rejected' | 'pending' }
 */
router.put(
    '/vendors/bulk/status', 
    protect, 
    restrictTo('admin'), 
    bulkUpdateVendorStatus
);

/**
 * DELETE /api/admin/vendors/:id
 * Delete vendor and all associated data (products, employees)
 */
router.delete(
    '/vendors/:id', 
    protect, 
    restrictTo('admin'), 
    deleteVendor
);

// ============================================
// SUBSCRIPTION MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/subscription-requests
 * Get all pending subscription/trial extension requests
 */
router.get(
    '/subscription-requests', 
    protect, 
    restrictTo('admin'), 
    getPendingSubscriptionRequests
);

/**
 * POST /api/admin/subscription-requests/:vendorId/approve
 * Approve or reject subscription/trial extension request
 * Body: { 
 *   action: 'approve' | 'reject', 
 *   extensionDays: number (optional, for trial extension),
 *   adminNotes: string (optional)
 * }
 */
router.post(
    '/subscription-requests/:vendorId/approve', 
    protect, 
    restrictTo('admin'), 
    approveSubscriptionRequest
);

/**
 * GET /api/admin/subscription-stats
 * Get subscription statistics
 * Returns: total vendors, pending requests, trial ending soon, expired trials, etc.
 */
router.get(
    '/subscription-stats', 
    protect, 
    restrictTo('admin'), 
    getSubscriptionStatistics
);

// ============================================
// ANALYTICS ROUTES
// ============================================

/**
 * GET /api/admin/analytics/vendors
 * Get vendor analytics (top vendors by products, earnings, orders)
 */
router.get(
    '/analytics/vendors', 
    protect, 
    restrictTo('admin'), 
    getVendorAnalytics
);

// ============================================
// LEGACY SUPPORT ROUTES (Backward Compatibility)
// ============================================

/**
 * GET /api/admin/vendor/:id
 * Legacy route - redirects to /vendors/:id
 */
router.get(
    '/vendor/:id', 
    protect, 
    restrictTo('admin'), 
    getVendorDetails
);

/**
 * PUT /api/admin/vendor/:id/status
 * Legacy route - redirects to /vendors/:id/status
 */
router.put(
    '/vendor/:id/status', 
    protect, 
    restrictTo('admin'), 
    updateVendorStatus
);

export default router;