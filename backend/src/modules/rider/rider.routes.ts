import { Router } from 'express';
import {
    getRiderProfile,
    getRiderDeliveries,
    getRiderStats,
    getRiderStatus,
    updateRiderStatus,
    updateDeliveryStatus
} from './rider.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = Router();

// ============================================
// RIDER ROUTES - PROTECTED
// ============================================
router.get('/rider/profile', protect, getRiderProfile);
router.get('/rider/deliveries', protect, getRiderDeliveries);
router.get('/rider/stats', protect, getRiderStats);
router.get('/rider/status', protect, getRiderStatus);
router.put('/rider/status', protect, updateRiderStatus);
router.put('/rider/delivery/:id/status', protect, updateDeliveryStatus);

export default router;