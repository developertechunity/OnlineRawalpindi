import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true, default: 'Vendor Manager' }
}, { timestamps: true });

export default mongoose.models.Employer || mongoose.model('Employer', EmployeeSchema);