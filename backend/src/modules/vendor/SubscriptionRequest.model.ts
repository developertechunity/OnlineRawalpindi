// backend/src/modules/vendor/SubscriptionRequest.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionRequest extends Document {
    vendorId: mongoose.Types.ObjectId;
    businessId?: mongoose.Types.ObjectId;
    vendorName: string;
    vendorEmail: string;
    shopName: string;
    businessName?: string;
    planType: 'monthly' | 'yearly'; // ✅ Only monthly/yearly
    plan?: string; // Optional fallback alias for planType
    amount: number;
    paymentMethod: 'easypaisa' | 'jazzcash' | 'bank';
    accountNumber: string;
    accountHolderName: string;
    phoneNumber?: string;
    bankName?: string;
    accountType?: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectedReason?: string;
    requestedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionRequestSchema: Schema = new Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business'
    },
    vendorName: { 
        type: String, 
        required: true 
    },
    vendorEmail: { 
        type: String, 
        required: true 
    },
    shopName: { 
        type: String, 
        required: true 
    },
    businessName: {
        type: String
    },
    planType: {
        type: String,
        enum: ['monthly', 'yearly'], // ✅ Only monthly/yearly
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['easypaisa', 'jazzcash', 'bank'], // ✅ No free_trial
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    phoneNumber: { 
        type: String 
    },
    bankName: { 
        type: String 
    },
    accountType: { 
        type: String 
    },
    notes: { 
        type: String 
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: { 
        type: Date 
    },
    rejectedReason: { 
        type: String 
    },
    requestedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

SubscriptionRequestSchema.index({ vendorId: 1, status: 1 });
SubscriptionRequestSchema.index({ businessId: 1, status: 1 });
SubscriptionRequestSchema.index({ requestedAt: -1 });

export default mongoose.model<ISubscriptionRequest>('SubscriptionRequest', SubscriptionRequestSchema);