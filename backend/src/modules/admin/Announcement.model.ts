import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    audience: { type: String, enum: ['all', 'vendors', 'customers', 'riders'], required: true, default: 'all' },
    date: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);