import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    vendorId: mongoose.Types.ObjectId;
    productName: string;
    price: number;
    stockQuantity: number;
    description: string;
    status: 'Active' | 'Out of Stock';
    colors?: string[];
    sizes?: string[];
    images?: string[];
}

const ProductSchema: Schema = new Schema({
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    stockQuantity: { type: Number, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Out of Stock'], default: 'Active' },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    images: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);