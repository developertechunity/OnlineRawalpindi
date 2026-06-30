import { Request, Response } from 'express';
import User from '../auth/User.model.js';
import Product from '../vendor/Product.model.js';
import Employee from '../vendor/Employee.model.js';
import mongoose from 'mongoose';

// ============================================
// GET ALL VENDORS (ADMIN ONLY)
// ============================================
export const getVendors = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('📋 Fetching vendors...');
        const vendors = await User.find({ role: 'vendor' })
            .select('-password')
            .sort({ createdAt: -1 });

        console.log(`📋 Found ${vendors.length} vendors`);

        // Get product counts for each vendor
        const vendorIds = vendors.map(v => v._id);
        const productCounts = await Product.aggregate([
            { $match: { vendorId: { $in: vendorIds } } },
            { $group: { _id: '$vendorId', count: { $sum: 1 } } }
        ]);

        const countMap: any = {};
        productCounts.forEach(item => {
            countMap[item._id.toString()] = item.count;
        });

        const formattedVendors = vendors.map((vendor: any) => ({
            id: vendor._id,
            shopName: vendor.shopName || vendor.name + "'s Shop",
            ownerName: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            status: vendor.approvalStatus || 'pending',
            subscriptionPlan: vendor.subscriptionPlan || 'free',
            subscriptionStatus: vendor.subscriptionStatus || 'active',
            trialEndDate: vendor.trialEndDate,
            hasRequestedExtension: vendor.hasRequestedExtension || false,
            totalProducts: countMap[vendor._id.toString()] || 0,
            totalEarnings: vendor.totalEarnings || 0,
            totalOrdersCount: vendor.totalOrdersCount || 0,
            date: vendor.createdAt ? new Date(vendor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            cnicFront: vendor.cnicFront || null,
            cnicBack: vendor.cnicBack || null,
            shopAddress: vendor.shopAddress || 'Not provided',
            isActive: vendor.isActive !== undefined ? vendor.isActive : true
        }));

        res.json({ success: true, vendors: formattedVendors });
    } catch (error: any) {
        console.error('❌ Error fetching vendors:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// UPDATE VENDOR STATUS (ADMIN ONLY)
// ============================================
export const updateVendorStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log(`📝 Updating vendor ${id} to ${status}`);

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "approved" or "rejected"'
            });
        }

        const vendor = await User.findOneAndUpdate(
            { _id: id, role: 'vendor' },
            { approvalStatus: status },
            { new: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        console.log(`✅ Vendor ${vendor.name} ${status} successfully`);

        res.json({
            success: true,
            message: `Vendor ${status} successfully`,
            vendor: {
                id: vendor._id,
                name: vendor.name,
                shopName: vendor.shopName,
                email: vendor.email,
                status: vendor.approvalStatus
            }
        });
    } catch (error: any) {
        console.error('❌ Error updating vendor status:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// GET VENDOR DETAILS (ADMIN ONLY)
// ============================================
export const getVendorDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const vendor = await User.findOne({ _id: id, role: 'vendor' })
            .select('-password');

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Get products
        const products = await Product.find({ vendorId: id });
        
        // Get employees
        const employees = await Employee.find({ vendorId: id });

        // Calculate trial days remaining
        let trialDaysRemaining = 0;
        if (vendor.subscriptionPlan === 'free' && vendor.trialEndDate) {
            const diffTime = new Date(vendor.trialEndDate).getTime() - new Date().getTime();
            trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        res.json({
            success: true,
            vendor: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                phone: vendor.phone,
                shopName: vendor.shopName,
                shopAddress: vendor.shopAddress,
                cnicFront: vendor.cnicFront,
                cnicBack: vendor.cnicBack,
                approvalStatus: vendor.approvalStatus,
                subscriptionPlan: vendor.subscriptionPlan,
                subscriptionStatus: vendor.subscriptionStatus,
                trialStartDate: vendor.trialStartDate,
                trialEndDate: vendor.trialEndDate,
                trialDaysRemaining: trialDaysRemaining,
                hasRequestedExtension: vendor.hasRequestedExtension,
                totalEarnings: vendor.totalEarnings,
                availableBalance: vendor.availableBalance,
                pendingWithdrawals: vendor.pendingWithdrawals,
                totalOrdersCount: vendor.totalOrdersCount,
                isActive: vendor.isActive,
                products: products.map(p => ({
                    id: p._id,
                    name: p.productName,
                    price: p.price,
                    stock: p.stockQuantity,
                    status: p.status
                })),
                employees: employees.map(e => ({
                    id: e._id,
                    name: e.employeeName,
                    email: e.email,
                    role: e.role
                })),
                createdAt: vendor.createdAt,
                updatedAt: vendor.updatedAt
            }
        });
    } catch (error: any) {
        console.error('❌ Error fetching vendor details:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// GET PENDING SUBSCRIPTION REQUESTS (ADMIN ONLY)
// ============================================
export const getPendingSubscriptionRequests = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('📋 Fetching pending subscription requests...');

        const vendors = await User.find({
            role: 'vendor',
            subscriptionStatus: 'pending_approval'
        }).select('-password').sort({ updatedAt: -1 });

        console.log(`📋 Found ${vendors.length} pending requests`);

        const formattedRequests = vendors.map((vendor: any) => ({
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            shopName: vendor.shopName || vendor.name + "'s Shop",
            subscriptionPlan: vendor.subscriptionPlan || 'free',
            hasRequestedExtension: vendor.hasRequestedExtension || false,
            extensionRequestDate: vendor.extensionRequestDate,
            requestType: vendor.hasRequestedExtension ? 'Trial Extension' : 'Subscription Upgrade',
            currentTrialDaysRemaining: vendor.getTrialDaysRemaining ? vendor.getTrialDaysRemaining() : 0,
            trialEndDate: vendor.trialEndDate,
            requestedAt: vendor.updatedAt,
            approvalStatus: vendor.approvalStatus
        }));

        res.json({
            success: true,
            requests: formattedRequests,
            total: formattedRequests.length
        });
    } catch (error: any) {
        console.error('❌ Error fetching subscription requests:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// APPROVE/REJECT SUBSCRIPTION REQUEST (ADMIN ONLY)
// ============================================
export const approveSubscriptionRequest = async (req: Request, res: Response): Promise<any> => {
    try {
        const { vendorId } = req.params;
        const { action, extensionDays, adminNotes } = req.body;

        // Validate action
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"'
            });
        }

        const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Check if vendor has a pending request
        if (vendor.subscriptionStatus !== 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'Vendor does not have any pending subscription request'
            });
        }

        if (action === 'reject') {
            // Reject the request
            await User.findByIdAndUpdate(vendorId, {
                subscriptionStatus: 'none',
                hasRequestedExtension: false,
                extensionRequestDate: null,
                extensionApproved: false
            });

            return res.json({
                success: true,
                message: '❌ Subscription request rejected successfully',
                vendor: {
                    id: vendor._id,
                    name: vendor.name,
                    email: vendor.email,
                    subscriptionStatus: 'none'
                }
            });
        }

        // APPROVE LOGIC
        const updateData: any = {
            subscriptionStatus: 'active',
            extensionApproved: true
        };

        // Check if it's a trial extension request
        if (vendor.hasRequestedExtension) {
            // Extend trial by specified days (default 15)
            const days = extensionDays || 15;
            const newEndDate = new Date();
            newEndDate.setDate(newEndDate.getDate() + days);

            updateData.trialEndDate = newEndDate;
            updateData.hasRequestedExtension = false;
            updateData.extensionRequestDate = null;
            updateData.extensionDaysGranted = days;
            updateData.subscriptionPlan = 'free'; // Keep as free trial

            await User.findByIdAndUpdate(vendorId, updateData);

            return res.json({
                success: true,
                message: `✅ Trial extended by ${days} days successfully!`,
                vendor: {
                    id: vendor._id,
                    name: vendor.name,
                    email: vendor.email,
                    subscriptionPlan: 'free',
                    subscriptionStatus: 'active',
                    newTrialEndDate: newEndDate,
                    extensionDaysGranted: days
                }
            });
        } else {
            // Approve paid subscription upgrade
            const plan = vendor.subscriptionPlan || 'monthly';
            
            // Set expiry based on plan
            const expiryDate = new Date();
            if (plan === 'monthly') {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
            } else if (plan === 'yearly') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            }

            updateData.subscriptionPlan = plan;
            updateData.subscriptionStatus = 'active';
            updateData.trialStartDate = new Date();
            updateData.trialEndDate = expiryDate;
            updateData.hasRequestedExtension = false;
            updateData.extensionRequestDate = null;

            await User.findByIdAndUpdate(vendorId, updateData);

            return res.json({
                success: true,
                message: `✅ ${plan} subscription approved and activated!`,
                vendor: {
                    id: vendor._id,
                    name: vendor.name,
                    email: vendor.email,
                    subscriptionPlan: plan,
                    subscriptionStatus: 'active',
                    expiryDate: expiryDate
                }
            });
        }
    } catch (error: any) {
        console.error('❌ Error processing subscription request:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// GET SUBSCRIPTION STATISTICS (ADMIN ONLY)
// ============================================
export const getSubscriptionStatistics = async (req: Request, res: Response): Promise<any> => {
    try {
        // Get counts by subscription plan
        const planStats = await User.aggregate([
            { $match: { role: 'vendor' } },
            { $group: {
                _id: '$subscriptionPlan',
                count: { $sum: 1 }
            }}
        ]);

        // Get counts by subscription status
        const statusStats = await User.aggregate([
            { $match: { role: 'vendor' } },
            { $group: {
                _id: '$subscriptionStatus',
                count: { $sum: 1 }
            }}
        ]);

        // Get vendors with trial ending soon (3 days or less)
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const trialEndingSoon = await User.countDocuments({
            role: 'vendor',
            subscriptionPlan: 'free',
            subscriptionStatus: 'active',
            trialEndDate: { 
                $lte: threeDaysFromNow,
                $gte: new Date()
            }
        });

        // Get vendors with expired trials
        const expiredTrials = await User.countDocuments({
            role: 'vendor',
            subscriptionPlan: 'free',
            subscriptionStatus: 'active',
            trialEndDate: { $lt: new Date() }
        });

        // Get pending requests count
        const pendingRequests = await User.countDocuments({
            role: 'vendor',
            subscriptionStatus: 'pending_approval'
        });

        // Get total vendors
        const totalVendors = await User.countDocuments({ role: 'vendor' });

        const planMap: any = {};
        planStats.forEach(item => {
            planMap[item._id] = item.count;
        });

        const statusMap: any = {};
        statusStats.forEach(item => {
            statusMap[item._id] = item.count;
        });

        res.json({
            success: true,
            statistics: {
                totalVendors,
                pendingRequests,
                byPlan: {
                    free: planMap['free'] || 0,
                    monthly: planMap['monthly'] || 0,
                    yearly: planMap['yearly'] || 0
                },
                byStatus: {
                    active: statusMap['active'] || 0,
                    pending_approval: statusMap['pending_approval'] || 0,
                    none: statusMap['none'] || 0,
                    expired: statusMap['expired'] || 0
                },
                trialEndingSoon,
                expiredTrials,
                timestamp: new Date()
            }
        });
    } catch (error: any) {
        console.error('❌ Error fetching subscription statistics:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// GET VENDOR ANALYTICS (ADMIN ONLY)
// ============================================
export const getVendorAnalytics = async (req: Request, res: Response): Promise<any> => {
    try {
        // Get product count per vendor
        const productStats = await Product.aggregate([
            { $group: { _id: '$vendorId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get vendor IDs with product counts
        const vendorIds = productStats.map(item => item._id);
        const vendors = await User.find({ _id: { $in: vendorIds }, role: 'vendor' })
            .select('name shopName email totalEarnings totalOrdersCount');

        const analytics = productStats.map(item => {
            const vendor = vendors.find(v => v._id.toString() === item._id.toString());
            return {
                vendorId: item._id,
                vendorName: vendor ? vendor.name : 'Unknown',
                shopName: vendor ? vendor.shopName : 'Unknown Shop',
                email: vendor ? vendor.email : 'Unknown',
                productCount: item.count,
                totalEarnings: vendor ? vendor.totalEarnings : 0,
                totalOrders: vendor ? vendor.totalOrdersCount : 0
            };
        });

        res.json({
            success: true,
            analytics
        });
    } catch (error: any) {
        console.error('❌ Error fetching vendor analytics:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// BULK UPDATE VENDOR STATUS (ADMIN ONLY)
// ============================================
export const bulkUpdateVendorStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { vendorIds, status } = req.body;

        if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide vendor IDs array'
            });
        }

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "approved", "rejected", or "pending"'
            });
        }

        const result = await User.updateMany(
            { _id: { $in: vendorIds }, role: 'vendor' },
            { approvalStatus: status }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} vendors updated successfully`,
            updatedCount: result.modifiedCount,
            status
        });
    } catch (error: any) {
        console.error('❌ Error bulk updating vendors:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// DELETE VENDOR (ADMIN ONLY)
// ============================================
export const deleteVendor = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const vendor = await User.findOne({ _id: id, role: 'vendor' });
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Delete associated products and employees
        await Product.deleteMany({ vendorId: id });
        await Employee.deleteMany({ vendorId: id });
        
        // Delete the vendor
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Vendor and all associated data deleted successfully'
        });
    } catch (error: any) {
        console.error('❌ Error deleting vendor:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};