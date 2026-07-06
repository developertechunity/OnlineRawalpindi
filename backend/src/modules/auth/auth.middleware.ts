import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../auth/User.model.js';

interface DecodedToken {
    id: string;
    role: string;
    iat: number;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: any;
            userId?: string;
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No validation token found.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as DecodedToken;

        const currentUser = await User.findById(decoded.id).select('-password');
        if (!currentUser) {
            return res.status(401).json({ 
                success: false, 
                message: 'The account owning this authentication token no longer exists.' 
            });
        }

        req.user = currentUser;
        req.userId = currentUser._id.toString();
        next();
    } catch (error: any) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired authorization token.',
            error: error.message 
        });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You do not have permission to execute this administrative action.'
            });
        }
        next();
    };
};