import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from './User.model.js';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, no token' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as any;
        
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        (req as any).user = user;
        (req as any).userId = user._id;
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, token failed' 
        });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};