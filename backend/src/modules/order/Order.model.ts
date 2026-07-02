// backend/src/modules/order/Order.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    orderNumber: string;
    customerId: mongoose.Types.ObjectId;
    vendorId: mongoose.Types.ObjectId;
    riderId?: mongoose.Types.ObjectId;
    items: any[];
    totalAmount: number;
    deliveryFee: number;
    status: 'pending' | 'processing' | 'ready' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
    paymentMethod: 'stripe' | 'easypaisa' | 'jazzcash' | 'cod';
    paymentId?: mongoose.Types.ObjectId;
    deliveryAddress: string;
    customerNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'User' },
    items: { type: Array, default: [] },
    totalAmount: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'processing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'easypaisa', 'jazzcash', 'cod'],
        required: true
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    deliveryAddress: { type: String, required: true },
    customerNotes: { type: String }
}, { timestamps: true });

// Indexes
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ vendorId: 1 });
OrderSchema.index({ riderId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);