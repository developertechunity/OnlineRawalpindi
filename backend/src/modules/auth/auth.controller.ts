import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './User.model.js';

// ============================================
// ✅ Generate Unique Vendor ID - WITHOUT PADDING (V-1, V-2, V-3...)
// ============================================
const getNextVendorId = async (): Promise<string> => {
    // ✅ Sab se bada vendorId find karo
    const lastVendor = await User.findOne({ 
        role: 'vendor',
        vendorId: { $exists: true, $ne: null }
    })
    .sort({ vendorId: -1 })
    .select('vendorId');
    
    if (!lastVendor || !lastVendor.vendorId) {
        return 'V-1';
    }
    
    const match = lastVendor.vendorId.match(/V-(\d+)/);
    if (!match) {
        return 'V-1';
    }
    
    const lastNumber = parseInt(match[1]);
    const nextNumber = lastNumber + 1;
    // ✅ WITHOUT PADDING - Sirf V-1, V-2, V-3...
    return `V-${nextNumber}`;
};

// ============================================
// REGISTER
// ============================================
export const register = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        
        const name = body.name;
        const email = body.email;
        const password = body.password;
        const phone = body.phone || '';
        const role = body.role || 'customer';
        const shopName = body.shopName || '';
        const shopAddress = body.shopAddress || '';
        const ntnNumber = body.ntnNumber || '';
        const cnicFront = body.cnicFront || '';
        const cnicBack = body.cnicBack || '';
        
        const files = req.files as any;
        let businessLicensePath = '';
        let cnicFrontPath = '';
        let cnicBackPath = '';

        if (files) {
            if (files.businessLicense && files.businessLicense.length > 0) {
                businessLicensePath = `uploads/${files.businessLicense[0].filename}`;
            }
            if (files.cnicFront && files.cnicFront.length > 0) {
                cnicFrontPath = `uploads/${files.cnicFront[0].filename}`;
            }
            if (files.cnicBack && files.cnicBack.length > 0) {
                cnicBackPath = `uploads/${files.cnicBack[0].filename}`;
            }
        }

        console.log('📝 Registration attempt:', { name, email, role, shopName });

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        const userData: any = {
            name,
            email,
            password: hashedPassword,
            phone: phone || '',
            role: role || 'customer',
            approvalStatus: role === 'vendor' ? 'pending' : 'approved'
        };

        if (role === 'vendor') {
            // ✅ Generate unique vendorId (WITHOUT PADDING)
            const vendorId = await getNextVendorId();
            
            userData.vendorId = vendorId;
            userData.shopName = shopName || name + "'s Shop";
            userData.shopAddress = shopAddress || '';
            userData.ntnNumber = ntnNumber || '';
            userData.businessLicense = businessLicensePath || '';
            userData.cnicFront = cnicFrontPath || cnicFront || '';
            userData.cnicBack = cnicBackPath || cnicBack || '';
            userData.subscriptionPlan = 'free';
            userData.subscriptionStatus = 'active';
            userData.totalEarnings = 0;
            userData.availableBalance = 0;
            userData.pendingWithdrawals = 0;
            userData.totalOrdersCount = 0;
            userData.hasRequestedExtension = false;
            userData.trialStartDate = trialStartDate;
            userData.trialEndDate = trialEndDate;
        }

        if (role === 'rider') {
            userData.vehicleType = body.vehicleType || 'bike';
            userData.vehicleNumber = body.vehicleNumber || '';
            userData.licenseNumber = body.licenseNumber || '';
            userData.zone = body.zone || 'Rawalpindi';
            userData.cnicFront = cnicFrontPath || cnicFront || '';
            userData.cnicBack = cnicBackPath || cnicBack || '';
        }

        const user = new User(userData);
        await user.save();

        console.log('✅ User registered:', user._id);
        console.log('✅ Vendor ID:', user.vendorId);

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                vendorId: user.vendorId || null,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                approvalStatus: user.approvalStatus,
                shopName: user.shopName || '',
                trialEndDate: user.trialEndDate
            }
        });
    } catch (error: any) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
};

// ============================================
// LOGIN
// ============================================
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (role && user.role !== role) {
            return res.status(401).json({
                success: false,
                message: `Invalid role. You are registered as ${user.role}`
            });
        }

        if (user.role === 'vendor' && user.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: `Your account is ${user.approvalStatus}. Please wait for admin approval.`
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                vendorId: user.vendorId || null,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                approvalStatus: user.approvalStatus,
                shopName: user.shopName || '',
                trialEndDate: user.trialEndDate
            }
        });
    } catch (error: any) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET CURRENT USER
// ============================================
export const getMe = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.userId || req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                vendorId: user.vendorId || null,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                approvalStatus: user.approvalStatus,
                shopName: user.shopName || '',
                trialEndDate: user.trialEndDate
            }
        });
    } catch (error: any) {
        console.error('❌ GetMe error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ✅ UPDATE VENDOR ID (Fix padding issue)
// ============================================
export const updateVendorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { vendorId } = req.body;
        
        const vendor = await User.findByIdAndUpdate(
            id,
            { vendorId },
            { new: true }
        );
        
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vendor not found' 
            });
        }
        
        console.log(`✅ Vendor ID updated: ${vendor.name} -> ${vendorId}`);
        
        res.json({ 
            success: true, 
            vendor: {
                id: vendor._id,
                vendorId: vendor.vendorId
            }
        });
    } catch (error: any) {
        console.error('❌ Update vendor ID error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};