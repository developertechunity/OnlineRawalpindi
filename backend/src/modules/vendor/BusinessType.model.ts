import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessType extends Document {
    name: string;
    slug: string;
    icon?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BusinessTypeSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IBusinessType>('BusinessType', BusinessTypeSchema);