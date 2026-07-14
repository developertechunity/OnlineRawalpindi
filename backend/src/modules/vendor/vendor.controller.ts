// backend/src/modules/vendor/vendor.controller.ts

import { Request, Response } from 'express';
import { uploadToCloudinary, deleteFromCloudinary } from '../../lib/cloudinary';
import User from '../auth/User.model.js';
import Product from './Product.model.js';
import Employee from './Employee.model.js';
import Withdrawal from './Withdrawal.model.js';
import SubscriptionRequest from './SubscriptionRequest.model.js';
import BusinessType from './BusinessType.model.js';
import BusinessSubtype from './BusinessSubtype.model.js';
import Business from './Business.model.js';

// ============================================
// 1. DASHBOARD DATA
// ============================================
export const getVendorDashboardData = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        const businesses = await Business.find({ vendorId })
            .populate('businessTypeId', 'name')
            .sort({ isDefault: -1, createdAt: -1 });

        console.log(`📋 [VENDOR] Found ${businesses.length} businesses for vendor ${vendorId}`);

        const defaultBusiness = businesses.find(b => b.isDefault);
        const selectedBusinessId = defaultBusiness?._id || (businesses[0]?._id || '');

        if (businesses.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalEarnings: vendor.totalEarnings || 0,
                    availableBalance: vendor.availableBalance || 0,
                    pendingWithdrawals: vendor.pendingWithdrawals || 0,
                    totalOrders: vendor.totalOrdersCount || 0,
                    totalProducts: 0,
                    pendingOrders: 0,
                    productsList: [],
                    employeesList: [],
                    businesses: [],
                    selectedBusinessId: '',
                    subscription: {
                        plan: vendor.subscriptionPlan || 'free',
                        status: vendor.subscriptionStatus || 'active',
                        daysRemaining: 0,
                        showTrialWarning: false,
                        hasRequestedExtension: vendor.hasRequestedExtension || false,
                        isApproved: false,
                        isPendingApproval: false,
                        endDate: null
                    }
                }
            });
        }

        const [productsCount, productsList, employeesList] = await Promise.all([
            Product.countDocuments({ vendorId }),
            Product.find({ vendorId }).select('_id productName price stockQuantity description status colors sizes images'),
            Employee.find({ vendorId }).select('_id employeeName role email')
        ]);

        let trialDaysRemaining = 0;
        let showTrialWarning = false;

        if (vendor.subscriptionPlan === 'free' && vendor.trialEndDate) {
            const now = new Date();
            const trialEnd = new Date(vendor.trialEndDate);
            const diffTime = trialEnd.getTime() - now.getTime();
            trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (trialDaysRemaining < 0) {
                trialDaysRemaining = 0;
            }

            if (trialDaysRemaining <= 3 && trialDaysRemaining > 0) {
                showTrialWarning = true;
            }
        }

        const formattedProducts = productsList.map((p: any) => ({
            id: p._id,
            name: p.productName,
            price: p.price,
            stock: p.stockQuantity,
            status: p.status,
            description: p.description,
            colors: p.colors || [],
            sizes: p.sizes || [],
            images: p.images || []
        }));

        const formattedEmployees = employeesList.map((e: any) => ({
            id: e._id,
            name: e.employeeName,
            email: e.email,
            role: e.role
        }));

        const formattedBusinesses = businesses.map((b: any) => ({
            _id: b._id,
            businessName: b.businessName,
            businessTypeId: b.businessTypeId,
            status: b.status,
            isDefault: b.isDefault,
            businessEmail: b.businessEmail,
            phone: b.phone,
            addressCity: b.addressCity,
            addressCountry: b.addressCountry,
            subscriptionPlan: b.subscriptionPlan,
            subscriptionStatus: b.subscriptionStatus
        }));

        const hasApprovedBusiness = businesses.some(b => b.status === 'approved');
        const isApproved = vendor.subscriptionStatus === 'active' && vendor.subscriptionPlan !== 'free';
        const isPendingApproval = vendor.subscriptionStatus === 'pending_approval';

        return res.status(200).json({
            success: true,
            data: {
                totalEarnings: vendor.totalEarnings || 0,
                availableBalance: vendor.availableBalance || 0,
                pendingWithdrawals: vendor.pendingWithdrawals || 0,
                totalOrders: vendor.totalOrdersCount || 0,
                totalProducts: productsCount,
                pendingOrders: 0,
                productsList: formattedProducts,
                employeesList: formattedEmployees,
                businesses: formattedBusinesses,
                selectedBusinessId: selectedBusinessId,
                hasApprovedBusiness: hasApprovedBusiness,
                subscription: {
                    plan: vendor.subscriptionPlan || 'free',
                    status: vendor.subscriptionStatus || 'active',
                    daysRemaining: trialDaysRemaining > 0 ? trialDaysRemaining : 0,
                    showTrialWarning,
                    hasRequestedExtension: vendor.hasRequestedExtension || false,
                    isApproved: isApproved,
                    isPendingApproval: isPendingApproval,
                    endDate: vendor.subscriptionExpiryDate || vendor.subscriptionEndDate || null
                }
            }
        });
    } catch (error: any) {
        console.error('🔥 Dashboard Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 2. GET ALL PRODUCTS
// ============================================
export const getProducts = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const products = await Product.find({ vendorId });

        const formattedProducts = products.map((p: any) => {
            let images = p.images || [];
            if (Array.isArray(images) && images.length > 0) {
                images = images.map((img: string) => {
                    if (img.startsWith('http')) return img;
                    return img;
                });
            }
            return {
                id: p._id,
                name: p.productName,
                price: p.price,
                stock: p.stockQuantity,
                status: p.status,
                description: p.description,
                colors: p.colors || [],
                sizes: p.sizes || [],
                images: images
            };
        });

        return res.status(200).json({
            success: true,
            products: formattedProducts
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 3. ADD PRODUCT
// ============================================
export const addProduct = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        console.log('📦 [BACKEND] Request Body:', req.body);
        console.log('📦 [BACKEND] Request Files:', req.files);

        const { name, price, stock, description } = req.body;

        let colors = [];
        let sizes = [];

        if (req.body.colors) {
            try {
                colors = JSON.parse(req.body.colors);
            } catch (e) {
                colors = req.body.colors || [];
            }
        }

        if (req.body.sizes) {
            try {
                sizes = JSON.parse(req.body.sizes);
            } catch (e) {
                sizes = req.body.sizes || [];
            }
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Product Name is required'
            });
        }
        if (!price) {
            return res.status(400).json({
                success: false,
                message: 'Price is required'
            });
        }
        if (stock === undefined || stock === null) {
            return res.status(400).json({
                success: false,
                message: 'Stock quantity is required'
            });
        }
        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Description is required'
            });
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least 1 product image is required'
            });
        }

        if (files.length > 5) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 5 images allowed'
            });
        }

        const uploadedImages = await Promise.all(
            files.map(file => uploadToCloudinary(file.buffer, 'digital-rawalpindi/products'))
        );
        const imagePaths: string[] = uploadedImages.map(img => img.url);

        const newProduct = await Product.create({
            vendorId,
            productName: name.trim(),
            price: Number(price),
            stockQuantity: Number(stock),
            description: description.trim(),
            colors: colors,
            sizes: sizes,
            images: imagePaths,
            status: Number(stock) > 0 ? 'Active' : 'Out of Stock'
        });

        console.log('✅ [BACKEND] Product created:', newProduct._id);

        return res.status(201).json({
            success: true,
            message: '🎉 Product added successfully!',
            product: {
                id: newProduct._id,
                name: newProduct.productName,
                price: newProduct.price,
                stock: newProduct.stockQuantity,
                status: newProduct.status,
                description: newProduct.description,
                colors: newProduct.colors || [],
                sizes: newProduct.sizes || [],
                images: newProduct.images || []
            }
        });
    } catch (error: any) {
        console.error('❌ [BACKEND] Add product error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 4. DELETE PRODUCT
// ============================================
export const deleteProduct = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        const { productId } = req.params;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const product = await Product.findOne({ _id: productId, vendorId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await Product.deleteOne({ _id: productId });
        return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 5. GET ALL EMPLOYEES
// ============================================
export const getEmployees = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const employees = await Employee.find({ vendorId });

        return res.status(200).json({
            success: true,
            employees: employees.map((e: any) => ({
                id: e._id,
                name: e.employeeName,
                email: e.email,
                role: e.role
            }))
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 6. ADD EMPLOYEE
// ============================================
export const addEmployee = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const { name, email, role } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: 'All employee fields are required'
            });
        }

        const newEmployee = await Employee.create({
            vendorId,
            employeeName: name,
            email,
            role
        });

        return res.status(201).json({
            success: true,
            message: '🎉 Employee added successfully!',
            employee: {
                id: newEmployee._id,
                name: newEmployee.employeeName,
                email: newEmployee.email,
                role: newEmployee.role
            }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 7. DELETE EMPLOYEE
// ============================================
export const deleteEmployee = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        const { employeeId } = req.params;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const employee = await Employee.findOne({ _id: employeeId, vendorId });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        await Employee.deleteOne({ _id: employeeId });
        return res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// BUSINESS REGISTRATION - GET BUSINESS TYPES
// ============================================
export const getBusinessTypes = async (req: any, res: Response): Promise<any> => {
    try {
        const types = await BusinessType.find({ isActive: true }).sort({ name: 1 });
        return res.status(200).json({
            success: true,
            data: types
        });
    } catch (error: any) {
        console.error('Get Business Types Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// BUSINESS REGISTRATION - GET SUBTYPES BY TYPE
// ============================================
export const getSubtypesByType = async (req: any, res: Response): Promise<any> => {
    try {
        const { typeId } = req.params;
        const subtypes = await BusinessSubtype.find({ 
            businessTypeId: typeId,
            isActive: true 
        }).sort({ name: 1 });
        
        return res.status(200).json({
            success: true,
            data: subtypes
        });
    } catch (error: any) {
        console.error('Get Subtypes Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// BUSINESS REGISTRATION - CREATE BUSINESS
// ============================================
export const registerBusiness = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        
        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        console.log('📋 [BACKEND] Register Business - vendorId:', vendorId);
        console.log('📋 [BACKEND] Request Body:', req.body);

        const {
            businessTypeId,
            businessName,
            businessNtn,
            businessEmail,
            phone,
            whatsapp,
            landline,
            addressCity,
            addressCountry,
            mapLocation,
            open24_7,
            businessTiming,
            subtypes,
            otherSubtype,
            socialLinks,
            subscriptionPlan,
            paymentMethod,
            accountNumber,
            accountHolderName,
            phoneNumber,
            bankName,
            notes
        } = req.body;

        if (!businessTypeId || !businessName || !businessEmail || !phone || !addressCity || !addressCountry) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all required fields (Business Type, Name, Email, Phone, City, Country)'
            });
        }

        const files = req.files as any;
        let businessLogo = '';
        let coverImage = '';
        let galleryImages: string[] = [];

        if (files) {
            if (files.businessLogo && files.businessLogo[0]) {
                businessLogo = (await uploadToCloudinary(files.businessLogo[0].buffer, 'digital-rawalpindi/logos')).url;
            }
            if (files.coverImage && files.coverImage[0]) {
                coverImage = (await uploadToCloudinary(files.coverImage[0].buffer, 'digital-rawalpindi/covers')).url;
            }
            if (files.galleryImages && files.galleryImages.length > 0) {
                const uploadedGallery = await Promise.all(
                    files.galleryImages.map((file: any) =>
                        uploadToCloudinary(file.buffer, 'digital-rawalpindi/gallery')
                    )
                );
                galleryImages = uploadedGallery.map(img => img.url);
            }
        }

        let parsedTiming = {};
        try {
            parsedTiming = businessTiming ? JSON.parse(businessTiming) : {};
        } catch (e) {
            parsedTiming = {};
        }

        let parsedSubtypes: string[] = [];
        try {
            parsedSubtypes = subtypes ? JSON.parse(subtypes) : [];
        } catch (e) {
            parsedSubtypes = [];
        }

        let parsedSocialLinks: string[] = [];
        try {
            parsedSocialLinks = socialLinks ? JSON.parse(socialLinks) : [];
        } catch (e) {
            parsedSocialLinks = [];
        }

        const existingBusiness = await Business.findOne({ vendorId, isDefault: true });
        const isDefault = !existingBusiness;

        // ✅ Create Business
        const business = await Business.create({
            vendorId,
            businessTypeId,
            businessName: businessName.trim(),
            businessNtn: businessNtn || '',
            businessEmail: businessEmail.trim(),
            phone: phone.trim(),
            whatsapp: whatsapp || '',
            landline: landline || '',
            addressCity: addressCity.trim(),
            addressCountry: addressCountry.trim(),
            mapLocation: mapLocation || '',
            open24_7: open24_7 === 'true' || open24_7 === true,
            businessTiming: parsedTiming,
            businessLogo,
            coverImage,
            galleryImages,
            socialLinks: parsedSocialLinks,
            subtypes: parsedSubtypes,
            otherSubtype: otherSubtype || '',
            isDefault
        });

        console.log('✅ [BACKEND] Business created:', business._id);

        const vendor = await User.findById(vendorId);

        // ✅ CHECK IF PLAN IS FREE OR PAID
        if (subscriptionPlan === 'free') {
            console.log(`📋 [BACKEND] Free Trial - Directly approving business: ${business.businessName}`);
            
            business.status = 'approved';
            business.subscriptionPlan = 'free';
            business.subscriptionStatus = 'approved';
            
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30);
            business.subscriptionEnd = trialEndDate;
            business.subscriptionStart = new Date();
            await business.save();
            console.log(`✅ Business APPROVED: ${business.businessName} -> Free Trial, ends: ${trialEndDate}`);

            if (vendor) {
                vendor.subscriptionPlan = 'free';
                vendor.subscriptionStatus = 'active';
                vendor.trialEndDate = trialEndDate;
                vendor.trialStartDate = new Date();
                vendor.hasRequestedExtension = false;
                await vendor.save();
                console.log(`✅ Vendor UPDATED: ${vendor.name} -> Free Trial`);
            }

            return res.status(201).json({
                success: true,
                message: '✅ Business registered successfully! Free Trial is now active. You have 30 days.',
                data: {
                    businessId: business._id,
                    businessName: business.businessName,
                    status: business.status,
                    subscriptionPlan: 'free',
                    subscriptionStatus: 'approved',
                    trialEndDate: trialEndDate
                }
            });

        } else {
            // ✅ PAID PLANS (Monthly/Yearly): Need admin approval
            console.log(`📋 [BACKEND] Paid Plan - Creating subscription request for: ${business.businessName}`);

            business.status = 'pending';
            business.subscriptionPlan = subscriptionPlan;
            business.subscriptionStatus = 'pending';
            await business.save();

            const existingRequest = await SubscriptionRequest.findOne({
                businessId: business._id,
                status: 'pending'
            });

            if (existingRequest) {
                console.log(`⚠️ Business ${business._id} already has a pending request`);
                return res.status(201).json({
                    success: true,
                    message: 'Business registered successfully! Subscription request already pending.',
                    data: {
                        businessId: business._id,
                        businessName: business.businessName,
                        status: business.status,
                        subscriptionStatus: business.subscriptionStatus
                    }
                });
            }

            // ✅ FIXED: Status type safety - Using 'as const' for literal type
            const subscriptionRequestData = {
                vendorId,
                businessId: business._id,
                businessName: business.businessName,
                vendorName: vendor?.name || 'Vendor',
                vendorEmail: vendor?.email || req.user?.email || 'vendor@email.com',
                shopName: business.businessName,
                planType: subscriptionPlan,
                amount: subscriptionPlan === 'yearly' ? 10000 : 1000,
                paymentMethod: paymentMethod || 'easypaisa',
                accountNumber: accountNumber || 'N/A',
                accountHolderName: accountHolderName || vendor?.name || 'N/A',
                phoneNumber: phoneNumber || phone || '',
                bankName: bankName || '',
                notes: notes || '',
                status: 'pending' as const,
                requestedAt: new Date()
            };

            console.log('📋 Subscription Request Data:', subscriptionRequestData);

            const subscriptionRequest = await SubscriptionRequest.create(subscriptionRequestData);
            console.log(`✅ Subscription request created for ${business.businessName}: ${subscriptionPlan} plan`);

            return res.status(201).json({
                success: true,
                message: `✅ Business registered successfully! ${subscriptionPlan} plan request sent to admin for approval.`,
                data: {
                    businessId: business._id,
                    businessName: business.businessName,
                    status: business.status,
                    subscriptionStatus: business.subscriptionStatus,
                    requestId: subscriptionRequest._id
                }
            });
        }

    } catch (error: any) {
        console.error('❌ [BACKEND] Register Business Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ CLOUDINARY - UPLOAD SINGLE VENDOR IMAGE
// ============================================
export const uploadVendorImage = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        if (!vendorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const file = req.file as Express.Multer.File;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        const result = await uploadToCloudinary(file.buffer, 'digital-rawalpindi/vendors');

        return res.status(200).json({
            success: true,
            url: result.url,
            publicId: result.publicId
        });
    } catch (error: any) {
        console.error('❌ [CLOUDINARY] Upload error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// ✅ CLOUDINARY - DELETE VENDOR IMAGE
// ============================================
export const deleteVendorImage = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        if (!vendorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { publicId } = req.params;
        if (!publicId) {
            return res.status(400).json({ success: false, message: 'publicId is required' });
        }

        await deleteFromCloudinary(publicId);

        return res.status(200).json({
            success: true,
            message: 'Image deleted from Cloudinary'
        });
    } catch (error: any) {
        console.error('❌ [CLOUDINARY] Delete error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// BUSINESS REGISTRATION - GET VENDOR BUSINESSES
// ============================================
export const getVendorBusinesses = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        
        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const businesses = await Business.find({ vendorId })
            .populate('businessTypeId', 'name')
            .populate('subtypes', 'name')
            .sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: businesses
        });

    } catch (error: any) {
        console.error('Get Vendor Businesses Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// BUSINESS REGISTRATION - SWITCH DEFAULT BUSINESS
// ============================================
export const switchDefaultBusiness = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        const { businessId } = req.params;
        
        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const business = await Business.findOne({ _id: businessId, vendorId });
        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        await Business.updateMany({ vendorId }, { isDefault: false });

        business.isDefault = true;
        await business.save();

        return res.status(200).json({
            success: true,
            message: 'Default business updated successfully'
        });

    } catch (error: any) {
        console.error('Switch Default Business Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// REQUEST TRIAL EXTENSION
// ============================================
export const requestTrialExtension = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        console.log('📋 [VENDOR] Request Trial Extension - vendorId:', vendorId);

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vendor not found' 
            });
        }

        if (vendor.hasRequestedExtension) {
            return res.status(400).json({
                success: false,
                message: 'Extension already requested. Waiting for admin approval.'
            });
        }

        if (vendor.trialEndDate && new Date() > new Date(vendor.trialEndDate)) {
            return res.status(400).json({
                success: false,
                message: 'Trial expired. Please subscribe to continue.'
            });
        }

        await User.findByIdAndUpdate(vendorId, {
            hasRequestedExtension: true,
            extensionRequestDate: new Date(),
            subscriptionStatus: 'pending_approval'
        });

        console.log('✅ [VENDOR] Trial extension request sent');

        return res.status(200).json({
            success: true,
            message: '✅ Trial extension request sent for admin approval!'
        });
    } catch (error: any) {
        console.error('❌ [VENDOR] Trial extension error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to request trial extension'
        });
    }
};

// ============================================
// GET TRIAL STATUS
// ============================================
export const getTrialStatus = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        let trialDaysRemaining = 0;
        let showTrialWarning = false;

        if (vendor.subscriptionPlan === 'free' && vendor.trialEndDate) {
            const diffTime = new Date(vendor.trialEndDate).getTime() - new Date().getTime();
            trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (trialDaysRemaining <= 3 && trialDaysRemaining > 0) {
                showTrialWarning = true;
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                plan: vendor.subscriptionPlan || 'free',
                status: vendor.subscriptionStatus || 'active',
                daysRemaining: trialDaysRemaining > 0 ? trialDaysRemaining : 0,
                showTrialWarning,
                hasRequestedExtension: vendor.hasRequestedExtension || false,
                trialEndDate: vendor.trialEndDate
            }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// START FREE TRIAL
// ============================================
export const startFreeTrial = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        console.log('📋 [VENDOR] Start Free Trial - vendorId:', vendorId);

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vendor not found' 
            });
        }

        if (vendor.subscriptionPlan === 'free' && vendor.subscriptionStatus === 'active') {
            return res.status(400).json({
                success: false,
                message: 'You are already on free trial'
            });
        }

        if (vendor.subscriptionStatus === 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'You have a pending subscription request. Please cancel it first.'
            });
        }

        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        await User.findByIdAndUpdate(vendorId, {
            subscriptionPlan: 'free',
            subscriptionStatus: 'active',
            trialStartDate,
            trialEndDate,
            hasRequestedExtension: false
        });

        console.log('✅ [VENDOR] Free trial started successfully');
        console.log('✅ Trial End Date:', trialEndDate);

        return res.status(200).json({
            success: true,
            message: 'Free trial started successfully! You have 30 days.',
            data: {
                trialEndDate: trialEndDate
            }
        });
    } catch (error: any) {
        console.error('❌ [VENDOR] Start trial error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to start free trial'
        });
    }
};

// ============================================
// CANCEL SUBSCRIPTION REQUEST
// ============================================
export const cancelSubscriptionRequest = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        console.log('📋 [VENDOR] Cancel Subscription Request - vendorId:', vendorId);

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vendor not found' 
            });
        }

        if (vendor.subscriptionStatus !== 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'No pending subscription request found'
            });
        }

        await User.findByIdAndUpdate(vendorId, {
            subscriptionPlan: 'free',
            subscriptionStatus: 'active',
            hasRequestedExtension: false,
            extensionRequestDate: null
        });

        console.log('✅ [VENDOR] Subscription request cancelled');

        return res.status(200).json({
            success: true,
            message: 'Subscription request cancelled. You are back on Free Trial.'
        });
    } catch (error: any) {
        console.error('❌ [VENDOR] Cancel subscription error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to cancel subscription request'
        });
    }
};

// ============================================
// REQUEST WITHDRAWAL (VENDOR)
// ============================================
export const requestWithdrawal = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        const { amount, method, accountNumber, accountHolderName } = req.body;

        console.log('💰 Withdrawal Request:', { vendorId, amount, method, accountNumber, accountHolderName });

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!amount || !method || !accountNumber || !accountHolderName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const amountNum = Number(amount);
        if (amountNum < 5000) {
            return res.status(400).json({
                success: false,
                message: 'Minimum withdrawal amount is PKR 5,000'
            });
        }

        if (amountNum > 1000000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum withdrawal amount is PKR 1,000,000 (1 Million)'
            });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        const availableBalance = vendor.availableBalance || 0;
        if (amountNum > availableBalance) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: PKR ${availableBalance.toLocaleString()}`
            });
        }

        const withdrawal = await Withdrawal.create({
            vendorId,
            amount: amountNum,
            method,
            accountNumber,
            accountHolderName,
            status: 'pending',
            requestedAt: new Date()
        });

        vendor.pendingWithdrawals = (vendor.pendingWithdrawals || 0) + amountNum;
        await vendor.save();

        console.log('✅ Withdrawal request created:', withdrawal._id);

        return res.status(201).json({
            success: true,
            message: 'Withdrawal request sent successfully! Admin will review and process.',
            withdrawal: {
                id: withdrawal._id,
                amount: withdrawal.amount,
                method: withdrawal.method,
                status: withdrawal.status,
                requestedAt: withdrawal.requestedAt
            }
        });
    } catch (error: any) {
        console.error('Withdrawal request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// GET WITHDRAWAL HISTORY (VENDOR)
// ============================================
export const getWithdrawalHistory = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const withdrawals = await Withdrawal.find({ vendorId })
            .sort({ requestedAt: -1 });

        return res.status(200).json({
            success: true,
            withdrawals: withdrawals.map((w: any) => ({
                id: w._id,
                amount: w.amount,
                method: w.method,
                status: w.status,
                requestedAt: w.requestedAt,
                processedAt: w.processedAt,
                adminNotes: w.adminNotes
            }))
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// ✅ GET SUBSCRIPTION STATUS (VENDOR) - BUSINESS ONLY
// ============================================
export const getSubscriptionStatus = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        const pendingRequests = await SubscriptionRequest.find({
            vendorId,
            businessId: { $exists: true, $ne: null },
            status: 'pending'
        });

        const approvedRequests = await SubscriptionRequest.find({
            vendorId,
            businessId: { $exists: true, $ne: null },
            status: 'approved'
        }).sort({ approvedAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                plan: vendor.subscriptionPlan || 'free',
                status: vendor.subscriptionStatus || 'active',
                isApproved: vendor.subscriptionStatus === 'active' && vendor.subscriptionPlan !== 'free',
                pendingApproval: vendor.subscriptionStatus === 'pending_approval',
                hasPendingRequest: pendingRequests.length > 0,
                hasApprovedRequest: approvedRequests.length > 0,
                pendingRequests: pendingRequests.map((r: any) => ({
                    businessId: r.businessId,
                    businessName: r.businessName,
                    planType: r.planType,
                    requestedAt: r.requestedAt
                })),
                approvedRequests: approvedRequests.map((r: any) => ({
                    businessId: r.businessId,
                    businessName: r.businessName,
                    planType: r.planType,
                    approvedAt: r.approvedAt
                })),
                endDate: vendor.subscriptionExpiryDate || vendor.subscriptionEndDate || null
            }
        });

    } catch (error: any) {
        console.error('❌ Get Subscription Status Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ REQUEST BUSINESS SUBSCRIPTION - PER BUSINESS
// ============================================
export const requestBusinessSubscription = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        const { businessId } = req.params;
        const {
            plan,
            amount,
            paymentMethod,
            accountNumber,
            accountHolderName,
            phoneNumber,
            bankName,
            accountType,
            notes
        } = req.body;

        console.log('📋 Business Subscription Request:', {
            vendorId,
            businessId,
            plan,
            amount,
            paymentMethod
        });

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!businessId) {
            return res.status(400).json({
                success: false,
                message: 'Business ID is required'
            });
        }

        if (!plan || !['monthly', 'yearly'].includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan. Use: monthly or yearly'
            });
        }

        if (!accountNumber || !accountHolderName) {
            return res.status(400).json({
                success: false,
                message: 'Account number and account holder name are required'
            });
        }

        const business = await Business.findOne({ _id: businessId, vendorId });
        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        const existingBusinessRequest = await SubscriptionRequest.findOne({
            businessId: business._id,
            status: 'pending'
        });

        if (existingBusinessRequest) {
            return res.status(400).json({
                success: false,
                message: `This business "${business.businessName}" already has a pending subscription request. Please wait for admin approval.`
            });
        }

        if (business.subscriptionStatus === 'active') {
            return res.status(400).json({
                success: false,
                message: `Business "${business.businessName}" is already subscribed to a plan.`
            });
        }

        business.subscriptionPlan = plan;
        business.subscriptionStatus = 'pending';
        await business.save();

        // ✅ FIXED: Status type safety
        const subscriptionRequest = await SubscriptionRequest.create({
            vendorId,
            businessId: business._id,
            businessName: business.businessName,
            vendorName: req.user?.name || 'Vendor',
            vendorEmail: req.user?.email || '',
            shopName: business.businessName,
            planType: plan,
            amount: amount || (plan === 'yearly' ? 10000 : 1000),
            paymentMethod: paymentMethod || 'easypaisa',
            accountNumber: accountNumber || 'N/A',
            accountHolderName: accountHolderName || 'N/A',
            phoneNumber: phoneNumber || '',
            bankName: bankName || '',
            accountType: accountType || '',
            notes: notes || '',
            status: 'pending' as const,
            requestedAt: new Date()
        });

        console.log(`✅ Business subscription request created: ${business.businessName} - ${plan} plan`);

        return res.status(201).json({
            success: true,
            message: `✅ Subscription request sent for ${business.businessName}! Waiting for admin approval.`,
            data: {
                businessId: business._id,
                businessName: business.businessName,
                plan,
                status: 'pending',
                requestId: subscriptionRequest._id,
                totalPending: await SubscriptionRequest.countDocuments({ businessId: business._id, status: 'pending' })
            }
        });

    } catch (error: any) {
        console.error('❌ Business subscription request error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to process subscription request'
        });
    }
};

// ============================================
// ✅ GET BUSINESS SUBSCRIPTION STATUS
// ============================================
export const getBusinessSubscriptionStatus = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;
        const { businessId } = req.params;

        if (!vendorId || !businessId) {
            return res.status(400).json({
                success: false,
                message: 'Vendor ID and Business ID are required'
            });
        }

        const business = await Business.findOne({ _id: businessId, vendorId });
        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        const pendingRequest = await SubscriptionRequest.findOne({
            businessId,
            status: 'pending'
        });

        const approvedRequest = await SubscriptionRequest.findOne({
            businessId,
            status: 'approved'
        }).sort({ approvedAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                businessId: business._id,
                businessName: business.businessName,
                plan: business.subscriptionPlan || 'free',
                status: business.subscriptionStatus || 'none',
                isActive: business.subscriptionStatus === 'active',
                isPending: business.subscriptionStatus === 'pending',
                hasPendingRequest: !!pendingRequest,
                hasApprovedRequest: !!approvedRequest,
                endDate: business.subscriptionEnd || null,
                approvedPlan: approvedRequest?.planType || null,
                approvedAt: approvedRequest?.approvedAt || null,
                totalPending: await SubscriptionRequest.countDocuments({ businessId, status: 'pending' })
            }
        });

    } catch (error: any) {
        console.error('❌ Get business subscription status error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ GET BUSINESS SUBSCRIPTION HISTORY
// ============================================
export const getBusinessSubscriptionHistory = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const subscriptions = await SubscriptionRequest.find({ vendorId })
            .populate('businessId', 'businessName')
            .sort({ requestedAt: -1 });

        return res.status(200).json({
            success: true,
            data: subscriptions.map((s: any) => ({
                id: s._id,
                businessId: s.businessId?._id || s.businessId,
                businessName: s.businessId?.businessName || s.businessName || s.shopName,
                planType: s.planType,
                amount: s.amount,
                status: s.status,
                requestedAt: s.requestedAt,
                approvedAt: s.approvedAt,
                rejectedReason: s.rejectedReason
            }))
        });

    } catch (error: any) {
        console.error('❌ Get business subscription history error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};