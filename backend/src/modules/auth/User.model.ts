import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'admin' | 'vendor' | 'customer' | 'rider';
    isVerified: boolean;
    isActive: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    // ✅ NEW: Unique Vendor ID
    vendorId?: string;
    shopName?: string;
    shopAddress?: string;
    cnicFront?: string;
    cnicBack?: string;
    ntnNumber?: string;
    businessLicense?: string;
    // Subscription fields
    totalEarnings: number;
    availableBalance: number;
    pendingWithdrawals: number;
    totalOrdersCount: number;
    subscriptionPlan: 'free' | 'monthly' | 'yearly';
    subscriptionStatus: 'active' | 'inactive' | 'pending_approval' | 'expired';
    subscriptionExpiryDate?: Date;
    trialStartDate?: Date;
    trialEndDate?: Date;
    hasRequestedExtension: boolean;
    extensionRequestDate?: Date | null;
    // Rider fields
    vehicleType?: 'bike' | 'car' | 'van' | 'cycle';
    vehicleNumber?: string;
    licenseNumber?: string;
    zone?: string;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    role: {
        type: String,
        enum: ['admin', 'vendor', 'customer', 'rider'],
        default: 'customer'
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // ✅ NEW: Unique Vendor ID
    vendorId: {
        type: String,
        unique: true,
        sparse: true
    },
    // Vendor fields
    shopName: { type: String, default: '' },
    shopAddress: { type: String, default: '' },
    cnicFront: { type: String, default: '' },
    cnicBack: { type: String, default: '' },
    ntnNumber: { type: String, default: '' },
    businessLicense: { type: String, default: '' },
    // Subscription fields
    totalEarnings: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
    pendingWithdrawals: { type: Number, default: 0, min: 0 },
    totalOrdersCount: { type: Number, default: 0, min: 0 },
    subscriptionPlan: {
        type: String,
        enum: ['free', 'monthly', 'yearly'],
        default: 'free'
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'inactive', 'pending_approval', 'expired'],
        default: 'active'
    },
    subscriptionExpiryDate: { type: Date, default: null },
    trialStartDate: { type: Date, default: null },
    trialEndDate: { type: Date, default: null },
    hasRequestedExtension: { type: Boolean, default: false },
    extensionRequestDate: { type: Date, default: null },
    // Rider fields
    vehicleType: {
        type: String,
        enum: ['bike', 'car', 'van', 'cycle'],
        default: 'bike'
    },
    vehicleNumber: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    zone: { type: String, default: 'Rawalpindi' }
}, {
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);