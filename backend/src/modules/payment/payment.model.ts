// backend/src/modules/payment/payment.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    // ===== ORDER INFORMATION =====
    orderId: mongoose.Types.ObjectId;
    orderNumber: string;
    
    // ===== ALL 4 USER TYPES =====
    customerId: mongoose.Types.ObjectId;      // Who paid
    vendorId: mongoose.Types.ObjectId;        // Who received
    riderId?: mongoose.Types.ObjectId;        // Who collected (COD)
    adminId?: mongoose.Types.ObjectId;        // Who approved (refunds)
    
    // ===== FINANCIAL DETAILS =====
    amount: number;
    commissionAmount: number;                 // Platform fee (1%)
    vendorAmount: number;                     // After commission
    riderDeliveryFee: number;                 // Rider delivery fee (5%)
    currency: string;
    
    // ===== PAYMENT METHOD =====
    method: 'easypaisa' | 'jazzcash' | 'cod';
    
    // ===== TRANSACTION =====
    transactionId: string;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
    
    // ===== COD SPECIFIC =====
    codCollectedBy?: mongoose.Types.ObjectId;  // Rider who collected
    codDepositedToAdmin: boolean;
    codDepositDate?: Date;
    
    // ===== SUBSCRIPTION (Vendor) =====
    isSubscription: boolean;
    subscriptionPlan?: 'monthly' | 'yearly';
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    
    // ===== REFUND =====
    refundId?: string;
    refundAmount?: number;
    refundReason?: string;
    refundApprovedBy?: mongoose.Types.ObjectId;
    refundApprovedAt?: Date;
    
    // ===== METADATA =====
    paymentData: any;
    webhookData: any;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
    // Order
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: { type: String, required: true },
    
    // All 4 User Types
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    // Financial
    amount: { type: Number, required: true },
    commissionAmount: { type: Number, default: 0 },
    vendorAmount: { type: Number, default: 0 },
    riderDeliveryFee: { type: Number, default: 0 },
    currency: { type: String, default: 'PKR' },
    
    // Payment Method
    method: {
        type: String,
        enum: ['easypaisa', 'jazzcash', 'cod'],
        required: true
    },
    
    // Transaction
    transactionId: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
        default: 'pending'
    },
    
    // COD
    codCollectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    codDepositedToAdmin: { type: Boolean, default: false },
    codDepositDate: { type: Date },
    
    // Subscription
    isSubscription: { type: Boolean, default: false },
    subscriptionPlan: { type: String, enum: ['monthly', 'yearly'] },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    
    // Refund
    refundId: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    refundApprovedAt: { type: Date },
    
    // Metadata
    paymentData: { type: Schema.Types.Mixed },
    webhookData: { type: Schema.Types.Mixed },
    notes: { type: String }
}, { timestamps: true });

// Indexes for performance
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ customerId: 1 });
PaymentSchema.index({ vendorId: 1 });
PaymentSchema.index({ riderId: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ method: 1 });
PaymentSchema.index({ createdAt: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);