import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessSubtype extends Document {
    businessTypeId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BusinessSubtypeSchema: Schema = new Schema({
    businessTypeId: { 
        type: Schema.Types.ObjectId, 
        ref: 'BusinessType', 
        required: true 
    },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

BusinessSubtypeSchema.index({ businessTypeId: 1, name: 1 }, { unique: true });

export default mongoose.model<IBusinessSubtype>('BusinessSubtype', BusinessSubtypeSchema);