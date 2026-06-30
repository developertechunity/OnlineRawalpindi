import { Request, Response } from 'express';
import Rider from './rider.model.js';
import User from '../auth/User.model.js';

export const getRiderProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id || (req as any).userId;
        
        console.log('📋 Fetching rider profile for:', userId);

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Find or create rider
        let rider = await Rider.findOne({ userId }).populate('userId', 'name email phone');
        
        if (!rider) {
            console.log('🆕 Creating new rider profile...');
            rider = await Rider.create({
                userId: userId,
                vehicleType: 'bike',
                vehicleNumber: 'N/A',
                licenseNumber: 'N/A',
                zone: ['Rawalpindi'],
                status: 'offline',
                isActive: true,
                totalDeliveries: 0,
                totalEarnings: 0,
                rating: 0
            });
            rider = await Rider.findOne({ userId }).populate('userId', 'name email phone');
        }

        res.json({
            success: true,
            rider: {
                id: rider._id,
                userId: rider.userId,
                vehicleType: rider.vehicleType,
                vehicleNumber: rider.vehicleNumber,
                licenseNumber: rider.licenseNumber,
                zone: rider.zone,
                status: rider.status,
                totalDeliveries: rider.totalDeliveries,
                totalEarnings: rider.totalEarnings,
                rating: rider.rating,
                isActive: rider.isActive,
                phone: user.phone || '',
                address: '',
                joinedDate: rider.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
            }
        });
    } catch (error: any) {
        console.error('❌ Profile error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const getRiderDeliveries = async (req: Request, res: Response) => {
    try {
        const mockDeliveries = [
            {
                id: '1',
                orderId: '#ORD-001',
                customer: 'Ali Khan',
                customerPhone: '03001234567',
                address: 'Saddar, Rawalpindi',
                amount: 500,
                status: 'pending',
                codAmount: 500,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                orderId: '#ORD-002',
                customer: 'Sara Ahmed',
                customerPhone: '03007654321',
                address: 'Bahria Town, Rawalpindi',
                amount: 300,
                status: 'delivered',
                codAmount: 0,
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        res.json({
            success: true,
            deliveries: mockDeliveries
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const getRiderStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id || (req as any).userId;
        const rider = await Rider.findOne({ userId });
        
        res.json({
            success: true,
            stats: {
                todayDeliveries: 5,
                totalDeliveries: rider?.totalDeliveries || 0,
                earningsToday: 1200,
                weeklyEarnings: 8500,
                totalEarnings: rider?.totalEarnings || 0,
                pendingDeliveries: 2,
                completedDeliveries: 3,
                cancelledDeliveries: 0
            }
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const getRiderStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id || (req as any).userId;
        const rider = await Rider.findOne({ userId });
        
        res.json({
            success: true,
            status: rider?.status || 'offline'
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const updateRiderStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id || (req as any).userId;
        const { status } = req.body;

        if (!['online', 'offline', 'busy'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const rider = await Rider.findOneAndUpdate(
            { userId },
            { status },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: `Status updated to ${status}`,
            status: rider.status
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const updateDeliveryStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['picked', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        if (status === 'delivered') {
            const userId = (req as any).user?._id || (req as any).userId;
            await Rider.findOneAndUpdate(
                { userId },
                { 
                    $inc: { 
                        totalDeliveries: 1,
                        totalEarnings: 200 
                    } 
                }
            );
        }

        res.json({
            success: true,
            message: `Delivery ${status} successfully`,
            deliveryId: id,
            status: status
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};