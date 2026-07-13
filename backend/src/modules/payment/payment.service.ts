// backend/src/modules/payment/payment.service.ts

import mongoose from 'mongoose';
import Payment from './payment.model.js';
import User from '../auth/User.model.js';
import Order from '../order/Order.model.js';

export class PaymentService {

    // ============================================
    // 1. CREATE PAYMENT
    // ============================================
    static async createPayment(
        orderId: string,
        orderNumber: string,
        customerId: string,
        vendorId: string,
        amount: number,
        method: 'easypaisa' | 'jazzcash' | 'cod',
        customerPhone?: string,
        riderId?: string,
        isSubscription: boolean = false,
        subscriptionPlan?: 'monthly' | 'yearly'
    ): Promise<any> {
        try {
            const commissionAmount = amount * 0.01;
            const riderDeliveryFee = amount * 0.05;
            const vendorAmount = amount - commissionAmount - riderDeliveryFee;
            
            let result;
            let transactionId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

            switch (method) {
                case 'easypaisa':
                    if (!customerPhone) throw new Error('Customer phone required for EasyPaisa');
                    result = await this.processEasyPaisa(amount, orderId, customerId, vendorId, customerPhone);
                    break;
                case 'jazzcash':
                    if (!customerPhone) throw new Error('Customer phone required for JazzCash');
                    result = await this.processJazzCash(amount, orderId, customerId, vendorId, customerPhone);
                    break;
                case 'cod':
                    result = await this.processCOD(orderId, customerId, vendorId, riderId);
                    break;
                default:
                    throw new Error('Invalid payment method');
            }

            const payment = await Payment.create({
                orderId,
                orderNumber,
                customerId,
                vendorId,
                riderId: riderId || null,
                amount,
                commissionAmount,
                vendorAmount,
                riderDeliveryFee: riderId ? riderDeliveryFee : 0,
                currency: 'PKR',
                method,
                transactionId: result.transactionId || transactionId,
                status: method === 'cod' ? 'pending' : 'processing',
                paymentData: result,
                isSubscription,
                subscriptionPlan: isSubscription ? subscriptionPlan : null,
                subscriptionStartDate: isSubscription ? new Date() : null,
                subscriptionEndDate: isSubscription ? 
                    new Date(Date.now() + (subscriptionPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000) : null,
                ...(method === 'cod' && { codCollectedBy: riderId })
            });

            if (payment.status === 'success') {
                await User.findByIdAndUpdate(vendorId, {
                    $inc: { availableBalance: vendorAmount }
                });
            }

            return {
                success: true,
                paymentId: payment._id,
                transactionId: payment.transactionId,
                status: payment.status,
                amount: payment.amount,
                commission: payment.commissionAmount,
                vendorAmount: payment.vendorAmount,
                riderFee: payment.riderDeliveryFee,
                ...result
            };

        } catch (error: any) {
            console.error('Create Payment Error:', error);
            return { success: false, message: error.message };
        }
    }

    // ============================================
    // 2. PROCESS EASYPAISA
    // ============================================
    private static async processEasyPaisa(
        amount: number,
        orderId: string,
        customerId: string,
        vendorId: string,
        customerPhone: string
    ): Promise<any> {
        const transactionId = `EP${Date.now()}${Math.floor(Math.random() * 1000)}`;
        console.log(`📱 EasyPaisa Payment: ${transactionId} - PKR ${amount}`);
        return { success: true, transactionId, status: 'processing' };
    }

    // ============================================
    // 3. PROCESS JAZZCASH
    // ============================================
    private static async processJazzCash(
        amount: number,
        orderId: string,
        customerId: string,
        vendorId: string,
        customerPhone: string
    ): Promise<any> {
        const transactionId = `JC${Date.now()}${Math.floor(Math.random() * 1000)}`;
        console.log(`📱 JazzCash Payment: ${transactionId} - PKR ${amount}`);
        return { success: true, transactionId, status: 'processing' };
    }

    // ============================================
    // 4. PROCESS COD
    // ============================================
    private static async processCOD(
        orderId: string,
        customerId: string,
        vendorId: string,
        riderId?: string
    ): Promise<any> {
        const transactionId = `COD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        return {
            success: true,
            transactionId,
            status: 'pending',
            riderId: riderId || null,
            notes: 'Cash on Delivery - Payment collected by rider'
        };
    }

    // ============================================
    // 5. CONFIRM COD
    // ============================================
    static async confirmCOD(orderId: string, riderId: string, amount: number): Promise<any> {
        try {
            const payment = await Payment.findOne({ orderId, method: 'cod' });
            if (!payment) throw new Error('COD payment not found');

            payment.status = 'success';
            payment.codCollectedBy = new mongoose.Types.ObjectId(riderId);
            payment.paymentData = { ...payment.paymentData, collectedAt: new Date(), collectedBy: riderId, amount };
            await payment.save();

            await User.findByIdAndUpdate(payment.vendorId, {
                $inc: { availableBalance: payment.vendorAmount }
            });

            await User.findByIdAndUpdate(riderId, {
                $inc: { totalEarnings: payment.riderDeliveryFee }
            });

            return { success: true, message: 'COD confirmed', paymentId: payment._id };
        } catch (error: any) {
            console.error('Confirm COD Error:', error);
            return { success: false, message: error.message };
        }
    }

    // ============================================
    // 6. DEPOSIT COD TO ADMIN
    // ============================================
    static async depositCODToAdmin(orderId: string, riderId: string, adminId: string): Promise<any> {
        try {
            const payment = await Payment.findOne({ orderId, method: 'cod' });
            if (!payment) throw new Error('COD payment not found');
            if (payment.codDepositedToAdmin) throw new Error('COD already deposited');

            payment.codDepositedToAdmin = true;
            payment.codDepositDate = new Date();
            payment.adminId = new mongoose.Types.ObjectId(adminId);
            await payment.save();

            return { success: true, message: 'COD deposited to admin' };
        } catch (error: any) {
            console.error('Deposit COD Error:', error);
            return { success: false, message: error.message };
        }
    }

    // ============================================
    // 7. VENDOR SUBSCRIPTION - FIXED
    // ============================================
    static async processVendorSubscription(
        vendorId: string,
        plan: 'monthly' | 'yearly',
        amount: number
    ): Promise<any> {
        try {
            const transactionId = `SUB${Date.now()}${Math.floor(Math.random() * 1000)}`;
            
            // ✅ FIXED: Properly use mongoose.Types.ObjectId
            const orderId = new mongoose.Types.ObjectId();
            
            const payment = await Payment.create({
                orderId: orderId,
                orderNumber: `SUB-${Date.now()}`,
                customerId: vendorId,
                vendorId: vendorId,
                amount,
                commissionAmount: amount * 0.01,
                vendorAmount: amount - (amount * 0.01),
                currency: 'PKR',
                method: 'easypaisa',
                transactionId,
                status: 'success',
                isSubscription: true,
                subscriptionPlan: plan,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
                notes: `Vendor subscription: ${plan} plan`
            });

            await User.findByIdAndUpdate(vendorId, {
                subscriptionPlan: plan,
                subscriptionStatus: 'active',
                subscriptionEndDate: payment.subscriptionEndDate
            });

            return { success: true, payment, transactionId };
        } catch (error: any) {
            console.error('Subscription Error:', error);
            return { success: false, message: error.message };
        }
    }

    // ============================================
    // 8. GET PAYMENTS BY ROLE
    // ============================================
    static async getPaymentsByRole(userId: string, role: string, filters: any = {}): Promise<any> {
        try {
            let query: any = {};

            switch (role) {
                case 'admin': break;
                case 'vendor': query.vendorId = userId; break;
                case 'customer': query.customerId = userId; break;
                case 'rider': query.riderId = userId; break;
                default: throw new Error('Invalid role');
            }

            if (filters.status) query.status = filters.status;
            if (filters.method) query.method = filters.method;
            if (filters.isSubscription !== undefined) query.isSubscription = filters.isSubscription;

            const payments = await Payment.find(query)
                .sort({ createdAt: -1 })
                .limit(filters.limit || 100)
                .populate('customerId', 'name email')
                .populate('vendorId', 'name email shopName')
                .populate('riderId', 'name email');

            const summary = {
                totalPayments: payments.length,
                totalAmount: payments.reduce((s, p) => s + p.amount, 0),
                totalCommission: payments.reduce((s, p) => s + p.commissionAmount, 0),
                totalVendorAmount: payments.reduce((s, p) => s + p.vendorAmount, 0),
                totalRiderFee: payments.reduce((s, p) => s + p.riderDeliveryFee, 0),
                codPayments: payments.filter(p => p.method === 'cod').length,
                onlinePayments: payments.filter(p => p.method !== 'cod').length
            };

            return { success: true, summary, payments };
        } catch (error: any) {
            console.error('Get Payments Error:', error);
            return { success: false, message: error.message };
        }
    }

    // ============================================
    // 9. ADMIN STATISTICS
    // ============================================
    static async getAdminStatistics(): Promise<any> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [totalPayments, todayPayments, pendingCOD, totalRevenue, totalCommission, paymentsByMethod] = await Promise.all([
                Payment.countDocuments(),
                Payment.countDocuments({ createdAt: { $gte: today } }),
                Payment.countDocuments({ method: 'cod', status: 'pending' }),
                Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$commissionAmount' } } }]),
                Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } }])
            ]);

            return {
                success: true,
                data: {
                    totalPayments,
                    todayPayments,
                    pendingCOD,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    totalCommission: totalCommission[0]?.total || 0,
                    paymentsByMethod
                }
            };
        } catch (error: any) {
            console.error('Admin Statistics Error:', error);
            return { success: false, message: error.message };
        }
    }

    // ============================================
    // 10. PROCESS REFUND
    // ============================================
    static async processRefund(paymentId: string, adminId: string, reason: string, amount?: number): Promise<any> {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) throw new Error('Payment not found');
            if (payment.status !== 'success') throw new Error('Only successful payments can be refunded');

            payment.status = 'refunded';
            payment.refundId = `REF${Date.now()}`;
            payment.refundAmount = amount || payment.amount;
            payment.refundReason = reason;
            payment.refundApprovedBy = new mongoose.Types.ObjectId(adminId);
            payment.refundApprovedAt = new Date();
            await payment.save();

            await User.findByIdAndUpdate(payment.vendorId, {
                $inc: { availableBalance: -payment.vendorAmount }
            });

            return { success: true, refundId: payment.refundId, amount: payment.refundAmount, status: 'refunded' };
        } catch (error: any) {
            console.error('Refund Error:', error);
            return { success: false, message: error.message };
        }
    }
}

export default PaymentService;