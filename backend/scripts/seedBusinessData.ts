import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models - .ts extension ke saath
import BusinessType from '../src/modules/vendor/BusinessType.model.js';
import BusinessSubtype from '../src/modules/vendor/BusinessSubtype.model.js';

const seedData = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error('❌ MONGO_URI not found in .env file');
        }
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await BusinessType.deleteMany({});
        await BusinessSubtype.deleteMany({});

        // Business Types
        const types = [
            { name: 'Food & Restaurant', slug: 'food-restaurant', icon: '🍽️' },
            { name: 'Real Estate', slug: 'real-estate', icon: '🏠' },
            { name: 'Shop & Retail', slug: 'shop-retail', icon: '🛍️' },
            { name: 'Health & Medical', slug: 'health-medical', icon: '🏥' },
            { name: 'Beauty & Salon', slug: 'beauty-salon', icon: '💇' },
            { name: 'Education & Training', slug: 'education-training', icon: '📚' },
            { name: 'Automotive', slug: 'automotive', icon: '🚗' },
            { name: 'Home Services', slug: 'home-services', icon: '🔧' },
            { name: 'Entertainment', slug: 'entertainment', icon: '🎮' },
            { name: 'Other', slug: 'other', icon: '📌' }
        ];

        console.log('📝 Creating business types...');
        const createdTypes = await BusinessType.insertMany(types);
        console.log(`✅ ${createdTypes.length} business types created`);

        // Subtypes for each type
        const subtypeMap: Record<string, string[]> = {
            'food-restaurant': ['Fast Food', 'Fine Dining', 'Cafe', 'Bakery', 'Ice Cream', 'Juice Bar', 'BBQ', 'Seafood', 'Pizza', 'Burgers'],
            'real-estate': ['Residential', 'Commercial', 'Land', 'Property Management', 'Real Estate Agent', 'Construction', 'Architecture'],
            'shop-retail': ['Clothing', 'Electronics', 'Furniture', 'Grocery', 'Pharmacy', 'Sports', 'Books', 'Jewelry', 'Footwear', 'Toys'],
            'health-medical': ['Clinic', 'Hospital', 'Dental', 'Eye Care', 'Physiotherapy', 'Laboratory', 'Alternative Medicine', 'Mental Health'],
            'beauty-salon': ['Hair Salon', 'Spa', 'Nail Art', 'Makeup', 'Barber', 'Massage', 'Aesthetic', 'Waxing', 'Bridal'],
            'education-training': ['School', 'College', 'University', 'Tuition Center', 'Language School', 'Skill Training', 'Online Courses', 'Academy'],
            'automotive': ['Car Dealer', 'Auto Repair', 'Tire Shop', 'Car Wash', 'Auto Parts', 'Oil Change', 'Car Rental', 'Workshop'],
            'home-services': ['Plumbing', 'Electrical', 'Cleaning', 'Gardening', 'Pest Control', 'HVAC', 'Handyman', 'Interior Design'],
            'entertainment': ['Cinema', 'Gaming', 'Event Venue', 'Amusement Park', 'Sports Complex', 'Arcade', 'Bowling', 'Escape Room']
        };

        let subtypeCount = 0;

        console.log('📝 Creating subtypes...');
        for (const type of createdTypes) {
            const subtypeNames = subtypeMap[type.slug] || [];
            const subtypes = subtypeNames.map(name => ({
                businessTypeId: type._id,
                name,
                slug: name.toLowerCase().replace(/\s+/g, '-')
            }));
            
            if (subtypes.length > 0) {
                await BusinessSubtype.insertMany(subtypes);
                subtypeCount += subtypes.length;
                console.log(`✅ ${subtypes.length} subtypes created for ${type.name}`);
            }
        }

        console.log(`✅ Total ${subtypeCount} subtypes created`);
        console.log('✅ Seed data completed successfully!');
        
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);

    } catch (error: any) {
        console.error('❌ Seed error:', error);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    }
};

seedData();