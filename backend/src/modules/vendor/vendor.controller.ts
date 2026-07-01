// backend/src/modules/vendor/vendor.controller.ts

import { Request, Response } from 'express';
import User from '../auth/User.model.js';
import Product from './Product.model.js';
import Employee from './Employee.model.js';
import Withdrawal from './Withdrawal.model.js';

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

        const [productsCount, productsList, employeesList] = await Promise.all([
            Product.countDocuments({ vendorId }),
            Product.find({ vendorId }).select('_id productName price stockQuantity description status colors sizes images'),
            Employee.find({ vendorId }).select('_id employeeName role email')
        ]);

        let trialDaysRemaining = 0;
        let showTrialWarning = false;

        if (vendor.subscriptionPlan === 'free' && vendor.trialEndDate) {
            const diffTime = new Date(vendor.trialEndDate).getTime() - new Date().getTime();
            trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
                subscription: {
                    plan: vendor.subscriptionPlan || 'free',
                    status: vendor.subscriptionStatus || 'active',
                    daysRemaining: trialDaysRemaining > 0 ? trialDaysRemaining : 0,
                    showTrialWarning,
                    hasRequestedExtension: vendor.hasRequestedExtension || false
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

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const formattedProducts = products.map((p: any) => {
            let images = p.images || [];
            if (Array.isArray(images) && images.length > 0) {
                images = images.map((img: string) => {
                    if (img.startsWith('http')) return img;
                    return `${baseUrl}/${img.replace(/\\/g, '/')}`;
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

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        let imagePaths: string[] = files.map(file => {
            return `${baseUrl}/${file.path.replace(/\\/g, '/')}`;
        });

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
// 8. UPGRADE SUBSCRIPTION - FIXED
// ============================================
export const upgradeSubscriptionRequest = async (req: any, res: Response): Promise<any> => {
    try {
        const vendorId = req.userId || req.user?._id;

        console.log('📋 [VENDOR] Upgrade Subscription - vendorId:', vendorId);
        console.log('📋 [VENDOR] Request body:', req.body);

        if (!vendorId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID not found'
            });
        }

        const { plan } = req.body;

        if (!plan || plan === 'free') {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription plan choice'
            });
        }

        // Check if vendor exists
        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Update subscription
        await User.findByIdAndUpdate(vendorId, {
            subscriptionPlan: plan,
            subscriptionStatus: 'pending_approval'
        });

        console.log(`✅ [VENDOR] Subscription request sent: ${plan} plan`);

        return res.status(200).json({
            success: true,
            message: '⏳ Subscription request sent for admin approval!'
        });
    } catch (error: any) {
        console.error('❌ [VENDOR] Upgrade subscription error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to process subscription request'
        });
    }
};

// ============================================
// 9. REQUEST TRIAL EXTENSION - FIXED
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
// 10. GET TRIAL STATUS
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
// 11. START FREE TRIAL - FIXED
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

        // Check if already on free trial
        if (vendor.subscriptionPlan === 'free' && vendor.subscriptionStatus === 'active') {
            return res.status(400).json({
                success: false,
                message: 'You are already on free trial'
            });
        }

        // Check if pending approval
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
// 12. CANCEL SUBSCRIPTION REQUEST - FIXED
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
// 13. REQUEST WITHDRAWAL (VENDOR)
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
// 14. GET WITHDRAWAL HISTORY (VENDOR)
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

// ✅ REMOVED: getWithdrawals (Admin version moved to admin.controller.ts)
// ✅ REMOVED: updateWithdrawalStatus (Admin version moved to admin.controller.ts)
// ✅ REMOVED: getSubscriptionRequests (Admin version moved to admin.controller.ts)
// ✅ REMOVED: updateSubscriptionStatus (Admin version moved to admin.controller.ts)