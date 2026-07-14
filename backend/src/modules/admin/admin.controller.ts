// backend/src/modules/admin/admin.controller.ts

import { Request, Response } from 'express';
import User from '../auth/User.model.js';
import Employer from './Employer.model.js';
import Commission from './Commission.model.js';
import Coupon from './Coupon.model.js';
import Announcement from './Announcement.model.js';
import Withdrawal from '../vendor/Withdrawal.model.js';
import Business from '../vendor/Business.model.js';
import SubscriptionRequest from '../vendor/SubscriptionRequest.model.js';
import BusinessType from '../vendor/BusinessType.model.js';
import BusinessSubtype from '../vendor/BusinessSubtype.model.js';

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
            vendorId: vendor.vendorId || null,
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
            ntnNumber: vendor.ntnNumber || null,
            whatsapp: vendor.whatsapp || '',
            city: vendor.city || '',
            country: vendor.country || '',
            streetAddress: vendor.streetAddress || '',
            businessPhone: vendor.businessPhone || '',
            businessWhatsapp: vendor.businessWhatsapp || '',
            businessLandline: vendor.businessLandline || '',
            businessEmail: vendor.businessEmail || '',
            businessCity: vendor.businessCity || '',
            businessCountry: vendor.businessCountry || '',
            businessNtn: vendor.businessNtn || '',
            businessWebsite: vendor.businessWebsite || '',
            socialLink: vendor.socialLink || '',
            mapLocation: vendor.mapLocation || '',
            businessTimings: vendor.businessTimings || '',
            businessType: vendor.businessType || '',
            businessLogo: vendor.businessLogo || '',
            coverImage: vendor.coverImage || '',
            galleryImages: vendor.galleryImages || []
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
// WITHDRAWALS
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
// DELETE VENDOR
// ============================================
export const deleteVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const vendor = await User.findOne({ _id: id, role: 'vendor' });
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        await User.deleteOne({ _id: id });
        
        res.json({
            success: true,
            message: 'Vendor deleted successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ UPDATE VENDOR - COMPLETE FIXED
// ============================================
export const updateVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            shopName, ownerName, email, phone, shopAddress, ntnNumber,
            whatsapp, city, country, streetAddress,
            businessPhone, businessWhatsapp, businessLandline, businessEmail,
            businessCity, businessCountry, businessNtn, businessWebsite,
            socialLink, mapLocation, businessTimings, businessType
        } = req.body;
        
        console.log('📋 [ADMIN] Updating vendor:', id);
        console.log('📋 Body data received:', req.body);
        console.log('📋 Fields received - whatsapp:', whatsapp);
        console.log('📋 Fields received - city:', city);
        console.log('📋 Fields received - country:', country);
        console.log('📋 Fields received - streetAddress:', streetAddress);
        
        const vendor = await User.findOne({ _id: id, role: 'vendor' });
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        console.log('📋 Current vendor before update:', {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            whatsapp: vendor.whatsapp,
            city: vendor.city,
            country: vendor.country,
            streetAddress: vendor.streetAddress
        });
        
        // ✅ UPDATE ALL FIELDS - ALLOW EMPTY STRINGS TO CLEAR FIELDS
        // The issue was: using !== '' prevented clearing fields
        
        // Personal Info - ALL fields update correctly
        if (ownerName !== undefined) vendor.name = ownerName;
        if (email !== undefined) vendor.email = email;
        if (phone !== undefined) vendor.phone = phone;
        if (whatsapp !== undefined) vendor.whatsapp = whatsapp;  // ✅ FIXED
        if (ntnNumber !== undefined) vendor.ntnNumber = ntnNumber;
        if (streetAddress !== undefined) vendor.streetAddress = streetAddress; // ✅ FIXED
        if (city !== undefined) vendor.city = city;  // ✅ FIXED
        if (country !== undefined) vendor.country = country;  // ✅ FIXED
        if (shopName !== undefined) vendor.shopName = shopName;
        if (shopAddress !== undefined) vendor.shopAddress = shopAddress;
        
        // Business Info
        if (businessPhone !== undefined) vendor.businessPhone = businessPhone;
        if (businessWhatsapp !== undefined) vendor.businessWhatsapp = businessWhatsapp;
        if (businessLandline !== undefined) vendor.businessLandline = businessLandline;
        if (businessEmail !== undefined) vendor.businessEmail = businessEmail;
        if (businessCity !== undefined) vendor.businessCity = businessCity;
        if (businessCountry !== undefined) vendor.businessCountry = businessCountry;
        if (businessNtn !== undefined) vendor.businessNtn = businessNtn;
        if (businessWebsite !== undefined) vendor.businessWebsite = businessWebsite;
        if (socialLink !== undefined) vendor.socialLink = socialLink;
        if (mapLocation !== undefined) vendor.mapLocation = mapLocation;
        if (businessTimings !== undefined) vendor.businessTimings = businessTimings;
        if (businessType !== undefined) vendor.businessType = businessType;
        
        // ✅ Handle files
        const files = req.files as any;
        if (files) {
            if (files.cnicFront && files.cnicFront[0]) {
                vendor.cnicFront = files.cnicFront[0].path;
            }
            if (files.cnicBack && files.cnicBack[0]) {
                vendor.cnicBack = files.cnicBack[0].path;
            }
            if (files.businessLicense && files.businessLicense[0]) {
                vendor.businessLicense = files.businessLicense[0].path;
            }
            if (files.businessLogo && files.businessLogo[0]) {
                vendor.businessLogo = files.businessLogo[0].path;
            }
            if (files.coverImage && files.coverImage[0]) {
                vendor.coverImage = files.coverImage[0].path;
            }
            if (files.galleryImages) {
                const galleryPaths = files.galleryImages.map((f: any) => f.path);
                if (vendor.galleryImages) {
                    vendor.galleryImages = [...vendor.galleryImages, ...galleryPaths];
                } else {
                    vendor.galleryImages = galleryPaths;
                }
            }
        }
        
        await vendor.save();
        
        console.log('✅ Vendor updated successfully:', {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            whatsapp: vendor.whatsapp,
            city: vendor.city,
            country: vendor.country,
            streetAddress: vendor.streetAddress
        });
        
        res.json({
            success: true,
            message: 'Vendor updated successfully',
            vendor: {
                id: vendor._id,
                shopName: vendor.shopName || '',
                ownerName: vendor.name || '',
                email: vendor.email || '',
                phone: vendor.phone || '',
                shopAddress: vendor.shopAddress || '',
                ntnNumber: vendor.ntnNumber || '',
                whatsapp: vendor.whatsapp || '',
                city: vendor.city || '',
                country: vendor.country || '',
                streetAddress: vendor.streetAddress || '',
                status: vendor.approvalStatus || 'pending',
                date: vendor.createdAt ? new Date(vendor.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                businessType: vendor.businessType || '',
                businessTimings: vendor.businessTimings || '',
                businessPhone: vendor.businessPhone || '',
                businessWhatsapp: vendor.businessWhatsapp || '',
                businessLandline: vendor.businessLandline || '',
                businessEmail: vendor.businessEmail || '',
                businessCity: vendor.businessCity || '',
                businessCountry: vendor.businessCountry || '',
                businessNtn: vendor.businessNtn || '',
                businessWebsite: vendor.businessWebsite || '',
                socialLink: vendor.socialLink || '',
                mapLocation: vendor.mapLocation || '',
                cnicFront: vendor.cnicFront || '',
                cnicBack: vendor.cnicBack || '',
                businessLicense: vendor.businessLicense || '',
                businessLogo: vendor.businessLogo || '',
                coverImage: vendor.coverImage || '',
                galleryImages: vendor.galleryImages || []
            }
        });
    } catch (error: any) {
        console.error('❌ Error updating vendor:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// BUSINESS SUBSCRIPTION REQUESTS
// ============================================
export const getBusinessSubscriptionRequests = async (req: Request, res: Response) => {
    try {
        console.log('📋 [ADMIN] Fetching business subscription requests...');

        const requests = await SubscriptionRequest.find({ 
            businessId: { $exists: true, $ne: null },
            planType: { $in: ['monthly', 'yearly'] }
        })
            .populate('businessId', 'businessName businessEmail phone addressCity addressCountry status subscriptionStatus subscriptionPlan')
            .populate('vendorId', 'name email phone')
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${requests.length} paid subscription requests`);

        const formatted = requests.map((req: any) => ({
            id: req._id,
            businessId: req.businessId?._id || req.businessId || null,
            businessName: req.businessId?.businessName || req.businessName || 'Unknown Business',
            businessEmail: req.businessId?.businessEmail || 'N/A',
            businessStatus: req.businessId?.status || 'pending',
            vendorId: req.vendorId?._id || req.vendorId || null,
            vendorName: req.vendorId?.name || req.vendorName || 'Unknown Vendor',
            vendorEmail: req.vendorId?.email || req.vendorEmail || 'N/A',
            vendorPhone: req.vendorId?.phone || req.phoneNumber || 'N/A',
            plan: req.planType || 'monthly',
            amount: req.amount || 0,
            paymentMethod: req.paymentMethod || 'easypaisa',
            accountNumber: req.accountNumber || 'N/A',
            accountHolderName: req.accountHolderName || 'N/A',
            phoneNumber: req.phoneNumber || 'N/A',
            bankName: req.bankName || 'N/A',
            notes: req.notes || '',
            status: req.status || 'pending',
            createdAt: req.createdAt ? new Date(req.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            requestedAt: req.requestedAt ? new Date(req.requestedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));

        res.json({ 
            success: true, 
            requests: formatted,
            count: formatted.length
        });
    } catch (error: any) {
        console.error('❌ [ADMIN] Error fetching business subscriptions:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const approveBusinessSubscriptionRequest = async (req: any, res: Response): Promise<any> => {
    try {
        const { requestId } = req.params;
        const adminId = req.userId || req.user?._id;

        console.log(`📋 [ADMIN] Approving business subscription request: ${requestId}`);

        const request = await SubscriptionRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Subscription request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Request is already ${request.status}`
            });
        }

        request.status = 'approved';
        request.approvedBy = adminId;
        request.approvedAt = new Date();
        await request.save();

        const rawPlan = request.planType || request.plan || 'free';
        const plan: 'free' | 'monthly' | 'yearly' =
            rawPlan === 'monthly' || rawPlan === 'yearly' ? rawPlan : 'free';

        if (request.businessId) {
            const business = await Business.findById(request.businessId);
            if (business) {
                business.status = 'approved';
                business.subscriptionPlan = plan;
                business.subscriptionStatus = 'approved';
                
                const endDate = new Date();
                if (plan === 'yearly') {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                } else if (plan === 'monthly') {
                    endDate.setMonth(endDate.getMonth() + 1);
                } else {
                    endDate.setDate(endDate.getDate() + 30);
                }
                business.subscriptionEnd = endDate;
                business.subscriptionStart = new Date();
                await business.save();
                console.log(`✅ Business UPDATED: ${business.businessName} -> plan: ${plan}, ends: ${endDate}`);
            }
        }

        if (request.vendorId) {
            const vendor = await User.findById(request.vendorId);
            if (vendor) {
                vendor.subscriptionStatus = 'active';
                vendor.subscriptionPlan = plan;
                const endDate = new Date();
                if (plan === 'yearly') {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                } else if (plan === 'monthly') {
                    endDate.setMonth(endDate.getMonth() + 1);
                } else {
                    endDate.setDate(endDate.getDate() + 30);
                }
                vendor.subscriptionExpiryDate = endDate;
                vendor.hasRequestedExtension = false;
                await vendor.save();
                console.log(`✅ Vendor UPDATED: ${vendor.name} -> ${plan} plan`);
            }
        }

        return res.status(200).json({
            success: true,
            message: `✅ Business subscription approved! Plan: ${plan.toUpperCase()}`
        });

    } catch (error: any) {
        console.error('❌ Approve business subscription error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to approve business subscription'
        });
    }
};

export const rejectBusinessSubscriptionRequest = async (req: any, res: Response): Promise<any> => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        const adminId = req.userId || req.user?._id;

        console.log(`📋 [ADMIN] Rejecting business subscription request: ${requestId}`);

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        const request = await SubscriptionRequest.findById(requestId);
        if (!request) {
            console.log(`❌ Business subscription request not found: ${requestId}`);
            return res.status(404).json({
                success: false,
                message: 'Subscription request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Request is already ${request.status}`
            });
        }

        request.status = 'rejected';
        request.rejectedReason = reason || 'No reason provided';
        request.approvedBy = adminId;
        request.approvedAt = new Date();
        await request.save();
        console.log(`✅ Business subscription request rejected: ${requestId}`);

        if (request.businessId) {
            try {
                const business = await Business.findById(request.businessId);
                if (business) {
                    business.status = 'rejected';
                    business.subscriptionPlan = 'free';
                    business.subscriptionStatus = 'rejected';
                    business.subscriptionEnd = null;
                    business.subscriptionStart = null;
                    await business.save();
                    console.log(`✅ Business UPDATED: ${business.businessName} -> status: rejected`);
                }
            } catch (businessError: any) {
                console.error('❌ Error updating business:', businessError);
            }
        }

        if (request.vendorId) {
            try {
                const vendor = await User.findById(request.vendorId);
                if (vendor) {
                    vendor.subscriptionStatus = 'none';
                    vendor.subscriptionPlan = 'free';
                    vendor.hasRequestedExtension = false;
                    await vendor.save();
                    console.log(`✅ Vendor UPDATED: ${vendor.name} -> free plan`);
                }
            } catch (vendorError: any) {
                console.error('❌ Error updating vendor:', vendorError);
            }
        }

        return res.status(200).json({
            success: true,
            message: `❌ Business subscription rejected successfully.`
        });

    } catch (error: any) {
        console.error('❌ Reject business subscription error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to reject business subscription'
        });
    }
};

// ============================================
// DELETE BUSINESS SUBSCRIPTION
// ============================================
export const deleteBusinessSubscription = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        console.log(`📋 [ADMIN] Deleting business subscription: ${id}`);
        
        const result = await SubscriptionRequest.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ 
                success: false, 
                message: 'Subscription request not found' 
            });
        }
        
        console.log(`✅ Business subscription deleted: ${id}`);
        
        res.json({ 
            success: true, 
            message: 'Subscription deleted successfully' 
        });
    } catch (error: any) {
        console.error('❌ Error deleting business subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// BUSINESS TYPES & SUBTYPES
// ============================================
export const getBusinessTypes = async (req: Request, res: Response) => {
    try {
        console.log('📋 [ADMIN] Fetching business types...');
        const types = await BusinessType.find().sort({ name: 1 });
        console.log(`✅ Found ${types.length} business types`);
        res.json({ success: true, data: types });
    } catch (error: any) {
        console.error('❌ [ADMIN] Error fetching business types:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSubtypesByType = async (req: Request, res: Response) => {
    try {
        const { typeId } = req.params;
        console.log(`📋 [ADMIN] Fetching subtypes for type: ${typeId}`);
        const subtypes = await BusinessSubtype.find({ businessTypeId: typeId }).sort({ name: 1 });
        console.log(`✅ Found ${subtypes.length} subtypes`);
        res.json({ success: true, data: subtypes });
    } catch (error: any) {
        console.error('❌ [ADMIN] Error fetching subtypes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// GET VENDOR BUSINESSES
// ============================================
export const getVendorBusinesses = async (req: Request, res: Response) => {
    try {
        const { vendorId } = req.params;
        console.log(`📋 [ADMIN] Fetching businesses for vendor: ${vendorId}`);

        const businesses = await Business.find({ vendorId })
            .populate('businessTypeId', 'name')
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${businesses.length} businesses`);

        res.json({
            success: true,
            data: businesses
        });
    } catch (error: any) {
        console.error('❌ Error fetching businesses:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET SINGLE BUSINESS BY ID
// ============================================
export const getBusinessById = async (req: Request, res: Response) => {
    try {
        const { businessId } = req.params;
        console.log(`📋 [ADMIN] Fetching business: ${businessId}`);

        const business = await Business.findById(businessId)
            .populate('businessTypeId', 'name')
            .populate('subtypes', 'name');

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        res.json({
            success: true,
            data: business
        });
    } catch (error: any) {
        console.error('❌ Error fetching business:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE BUSINESS
// ============================================
export const updateBusiness = async (req: Request, res: Response) => {
    try {
        const { businessId } = req.params;
        const updates = req.body;

        console.log('📋 [ADMIN] Updating business:', businessId);
        console.log('📋 Updates:', updates);

        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        const allowedFields = [
            'businessName', 
            'businessNtn', 
            'businessEmail', 
            'phone', 
            'whatsapp', 
            'landline', 
            'addressCity', 
            'addressCountry',
            'mapLocation', 
            'open24_7', 
            'businessTiming', 
            'businessTimings',
            'socialLinks',
            'businessLogo', 
            'coverImage', 
            'galleryImages',
            'businessTypeId', 
            'businessLicense',
            'subtypes'
        ] as const;

        allowedFields.forEach(field => {
            if (updates[field] !== undefined && updates[field] !== null) {
                if (field === 'businessTimings' && updates[field] === '') {
                    business[field] = '';
                } else if (field === 'subtypes') {
                    try {
                        const subtypes = typeof updates[field] === 'string' 
                            ? JSON.parse(updates[field]) 
                            : updates[field];
                        business[field] = subtypes;
                    } catch (e) {
                        console.error('❌ Error parsing subtypes:', e);
                    }
                } else {
                    (business as any)[field] = updates[field];
                }
            }
        });

        const files = req.files as any;
        if (files) {
            if (files.businessLicense) business.businessLicense = files.businessLicense[0].path;
            if (files.businessLogo) business.businessLogo = files.businessLogo[0].path;
            if (files.coverImage) business.coverImage = files.coverImage[0].path;
            if (files.galleryImages) {
                const galleryPaths = files.galleryImages.map((f: any) => f.path);
                if (business.galleryImages) {
                    business.galleryImages = [...business.galleryImages, ...galleryPaths];
                } else {
                    business.galleryImages = galleryPaths;
                }
            }
        }

        await business.save();

        console.log('✅ Business updated:', business.businessName);

        res.json({
            success: true,
            message: 'Business updated successfully',
            data: business
        });
    } catch (error: any) {
        console.error('❌ Error updating business:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE VENDOR ID
// ============================================
export const updateVendorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { vendorId } = req.body;

        const vendor = await User.findOneAndUpdate(
            { _id: id, role: 'vendor' },
            { vendorId },
            { new: true }
        );

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor ID updated successfully',
            vendor: {
                id: vendor._id,
                vendorId: vendor.vendorId
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};