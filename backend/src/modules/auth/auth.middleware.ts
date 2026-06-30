import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from './User.model.js';  // ✅ Same folder se import

export interface AuthenticatedRequest extends Request {
    userId?: string;
    userRole?: string;
}

// ============================================
// 1. PROTECT - Verify JWT Token
// ============================================
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as { userId: string; role: string };
        
        // Check if user exists
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists. Please login again.'
            });
        }

        // Check if user is active
        if (user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated.'
            });
        }

        // Attach user info to request
        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
                expired: true
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Token verification failed.'
        });
    }
};

// ============================================
// 2. RESTRICT TO - Role-based Access Control
// ============================================
export const restrictTo = (...allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
        if (!req.userRole) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. User role not found.'
            });
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Only ${allowedRoles.join(' or ')} can perform this action.`
            });
        }

        next();
    };
};

// ============================================
// 3. CONVENIENCE MIDDLEWARE FUNCTIONS
// ============================================

// Admin only
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.userRole || req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};

// Vendor only
export const isVendor = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.userRole || req.userRole !== 'vendor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Vendor only.'
        });
    }
    next();
};

// Admin or Vendor
export const isAdminOrVendor = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.userRole || !['admin', 'vendor'].includes(req.userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Vendor only.'
        });
    }
    next();
};

// Customer only
export const isCustomer = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.userRole || req.userRole !== 'customer') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Customer only.'
        });
    }
    next();
};

// Rider only
export const isRider = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.userRole || req.userRole !== 'rider') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Rider only.'
        });
    }
    next();
};

// ============================================
// 4. VENDOR SPECIFIC MIDDLEWARE
// ============================================

// Check if vendor is approved by admin
export const isVendorApproved = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized.'
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (user.role !== 'vendor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Vendor only.'
            });
        }

        if (user.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Your vendor account is pending admin approval.',
                approvalStatus: user.approvalStatus
            });
        }

        next();
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// Check if vendor has active subscription or valid trial
export const hasActiveSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized.'
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Check if trial is valid
        let isTrialValid = false;
        if (user.subscriptionPlan === 'free' && user.trialEndDate) {
            const now = new Date();
            const trialEnd = new Date(user.trialEndDate);
            isTrialValid = now < trialEnd;
        }

        // Check subscription status
        const hasValidSubscription = user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active';

        if (!isTrialValid && !hasValidSubscription) {
            const daysRemaining = user.trialEndDate ? 
                Math.ceil((new Date(user.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

            return res.status(403).json({
                success: false,
                message: 'Your subscription has expired. Please upgrade to continue.',
                subscriptionStatus: user.subscriptionStatus,
                trialEnded: daysRemaining <= 0,
                daysRemaining: daysRemaining > 0 ? daysRemaining : 0
            });
        }

        next();
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

export default {
    protect,
    restrictTo,
    isAdmin,
    isVendor,
    isAdminOrVendor,
    isCustomer,
    isRider,
    isVendorApproved,
    hasActiveSubscription
};