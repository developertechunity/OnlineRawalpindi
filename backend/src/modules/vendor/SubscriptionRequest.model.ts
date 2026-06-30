import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionRequest extends Document {
    vendorId: mongoose.Types.ObjectId;
    vendorName: string;
    shopName: string;
    planType: 'monthly' | 'yearly';
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectedReason?: string;
    createdAt: Date;
}

const SubscriptionRequestSchema: Schema = new Schema({
    vendorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    vendorName: { type: String, required: true },
    shopName: { type: String, required: true },
    planType: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    amount: { 
        type: Number, 
        required: true,
        default: function(this: any) {
            return this.planType === 'monthly' ? 1000 : 10000;
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    approvedAt: { type: Date },
    rejectedReason: { type: String }
}, { 
    timestamps: true 
});

export default mongoose.model<ISubscriptionRequest>('SubscriptionRequest', SubscriptionRequestSchema);