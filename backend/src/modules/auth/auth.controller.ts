import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './User.model.js';

// ============================================
// REGISTER (Supports multipart/form-data)
// ============================================
export const register = async (req: Request, res: Response) => {
    try {
        // ✅ Support both JSON and FormData
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
        
        // ✅ Handle file uploads - get filenames if files uploaded
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

        // ✅ Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // ✅ Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // ✅ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Calculate trial dates
        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days trial

        // ✅ Create user object
        const userData: any = {
            name,
            email,
            password: hashedPassword,
            phone: phone || '',
            role: role || 'customer',
            approvalStatus: role === 'vendor' ? 'pending' : 'approved'
        };

        // ✅ Vendor specific fields
        if (role === 'vendor') {
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
            // ✅ TRIAL DATES SET KARO
            userData.trialStartDate = trialStartDate;
            userData.trialEndDate = trialEndDate;
        }

        // ✅ Rider specific fields
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
        console.log('✅ Trial End Date:', user.trialEndDate);

        // ✅ Generate token
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

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check role
        if (role && user.role !== role) {
            return res.status(401).json({
                success: false,
                message: `Invalid role. You are registered as ${user.role}`
            });
        }

        // Check approval status for vendors
        if (user.role === 'vendor' && user.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: `Your account is ${user.approvalStatus}. Please wait for admin approval.`
            });
        }

        // Generate token
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
// ✅ GET CURRENT USER (getMe)
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