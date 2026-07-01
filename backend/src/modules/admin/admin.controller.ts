import { Request, Response } from 'express';
import User from '../auth/User.model.js';
import Employer from './Employer.model.js';
import Commission from './Commission.model.js';
import Coupon from './Coupon.model.js';
import Announcement from './Announcement.model.js';
// ✅ IMPORT WITHDRAWAL
import Withdrawal from '../vendor/Withdrawal.model.js';

// ============================================
// VENDORS
// ============================================
export const getVendors = async (req: Request, res: Response) => {
    try {
        const vendors = await User.find({ role: 'vendor' })
            .select('-password')
            .sort({ createdAt: -1 });

        const formattedVendors = vendors.map((vendor: any) => ({
            id: vendor._id,
            shopName: vendor.shopName || vendor.name + "'s Shop",
            ownerName: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            status: vendor.approvalStatus || 'pending',
            date: vendor.createdAt ? new Date(vendor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            cnicFront: vendor.cnicFront,
            cnicBack: vendor.cnicBack,
            businessLicense: vendor.businessLicense,
            shopAddress: vendor.shopAddress || 'Not provided',
            ntnNumber: vendor.ntnNumber || null
        }));

        res.json({ success: true, vendors: formattedVendors });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateVendorStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        
        const vendor = await User.findOneAndUpdate(
            { _id: id, role: 'vendor' }, 
            { approvalStatus: status }, 
            { new: true }
        );
        
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        res.json({ success: true, message: `Vendor ${status} successfully` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// RIDERS & CUSTOMERS
// ============================================
export const getRiders = async (req: Request, res: Response) => {
    try {
        const riders = await User.find({ role: 'rider' })
            .select('-password')
            .sort({ createdAt: -1 });
            
        const formattedRiders = riders.map((r: any) => ({
            id: r._id, 
            name: r.name, 
            email: r.email, 
            status: r.approvalStatus || 'approved'
        }));
        
        res.json({ success: true, riders: formattedRiders });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await User.find({ role: 'customer' })
            .select('-password')
            .sort({ createdAt: -1 });
            
        const formattedCustomers = customers.map((c: any) => ({
            id: c._id, 
            name: c.name, 
            email: c.email, 
            status: 'active'
        }));
        
        res.json({ success: true, customers: formattedCustomers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// EMPLOYEES
// ============================================
export const getEmployees = async (req: Request, res: Response) => {
    try {
        const list = await Employer.find().sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            employees: list.map((e: any) => ({ 
                id: e._id, 
                name: e.name, 
                email: e.email, 
                role: e.role 
            })) 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const { name, email, role } = req.body;
        const exist = await Employer.findOne({ email });
        if (exist) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee with this email already exists' 
            });
        }
        const emp = new Employer({ name, email, role });
        await emp.save();
        res.json({ 
            success: true, 
            message: 'Employee provisioned successfully', 
            employee: emp 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteEmployee = async (req: Request, res: Response) => {
    try {
        await Employer.findByIdAndDelete(req.params.id);
        res.json({ 
            success: true, 
            message: 'Employee access terminated successfully' 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// COMMISSIONS
// ============================================
export const getCommissions = async (req: Request, res: Response) => {
    try {
        const list = await Commission.find().sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            commissions: list.map((c: any) => ({ 
                id: c._id, 
                name: c.name, 
                type: c.type, 
                value: c.value, 
                description: c.description 
            })) 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCommission = async (req: Request, res: Response) => {
    try {
        const { name, type, value, description } = req.body;
        const comm = new Commission({ name, type, value, description });
        await comm.save();
        res.json({ 
            success: true, 
            message: 'Strategy injected successfully', 
            commission: comm 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCommission = async (req: Request, res: Response) => {
    try {
        await Commission.findByIdAndDelete(req.params.id);
        res.json({ 
            success: true, 
            message: 'Strategy deleted successfully' 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// COUPONS
// ============================================
export const getCoupons = async (req: Request, res: Response) => {
    try {
        const list = await Coupon.find().sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            coupons: list.map((c: any) => ({ 
                id: c._id, 
                code: c.code, 
                type: c.type, 
                discount: c.discount, 
                expiry: c.expiry, 
                usage: c.usage 
            })) 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCoupon = async (req: Request, res: Response) => {
    try {
        const { code, type, discount, expiry } = req.body;
        const exist = await Coupon.findOne({ code: code.toUpperCase() });
        if (exist) {
            return res.status(400).json({ 
                success: false, 
                message: 'Coupon code already exists' 
            });
        }
        const cp = new Coupon({ 
            code: code.toUpperCase(), 
            type, 
            discount, 
            expiry 
        });
        await cp.save();
        res.json({ 
            success: true, 
            message: 'Coupon minted successfully', 
            coupon: cp 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ 
            success: true, 
            message: 'Coupon tracking terminated' 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// ANNOUNCEMENTS
// ============================================
export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const list = await Announcement.find().sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            announcements: list.map((a: any) => ({ 
                id: a._id, 
                title: a.title, 
                content: a.content, 
                audience: a.audience, 
                date: a.date 
            })) 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { title, content, audience } = req.body;
        const date = new Date().toISOString().split('T')[0];
        const ann = new Announcement({ title, content, audience, date });
        await ann.save();
        res.json({ 
            success: true, 
            message: 'Broadcast launched live', 
            announcement: ann 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ 
            success: true, 
            message: 'Broadcast removed successfully' 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// ✅ WITHDRAWALS
// ============================================
export const getWithdrawals = async (req: Request, res: Response) => {
    try {
        console.log('📋 [ADMIN] Fetching withdrawals...');
        
        const withdrawals = await Withdrawal.find()
            .populate('vendorId', 'name shopName email')
            .sort({ requestedAt: -1 });

        const formatted = withdrawals.map((w: any) => ({
            id: w._id,
            vendorId: w.vendorId._id,
            vendorName: w.vendorId.name,
            shopName: w.vendorId.shopName || w.vendorId.name + "'s Shop",
            amount: w.amount,
            method: w.method,
            accountDetails: w.accountNumber || w.accountHolderName,
            status: w.status || 'pending',
            requestedAt: w.requestedAt ? new Date(w.requestedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));

        res.json({ success: true, withdrawals: formatted });
    } catch (error: any) {
        console.error('❌ [ADMIN] Error fetching withdrawals:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateWithdrawalStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected', 'processed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const withdrawal = await Withdrawal.findById(id);
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        withdrawal.status = status;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        if (status === 'approved' || status === 'processed') {
            const vendor = await User.findById(withdrawal.vendorId);
            if (vendor) {
                vendor.pendingWithdrawals = Math.max(0, (vendor.pendingWithdrawals || 0) - withdrawal.amount);
                await vendor.save();
            }
        }

        res.json({ success: true, message: `Withdrawal ${status} successfully` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// ✅ SUBSCRIPTIONS
// ============================================
export const getSubscriptionRequests = async (req: Request, res: Response) => {
    try {
        console.log('📋 [ADMIN] Fetching subscription requests...');

        const vendors = await User.find({
            subscriptionStatus: 'pending_approval',
            role: 'vendor'
        }).select('name shopName email subscriptionPlan hasRequestedExtension extensionRequestDate');

        const formatted = vendors.map((v: any) => ({
            id: v._id,
            vendorId: v._id,
            vendorName: v.name,
            shopName: v.shopName || v.name + "'s Shop",
            planType: v.subscriptionPlan === 'monthly' || v.subscriptionPlan === 'yearly'
                ? v.subscriptionPlan
                : v.hasRequestedExtension ? 'trial_extension' : 'unknown',
            amount: v.subscriptionPlan === 'monthly' ? 1000 : v.subscriptionPlan === 'yearly' ? 10000 : 0,
            status: 'pending',
            requestedAt: v.extensionRequestDate
                ? new Date(v.extensionRequestDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
        }));

        res.json({ success: true, requests: formatted });
    } catch (error: any) {
        console.error('❌ [ADMIN] Error fetching subscriptions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "approved" or "rejected"'
            });
        }

        const vendor = await User.findById(id);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        if (status === 'approved') {
            if (vendor.hasRequestedExtension) {
                const newTrialEndDate = new Date();
                newTrialEndDate.setDate(newTrialEndDate.getDate() + 15);
                vendor.trialEndDate = newTrialEndDate;
                vendor.hasRequestedExtension = false;
                vendor.subscriptionStatus = 'active';
                await vendor.save();

                return res.json({
                    success: true,
                    message: '✅ Trial extension approved! 15 days added.'
                });
            }

            const daysToAdd = vendor.subscriptionPlan === 'monthly' ? 30 : 365;
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);

            vendor.subscriptionStatus = 'active';
            vendor.subscriptionExpiryDate = newExpiryDate;
            vendor.hasRequestedExtension = false;
            await vendor.save();

            return res.json({
                success: true,
                message: `✅ Subscription approved! ${vendor.subscriptionPlan} plan activated.`
            });
        } else {
            vendor.subscriptionStatus = 'active';
            vendor.hasRequestedExtension = false;
            vendor.subscriptionPlan = 'free';
            await vendor.save();

            return res.json({
                success: true,
                message: '❌ Subscription request rejected.'
            });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};