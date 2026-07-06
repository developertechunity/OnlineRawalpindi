// backend/src/modules/payment/payment.service.ts

import axios from 'axios';
import crypto from 'crypto';
import Payment from './payment.model.js';
import User from '../auth/User.model.js';
import Order from '../order/Order.model.js';

// ============================================
// ❌ STRIPE DISABLED - Pakistan not supported
// ============================================
// Stripe is disabled because Pakistan is not supported
// We use EasyPaisa, JazzCash, and COD instead

const EASYPAISA_API_URL = process.env.EASYPAISA_API_URL || 'https://api.easypaisa.com/v1';
const EASYPAISA_MERCHANT_ID = process.env.EASYPAISA_MERCHANT_ID;
const EASYPAISA_SECRET_KEY = process.env.EASYPAISA_SECRET_KEY;

const JAZZCASH_API_URL = process.env.JAZZCASH_API_URL || 'https://api.jazzcash.com/v1';
const JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID;
const JAZZCASH_SECRET_KEY = process.env.JAZZCASH_SECRET_KEY;

// ============================================
// PAYMENT SERVICE - Pakistan Local Gateways
// ============================================
export class PaymentService {

    // ============================================
    // 1. CREATE PAYMENT (COD, EasyPaisa, JazzCash)
    // ============================================
    static async createPayment(
        orderId: string,
        orderNumber: string,
        customerId: string,
        vendorId: string,
        amount: number,
        method: 'easypaisa' | 'jazzcash' | 'cod',
        customerPhone?: string,
        riderId?: string
    ): Promise<any> {
        try {
            // Calculate commission (1% platform fee)
            const commissionAmount = amount * 0.01;
            const vendorAmount = amount - commissionAmount;

            let result;
            let transactionId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

            switch (method) {
                case 'easypaisa':
                    if (!customerPhone) {
                        throw new Error('Customer phone required for EasyPaisa');
                    }
                    result = await this.processEasyPaisa(amount, orderId, customerId, vendorId, customerPhone);
                    break;

                case 'jazzcash':
                    if (!customerPhone) {
                        throw new Error('Customer phone required for JazzCash');
                    }
                    result = await this.processJazzCash(amount, orderId, customerId, vendorId, customerPhone);
                    break;

                case 'cod':
                    result = await this.processCOD(orderId, customerId, vendorId, riderId);
                    break;

                default:
                    throw new Error('Invalid payment method. Use: easypaisa, jazzcash, or cod');
            }

            // Save payment record
            const payment = await Payment.create({
                orderId,
                orderNumber,
                customerId,
                vendorId,
                riderId: riderId || null,
                amount,
                commissionAmount,
                vendorAmount,
                currency: 'PKR',
                method,
                transactionId: result.transactionId || transactionId,
                status: method === 'cod' ? 'pending' : 'processing',
                paymentData: result,
                ...(method === 'cod' && { codCollectedBy: riderId })
            });

            return {
                success: true,
                paymentId: payment._id,
                transactionId: payment.transactionId,
                status: payment.status,
                ...result
            };

        } catch (error: any) {
            console.error('Create Payment Error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ============================================
    // 2. PROCESS EASYPAISA PAYMENT
    // ============================================
    private static async processEasyPaisa(
        amount: number,
        orderId: string,
        customerId: string,
        vendorId: string,
        customerPhone: string
    ): Promise<any> {
        try {
            const transactionId = `EP${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // ✅ In production: Call EasyPaisa API
            // For now, simulate success response
            console.log(`📱 EasyPaisa Payment: ${transactionId} - PKR ${amount}`);

            return {
                success: true,
                transactionId,
                paymentUrl: `/payment/easypaisa/${transactionId}`,
                status: 'processing',
                message: 'EasyPaisa payment initiated. Please check your phone.'
            };

        } catch (error: any) {
            console.error('EasyPaisa Error:', error);
            throw error;
        }
    }

    // ============================================
    // 3. PROCESS JAZZCASH PAYMENT
    // ============================================
    private static async processJazzCash(
        amount: number,
        orderId: string,
        customerId: string,
        vendorId: string,
        customerPhone: string
    ): Promise<any> {
        try {
            const transactionId = `JC${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // ✅ In production: Call JazzCash API
            console.log(`📱 JazzCash Payment: ${transactionId} - PKR ${amount}`);

            return {
                success: true,
                transactionId,
                paymentUrl: `/payment/jazzcash/${transactionId}`,
                status: 'processing',
                message: 'JazzCash payment initiated. Please check your phone.'
            };

        } catch (error: any) {
            console.error('JazzCash Error:', error);
            throw error;
        }
    }

    // ============================================
    // 4. PROCESS COD PAYMENT
    // ============================================
    private static async processCOD(
        orderId: string,
        customerId: string,
        vendorId: string,
        riderId?: string
    ): Promise<any> {
        try {
            const transactionId = `COD${Date.now()}${Math.floor(Math.random() * 1000)}`;

            return {
                success: true,
                transactionId,
                status: 'pending',
                riderId: riderId || null,
                notes: 'Cash on Delivery - Payment collected by rider'
            };

        } catch (error: any) {
            console.error('COD Error:', error);
            throw error;
        }
    }

    // ============================================
    // 5. CONFIRM COD PAYMENT (Rider collects cash)
    // ============================================
    static async confirmCOD(
        orderId: string,
        riderId: string,
        amount: number
    ): Promise<any> {
        try {
            const payment = await Payment.findOne({ orderId, method: 'cod' });
            if (!payment) {
                throw new Error('COD payment not found');
            }

            payment.status = 'success';
            payment.codCollectedBy = riderId;
            payment.codDepositedToAdmin = false;
            payment.paymentData = {
                ...payment.paymentData,
                collectedAt: new Date(),
                collectedBy: riderId,
                amount
            };

            await payment.save();

            // Update vendor balance
            await User.findByIdAndUpdate(payment.vendorId, {
                $inc: { availableBalance: payment.vendorAmount }
            });

            return {
                success: true,
                message: 'COD payment confirmed',
                paymentId: payment._id
            };

        } catch (error: any) {
            console.error('Confirm COD Error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ============================================
    // 6. PROCESS REFUND (COD, EasyPaisa, JazzCash)
    // ============================================
    static async processRefund(
        paymentId: string,
        adminId: string,
        reason: string,
        amount?: number
    ): Promise<any> {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'success') {
                throw new Error('Only successful payments can be refunded');
            }

            payment.status = 'refunded';
            payment.refundId = `REF${Date.now()}`;
            payment.refundAmount = amount || payment.amount;
            payment.refundReason = reason;
            payment.refundApprovedBy = adminId;
            payment.refundApprovedAt = new Date();
            await payment.save();

            // Reverse vendor balance
            await User.findByIdAndUpdate(payment.vendorId, {
                $inc: { availableBalance: -payment.vendorAmount }
            });

            return {
                success: true,
                refundId: payment.refundId,
                amount: payment.refundAmount,
                status: 'refunded'
            };

        } catch (error: any) {
            console.error('Refund Error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ============================================
    // 7. UPDATE PAYMENT STATUS
    // ============================================
    private static async updatePaymentStatus(
        transactionId: string,
        status: string,
        data: any
    ): Promise<void> {
        const payment = await Payment.findOne({ transactionId });
        if (!payment) return;

        payment.status = status;
        payment.webhookData = data;
        await payment.save();

        // If payment successful, update vendor balance
        if (status === 'success') {
            await User.findByIdAndUpdate(payment.vendorId, {
                $inc: { availableBalance: payment.vendorAmount }
            });
        }
    }

    // ============================================
    // 8. GET PAYMENTS BY ROLE
    // ============================================
    static async getPaymentsByRole(
        userId: string,
        role: string,
        filters: any = {}
    ): Promise<any> {
        try {
            let query: any = {};

            switch (role) {
                case 'admin':
                    break;
                case 'vendor':
                    query.vendorId = userId;
                    break;
                case 'customer':
                    query.customerId = userId;
                    break;
                case 'rider':
                    query.riderId = userId;
                    break;
                default:
                    throw new Error('Invalid role');
            }

            if (filters.status) query.status = filters.status;
            if (filters.method) query.method = filters.method;
            if (filters.fromDate) query.createdAt = { $gte: new Date(filters.fromDate) };
            if (filters.toDate) query.createdAt = { ...query.createdAt, $lte: new Date(filters.toDate) };

            const payments = await Payment.find(query)
                .sort({ createdAt: -1 })
                .limit(filters.limit || 100)
                .populate('customerId', 'name email')
                .populate('vendorId', 'name email shopName')
                .populate('riderId', 'name email');

            const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
            const totalCommission = payments.reduce((sum, p) => sum + p.commissionAmount, 0);

            return {
                success: true,
                summary: {
                    totalPayments: payments.length,
                    totalAmount,
                    totalCommission,
                    totalVendorAmount: totalAmount - totalCommission
                },
                payments
            };

        } catch (error: any) {
            console.error('Get Payments Error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}

export default PaymentService;