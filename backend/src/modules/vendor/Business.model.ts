// backend/src/modules/vendor/Business.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
    vendorId: mongoose.Types.ObjectId;
    businessTypeId: mongoose.Types.ObjectId;
    businessName: string;
    businessNtn?: string;
    businessLicense?: string;
    businessEmail: string;
    phone: string;
    whatsapp?: string;
    landline?: string;
    addressCity: string;
    addressCountry: string;
    mapLocation?: string;
    open24_7: boolean;
    businessTiming: {
        monday?: { open: string; close: string };
        tuesday?: { open: string; close: string };
        wednesday?: { open: string; close: string };
        thursday?: { open: string; close: string };
        friday?: { open: string; close: string };
        saturday?: { open: string; close: string };
        sunday?: { open: string; close: string };
    };
    businessLogo?: string;
    coverImage?: string;
    galleryImages?: string[];
    socialLinks: string[];
    subtypes: mongoose.Types.ObjectId[];
    otherSubtype?: string;
    status: 'pending' | 'approved' | 'rejected';
    subscriptionPlan: 'free' | 'monthly' | 'yearly';
    subscriptionStatus: 'pending' | 'approved' | 'rejected' | 'active' | 'none';
    subscriptionStart?: Date;
    subscriptionEnd?: Date;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BusinessSchema: Schema = new Schema({
    vendorId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    businessTypeId: { 
        type: Schema.Types.ObjectId, 
        ref: 'BusinessType', 
        required: true 
    },
    businessName: { type: String, required: true },
    businessNtn: { type: String },
    businessLicense: { type: String },
    businessEmail: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    landline: { type: String },
    addressCity: { type: String, required: true },
    addressCountry: { type: String, required: true },
    mapLocation: { type: String },
    open24_7: { type: Boolean, default: false },
    businessTiming: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    businessLogo: { type: String },
    coverImage: { type: String },
    galleryImages: { type: [String], default: [] },
    socialLinks: { type: [String], default: [] },
    subtypes: [{ type: Schema.Types.ObjectId, ref: 'BusinessSubtype' }],
    otherSubtype: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    subscriptionPlan: { 
        type: String, 
        enum: ['free', 'monthly', 'yearly'], 
        default: 'free' 
    },
    subscriptionStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'none'],
        default: 'none'
    },
    subscriptionStart: { type: Date },
    subscriptionEnd: { type: Date },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

BusinessSchema.index({ vendorId: 1 });
BusinessSchema.index({ status: 1 });
BusinessSchema.index({ vendorId: 1, isDefault: 1 });
BusinessSchema.index({ vendorId: 1, subscriptionStatus: 1 });

export default mongoose.model<IBusiness>('Business', BusinessSchema);