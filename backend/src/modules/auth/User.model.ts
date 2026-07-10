import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'admin' | 'vendor' | 'rider' | 'customer';
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    
    // Vendor specific fields
    vendorId?: string;
    shopName?: string;
    shopAddress?: string;
    ntnNumber?: string;
    whatsapp?: string;
    city?: string;
    country?: string;
    streetAddress?: string;
    businessPhone?: string;
    businessWhatsapp?: string;
    businessLandline?: string;
    businessEmail?: string;
    businessCity?: string;
    businessCountry?: string;
    businessNtn?: string;
    businessWebsite?: string;
    socialLink?: string;
    mapLocation?: string;
    businessTimings?: string;
    businessType?: string;
    
    // Document uploads
    cnicFront?: string;
    cnicBack?: string;
    businessLicense?: string;
    businessLogo?: string;
    coverImage?: string;
    galleryImages?: string[];
    
    // Subscription
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionExpiryDate?: Date;
    hasRequestedExtension?: boolean;
    
    // Withdrawals
    pendingWithdrawals?: number;
    
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'vendor', 'rider', 'customer'], required: true },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    
    // ✅ VENDOR SPECIFIC FIELDS - ALL DEFINED PROPERLY
    vendorId: { type: String, unique: true, sparse: true },
    shopName: { type: String, default: '' },
    shopAddress: { type: String, default: '' },
    ntnNumber: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    streetAddress: { type: String, default: '' },
    businessPhone: { type: String, default: '' },
    businessWhatsapp: { type: String, default: '' },
    businessLandline: { type: String, default: '' },
    businessEmail: { type: String, default: '' },
    businessCity: { type: String, default: '' },
    businessCountry: { type: String, default: '' },
    businessNtn: { type: String, default: '' },
    businessWebsite: { type: String, default: '' },
    socialLink: { type: String, default: '' },
    mapLocation: { type: String, default: '' },
    businessTimings: { type: String, default: '' },
    businessType: { type: String, default: '' },
    
    // Document uploads
    cnicFront: { type: String, default: '' },
    cnicBack: { type: String, default: '' },
    businessLicense: { type: String, default: '' },
    businessLogo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    galleryImages: { type: [String], default: [] },
    
    // Subscription
    subscriptionStatus: { type: String, default: 'none' },
    subscriptionPlan: { type: String, default: 'free' },
    subscriptionExpiryDate: { type: Date },
    hasRequestedExtension: { type: Boolean, default: false },
    
    // Withdrawals
    pendingWithdrawals: { type: Number, default: 0 },
    
}, {
    timestamps: true
});

// Generate vendor ID before saving
UserSchema.pre('save', async function(next) {
    if (this.role === 'vendor' && !this.vendorId) {
        const count = await mongoose.model('User').countDocuments({ role: 'vendor' });
        this.vendorId = `V-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;