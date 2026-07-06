import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../modules/auth/User.model.js';

dotenv.config();

const generateVendorIds = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('✅ MongoDB connected');

        // Sab vendors ko fetch karo (sorted by createdAt)
        const vendors = await User.find({ role: 'vendor' })
            .sort({ createdAt: 1 });

        console.log(`📋 Found ${vendors.length} vendors`);

        let count = 1;
        let updatedCount = 0;

        for (const vendor of vendors) {
            // ✅ WITHOUT PADDING - Sab ko update karo
            const vendorId = `V-${count}`;
            vendor.vendorId = vendorId;
            await vendor.save();
            
            console.log(`✅ ${vendor.name} → ${vendorId}`);
            updatedCount++;
            count++;
        }

        console.log(`✅ Updated ${updatedCount} vendors with vendor IDs`);
        console.log(`📋 Next vendor ID will be: V-${count}`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

generateVendorIds();