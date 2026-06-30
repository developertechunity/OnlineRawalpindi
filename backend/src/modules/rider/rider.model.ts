import mongoose, { Schema, Document } from 'mongoose';

export interface IRider extends Document {
    userId: mongoose.Types.ObjectId;
    vehicleType: 'bike' | 'car' | 'van' | 'cycle';
    vehicleNumber: string;
    licenseNumber: string;
    zone: string[];
    status: 'online' | 'offline' | 'busy';
    isActive: boolean;
    totalDeliveries: number;
    totalEarnings: number;
    rating: number;
    currentLocation?: {
        lat: number;
        lng: number;
    };
    currentOrder?: string;
}

const RiderSchema: Schema = new Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    vehicleType: {
        type: String,
        enum: ['bike', 'car', 'van', 'cycle'],
        required: true,
        default: 'bike'
    },
    vehicleNumber: { 
        type: String, 
        required: true 
    },
    licenseNumber: { 
        type: String, 
        required: true 
    },
    zone: { 
        type: [String], 
        default: ['Rawalpindi'] 
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'busy'],
        default: 'offline'
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    totalDeliveries: { 
        type: Number, 
        default: 0 
    },
    totalEarnings: { 
        type: Number, 
        default: 0 
    },
    rating: { 
        type: Number, 
        default: 0 
    },
    currentLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    currentOrder: { 
        type: String, 
        default: null 
    }
}, { 
    timestamps: true 
});

export default mongoose.model<IRider>('Rider', RiderSchema);