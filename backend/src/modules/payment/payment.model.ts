// backend/src/modules/payment/payment.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    // Order Information
    orderId: mongoose.Types.ObjectId;
    orderNumber: string;
    
    // User Information (All 4 roles)
    customerId: mongoose.Types.ObjectId;
    vendorId: mongoose.Types.ObjectId;
    riderId?: mongoose.Types.ObjectId;  // For COD deliveries
    adminId?: mongoose.Types.ObjectId;  // For refund approvals
    
    // Financial Details
    amount: number;
    commissionAmount: number;  // Platform commission (1%)
    vendorAmount: number;      // Amount after commission
    currency: string;
    
    // Payment Method
    method: 'stripe' | 'easypaisa' | 'jazzcash' | 'cod';
    
    // Transaction Details
    transactionId: string;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'disputed';
    
    // COD Specific Fields
    codCollectedBy?: mongoose.Types.ObjectId;  // Rider who collected cash
    codDepositedToAdmin?: boolean;
    codDepositDate?: Date;
    
    // Refund Fields
    refundId?: string;
    refundAmount?: number;
    refundReason?: string;
    refundApprovedBy?: mongoose.Types.ObjectId;
    refundApprovedAt?: Date;
    
    // Timestamps
    paymentData: any;
    webhookData: any;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: { type: String, required: true },
    
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    amount: { type: Number, required: true },
    commissionAmount: { type: Number, default: 0 },
    vendorAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'PKR' },
    
    method: {
        type: String,
        enum: ['stripe', 'easypaisa', 'jazzcash', 'cod'],
        required: true
    },
    
    transactionId: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'disputed'],
        default: 'pending'
    },
    
    codCollectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    codDepositedToAdmin: { type: Boolean, default: false },
    codDepositDate: { type: Date },
    
    refundId: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    refundApprovedAt: { type: Date },
    
    paymentData: { type: Schema.Types.Mixed },
    webhookData: { type: Schema.Types.Mixed }
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