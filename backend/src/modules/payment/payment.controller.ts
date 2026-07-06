// backend/src/modules/payment/payment.controller.ts

// backend/src/modules/payment/payment.controller.ts

import { Request, Response } from 'express';
import PaymentService from './payment.service.js';
import Payment from './payment.model.js';
import User from '../auth/User.model.js';
import Order from '../order/Order.model.js';

// ============================================
// 1. CREATE PAYMENT (COD, EasyPaisa, JazzCash)
// ============================================
export const createPayment = async (req: any, res: Response): Promise<any> => {
    try {
        const {
            orderId,
            amount,
            method,
            customerPhone,
            riderId
        } = req.body;

        const customerId = req.userId;

        // ✅ Only allow Pakistan methods
        if (!['easypaisa', 'jazzcash', 'cod'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Use: easypaisa, jazzcash, or cod'
            });
        }

        const user = await User.findById(customerId);
        if (!user || user.role !== 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Only customers can create payments'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.customerId.toString() !== customerId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to pay for this order'
            });
        }

        const result = await PaymentService.createPayment(
            orderId,
            order.orderNumber,
            customerId,
            order.vendorId,
            amount || order.totalAmount,
            method,
            customerPhone,
            riderId
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Create Payment Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ... rest of the controller functions remain same
// ============================================
// 2. CONFIRM COD PAYMENT - FOR RIDER
// ============================================
export const confirmCOD = async (req: any, res: Response): Promise<any> => {
    try {
        const { orderId, amount } = req.body;
        const riderId = req.userId;

        const user = await User.findById(riderId);
        if (!user || user.role !== 'rider') {
            return res.status(403).json({
                success: false,
                message: 'Only riders can confirm COD'
            });
        }

        const result = await PaymentService.confirmCOD(orderId, riderId, amount);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Confirm COD Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 3. DEPOSIT COD TO ADMIN - FOR RIDER
// ============================================
export const depositCODToAdmin = async (req: any, res: Response): Promise<any> => {
    try {
        const { orderId } = req.body;
        const riderId = req.userId;
        const adminId = req.userId; // Assuming admin is logged in

        const user = await User.findById(riderId);
        if (!user || (user.role !== 'rider' && user.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Only riders or admin can deposit COD'
            });
        }

        const result = await PaymentService.depositCODToAdmin(orderId, riderId, adminId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Deposit COD Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 4. PROCESS REFUND - FOR ADMIN/VENDOR
// ============================================
export const processRefund = async (req: any, res: Response): Promise<any> => {
    try {
        const { paymentId } = req.params;
        const { reason, amount } = req.body;
        const adminId = req.userId;

        const user = await User.findById(adminId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can process refunds'
            });
        }

        const result = await PaymentService.processRefund(paymentId, adminId, reason, amount);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Process Refund Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 5. GET PAYMENTS - FOR ALL ROLES
// ============================================
export const getPayments = async (req: any, res: Response): Promise<any> => {
    try {
        const userId = req.userId;
        const { status, method, fromDate, toDate, limit } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const result = await PaymentService.getPaymentsByRole(
            userId,
            user.role,
            { status, method, fromDate, toDate, limit: limit || 100 }
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Get Payments Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 6. GET PAYMENT DETAILS - FOR ALL ROLES
// ============================================
export const getPaymentDetails = async (req: any, res: Response): Promise<any> => {
    try {
        const { paymentId } = req.params;
        const userId = req.userId;

        const payment = await Payment.findById(paymentId)
            .populate('customerId', 'name email phone')
            .populate('vendorId', 'name email shopName')
            .populate('riderId', 'name email phone');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check authorization based on role
        const authorized = (
            user.role === 'admin' ||
            payment.customerId._id.toString() === userId ||
            payment.vendorId._id.toString() === userId ||
            (payment.riderId && payment.riderId._id.toString() === userId)
        );

        if (!authorized) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this payment'
            });
        }

        return res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error: any) {
        console.error('Get Payment Details Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 7. GET PAYMENT STATISTICS - FOR ADMIN
// ============================================
export const getPaymentStatistics = async (req: any, res: Response): Promise<any> => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can view statistics'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalPayments, todayPayments, pendingPayments, failedPayments] = await Promise.all([
            Payment.countDocuments(),
            Payment.countDocuments({ createdAt: { $gte: today } }),
            Payment.countDocuments({ status: 'pending' }),
            Payment.countDocuments({ status: 'failed' })
        ]);

        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalCommission = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
        ]);

        const paymentsByMethod = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalPayments,
                todayPayments,
                pendingPayments,
                failedPayments,
                totalRevenue: totalRevenue[0]?.total || 0,
                totalCommission: totalCommission[0]?.total || 0,
                paymentsByMethod
            }
        });

    } catch (error: any) {
        console.error('Get Payment Statistics Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 8. WEBHOOKS
// ============================================
export const handleStripeWebhook = async (req: Request, res: Response): Promise<any> => {
    try {
        const signature = req.headers['stripe-signature'] as string;
        const result = await PaymentService.handleStripeWebhook(req.body, signature);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Stripe Webhook Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const handleEasyPaisaWebhook = async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await PaymentService.handleEasyPaisaWebhook(req.body);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('EasyPaisa Webhook Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const handleJazzCashWebhook = async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await PaymentService.handleJazzCashWebhook(req.body);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('JazzCash Webhook Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};