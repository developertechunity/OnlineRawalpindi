// backend/src/modules/vendor/Withdrawal.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
    vendorId: mongoose.Types.ObjectId;
    amount: number;
    method: 'easypaisa' | 'jazzcash' | 'bank';
    accountNumber: string;
    accountHolderName: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    requestedAt: Date;
    processedAt?: Date;
    adminNotes?: string;
}

const WithdrawalSchema: Schema = new Schema({
    vendorId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true,
        min: 5000,
        max: 1000000
    },
    method: { 
        type: String, 
        enum: ['easypaisa', 'jazzcash', 'bank'], 
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
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'processed'], 
        default: 'pending' 
    },
    requestedAt: { 
        type: Date, 
        default: Date.now 
    },
    processedAt: { 
        type: Date 
    },
    adminNotes: { 
        type: String 
    }
}, { timestamps: true });

WithdrawalSchema.index({ vendorId: 1, status: 1 });
WithdrawalSchema.index({ requestedAt: -1 });

export default mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);