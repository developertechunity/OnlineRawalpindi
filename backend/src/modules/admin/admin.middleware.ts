import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../auth/User.model.js'; // Ek step baahar nikal kar auth folder me jaye

interface DecodedToken {
    id: string;
    role: string;
    iat: number;
    exp: number;
}

// Extend Express Request to include user info globally
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

// ============================================
// 1. ROUTE PROTECT MIDDLEWARE (JWT Check)
// ============================================
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token;
        
        // Authorization header me check karein: Bearer <token>
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No validation token found.' 
            });
        }

        // Verify Token Natively
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as DecodedToken;

        // Fetch User from DB and verify if it still exists
        const currentUser = await User.findById(decoded.id).select('-password');
        if (!currentUser) {
            return res.status(401).json({ 
                success: false, 
                message: 'The account owning this authentication token no longer exists.' 
            });
        }

        // Pass user object dynamically into request pipeline
        req.user = currentUser;
        next();
    } catch (error: any) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired authorization token.',
            error: error.message 
        });
    }
};

// ============================================
// 2. ROLE BASED AUTHORIZATION SYSTEM
// ============================================
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // req.user check array matching
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You do not have permission to execute this administrative action.'
            });
        }
        next();
    };
};