import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'admin' | 'vendor' | 'customer' | 'rider';
    isVerified: boolean;
    isActive: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    shopName?: string;
    shopAddress?: string;
    cnicFront?: string;
    cnicBack?: string;
    
    // Real-world Vendor Metrics
    totalEarnings: number;
    availableBalance: number;
    pendingWithdrawals: number;
    totalOrdersCount: number;

    // Subscription System Data
    subscriptionPlan: 'free' | 'monthly' | 'yearly';
    subscriptionStatus: 'active' | 'pending_approval' | 'none' | 'expired';
    trialStartDate?: Date;
    trialEndDate?: Date;
    hasRequestedExtension: boolean;
    extensionRequestDate?: Date;
    extensionApproved?: boolean;
    extensionDaysGranted?: number;

    // Methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    getTrialDaysRemaining(): number;
    isTrialExpired(): boolean;
    shouldShowTrialWarning(): boolean;
}

const UserSchema: Schema = new Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number is required'],
        trim: true 
    },
    role: {
        type: String,
        enum: ['admin', 'vendor', 'customer', 'rider'],
        default: 'customer'
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' // Changed to 'pending' for vendors
    },
    shopName: { 
        type: String,
        trim: true 
    },
    shopAddress: { 
        type: String,
        trim: true 
    },
    cnicFront: { 
        type: String 
    },
    cnicBack: { 
        type: String 
    },

    // Defaulting vendor metrics to 0 initially
    totalEarnings: { 
        type: Number, 
        default: 0,
        min: 0 
    },
    availableBalance: { 
        type: Number, 
        default: 0,
        min: 0 
    },
    pendingWithdrawals: { 
        type: Number, 
        default: 0,
        min: 0 
    },
    totalOrdersCount: { 
        type: Number, 
        default: 0,
        min: 0 
    },

    // Subscription management
    subscriptionPlan: { 
        type: String, 
        enum: ['free', 'monthly', 'yearly'], 
        default: 'free' 
    },
    subscriptionStatus: { 
        type: String, 
        enum: ['active', 'pending_approval', 'none', 'expired'], 
        default: 'active' 
    },
    trialStartDate: { 
        type: Date, 
        default: Date.now 
    },
    trialEndDate: { 
        type: Date, 
        default: () => {
            const date = new Date();
            date.setDate(date.getDate() + 30); // 30 Days Trial
            return date;
        }
    },
    hasRequestedExtension: { 
        type: Boolean, 
        default: false 
    },
    extensionRequestDate: { 
        type: Date 
    },
    extensionApproved: { 
        type: Boolean, 
        default: false 
    },
    extensionDaysGranted: { 
        type: Number, 
        default: 15 // Default extension days
    }
}, {
    timestamps: true
});

// ============================================
// PRE-SAVE MIDDLEWARE - Hash Password
// ============================================
UserSchema.pre('save', async function(next) {
    // Only hash the password if it's modified (or new)
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// ============================================
// INSTANCE METHODS
// ============================================

// Compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Get remaining trial days
UserSchema.methods.getTrialDaysRemaining = function(): number {
    if (!this.trialEndDate) return 0;
    
    const now = new Date();
    const trialEnd = new Date(this.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if trial is expired
UserSchema.methods.isTrialExpired = function(): boolean {
    if (!this.trialEndDate) return true;
    return new Date() > new Date(this.trialEndDate);
};

// Check if trial warning should be shown (3 days or less remaining)
UserSchema.methods.shouldShowTrialWarning = function(): boolean {
    if (this.subscriptionPlan !== 'free') return false;
    if (this.subscriptionStatus === 'expired') return false;
    
    const daysRemaining = this.getTrialDaysRemaining();
    return daysRemaining > 0 && daysRemaining <= 3;
};

// ============================================
// STATIC METHODS
// ============================================

// Find vendors with pending subscription requests
UserSchema.statics.findPendingSubscriptionRequests = function() {
    return this.find({
        role: 'vendor',
        subscriptionStatus: 'pending_approval'
    }).select('name email shopName subscriptionPlan hasRequestedExtension extensionRequestDate');
};

// Find vendors with trial ending soon (within 3 days)
UserSchema.statics.findTrialsEndingSoon = function() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    return this.find({
        role: 'vendor',
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        trialEndDate: { 
            $lte: threeDaysFromNow,
            $gte: new Date()
        }
    });
};

// Find vendors with expired trials
UserSchema.statics.findExpiredTrials = function() {
    return this.find({
        role: 'vendor',
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        trialEndDate: { $lt: new Date() }
    });
};

// ============================================
// VIRTUAL PROPERTIES
// ============================================

// Check if vendor is approved
UserSchema.virtual('isApproved').get(function() {
    return this.approvalStatus === 'approved';
});

// Check if vendor can sell (approved and active)
UserSchema.virtual('canSell').get(function() {
    return this.isApproved && this.isActive && 
           (this.subscriptionPlan !== 'free' || !this.isTrialExpired());
});

// Get subscription display name
UserSchema.virtual('subscriptionDisplayName').get(function() {
    const planMap = {
        'free': 'Free Trial',
        'monthly': 'Monthly Plan',
        'yearly': 'Yearly Plan'
    };
    return planMap[this.subscriptionPlan] || 'Free Trial';
});

// Get trial status text
UserSchema.virtual('trialStatusText').get(function() {
    if (this.subscriptionPlan !== 'free') return 'Subscribed';
    if (this.isTrialExpired()) return 'Expired';
    
    const days = this.getTrialDaysRemaining();
    if (days <= 0) return 'Expired';
    if (days <= 3) return `Ending Soon (${days} days)`;
    return `${days} days remaining`;
});

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, approvalStatus: 1 });
UserSchema.index({ role: 1, subscriptionStatus: 1 });
UserSchema.index({ 'trialEndDate': 1 });
UserSchema.index({ role: 1, isActive: 1 });

// ============================================
// EXPORT MODEL
// ============================================

export default mongoose.model<IUser>('User', UserSchema);