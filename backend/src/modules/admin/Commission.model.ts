import mongoose from 'mongoose';

const CommissionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: String, required: true },
    description: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.Commission || mongoose.model('Commission', CommissionSchema);