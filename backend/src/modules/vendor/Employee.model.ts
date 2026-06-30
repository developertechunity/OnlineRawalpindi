import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    vendorId: mongoose.Types.ObjectId;
    employeeName: string;
    role: string;
    email: string;
}

const EmployeeSchema: Schema = new Schema({
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeName: { type: String, required: true },
    role: { type: String, required: true }, // e.g., Inventory Manager
    email: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);