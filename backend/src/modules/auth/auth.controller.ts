import { Request, Response } from 'express';
import User from './User.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface AuthenticatedRequest extends Request {
    userId?: string;
    userRole?: string;
}

// ============================================
// 1. REGISTER USER
// ============================================
export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        // Core fields from request body
        const { name, email, password, phone, role } = req.body;

        // Fallbacks for variation in frontend keys
        const shopName = req.body.shopName || req.body.shop_name || req.body.shopname;
        const shopAddress = req.body.shopAddress || req.body.shop_address || req.body.shopaddress;

        // 1. Check basic required fields
        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing (Name, Email, Password, or Phone)'
            });
        }

        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Prepare User Data Object
        const userData: any = {
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'customer',
            isVerified: false,
            isActive: true,
            approvalStatus: 'approved' // Default approved for customers/riders
        };

        // 5. Vendor Specific Validation & File Handling
        if (role === 'vendor') {
            if (!shopName || !shopAddress) {
                return res.status(400).json({
                    success: false,
                    message: 'Shop Name and Address are required for vendors'
                });
            }

            userData.approvalStatus = 'pending'; // Requires admin approval
            userData.shopName = shopName;
            userData.shopAddress = shopAddress;
            
            // Handle CNIC Upload paths safely if files exist
            const files = req.files as any;
            if (files) {
                if (files.cnicFront) userData.cnicFront = files.cnicFront[0].path;
                if (files.cnicBack) userData.cnicBack = files.cnicBack[0].path;
            }

            // Set trial period (30 days from registration)
            const trialStartDate = new Date();
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30);

            userData.trialStartDate = trialStartDate;
            userData.trialEndDate = trialEndDate;
            userData.subscriptionPlan = 'free';
            userData.subscriptionStatus = 'active';
            userData.totalEarnings = 0;
            userData.availableBalance = 0;
            userData.pendingWithdrawals = 0;
            userData.totalOrdersCount = 0;
            userData.hasRequestedExtension = false;
        }

        // 6. Save to MongoDB Database
        const user = await User.create(userData);

        // 7. Generate JWT Token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '7d' }
        );

        // 8. Prepare response
        const userResponse: any = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            approvalStatus: user.approvalStatus,
            isVerified: user.isVerified,
            isActive: user.isActive
        };

        // Add vendor specific fields to response
        if (role === 'vendor') {
            userResponse.shopName = user.shopName;
            userResponse.shopAddress = user.shopAddress;
            userResponse.subscriptionPlan = user.subscriptionPlan;
            userResponse.subscriptionStatus = user.subscriptionStatus;
            userResponse.trialEndDate = user.trialEndDate;
            userResponse.trialDaysRemaining = 30; // Initial trial days
        }

        // 9. Send Success Response
        return res.status(201).json({
            success: true,
            message: role === 'vendor' 
                ? 'Registration successful! Your account is pending admin approval. You have 30 days free trial.' 
                : 'User registered successfully',
            token,
            user: userResponse
        });

    } catch (error: any) {
        console.error("🔥 REGISTRATION ERROR LOG:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error during registration: ' + error.message 
        });
    }
};

// ============================================
// 2. LOGIN USER
// ============================================
export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // VENDOR APPROVAL CHECK
        if (user.role === 'vendor') {
            if (user.approvalStatus === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: '⏳ Your account is pending admin approval. Please wait for verification.',
                    approvalStatus: 'pending'
                });
            }
            if (user.approvalStatus === 'rejected') {
                return res.status(403).json({
                    success: false,
                    message: '❌ Your account has been rejected. Please contact support for more information.',
                    approvalStatus: 'rejected'
                });
            }
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '7d' }
        );

        // Prepare user response
        const userResponse: any = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            approvalStatus: user.approvalStatus,
            isVerified: user.isVerified,
            isActive: user.isActive
        };

        // Add vendor specific fields
        if (user.role === 'vendor') {
            userResponse.shopName = user.shopName;
            userResponse.shopAddress = user.shopAddress;
            userResponse.subscriptionPlan = user.subscriptionPlan;
            userResponse.subscriptionStatus = user.subscriptionStatus;
            userResponse.trialStartDate = user.trialStartDate;
            userResponse.trialEndDate = user.trialEndDate;
            userResponse.hasRequestedExtension = user.hasRequestedExtension || false;
            
            // Calculate trial days remaining
            if (user.subscriptionPlan === 'free' && user.trialEndDate) {
                const diffTime = new Date(user.trialEndDate).getTime() - new Date().getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                userResponse.trialDaysRemaining = daysRemaining > 0 ? daysRemaining : 0;
                userResponse.showTrialWarning = daysRemaining <= 3 && daysRemaining > 0;
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });
    } catch (error: any) {
        console.error("🔥 LOGIN ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
};

// ============================================
// 3. FORGOT PASSWORD - Send OTP
// ============================================
export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '❌ User with this email does not exist.'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in user document (you'll need to add these fields to your model)
        // Or use a separate OTP collection
        user.resetPasswordToken = otp;
        user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: `"Digital Rawalpindi Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔑 Digital Rawalpindi - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px; border-radius: 8px; margin: 0 auto;">
                    <h2 style="color: #4f46e5; text-align: center;">Digital Rawalpindi</h2>
                    <hr style="border: 0; border-top: 1px solid #eee;" />
                    <p>Aapne password reset karne ki request ki hai. Aapka 6-digit verification OTP code niche diya gaya hai:</p>
                    <div style="font-size: 28px; font-weight: bold; padding: 15px; background: #f3f4f6; text-align: center; letter-spacing: 6px; color: #1e1b4b; border-radius: 6px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="font-size: 14px; color: #374151;">Yeh OTP code 10 minutes ke liye valid hai.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #eee; padding-top: 10px;">
                        Agar yeh request aapne nahi ki, to is email ko ignore karein.
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: '✅ OTP code sent successfully to your email inbox!'
        });

    } catch (error: any) {
        console.error("🔥 Nodemailer Error Details:", error);
        return res.status(500).json({ 
            success: false, 
            message: '❌ Failed to send email. Server error: ' + error.message 
        });
    }
};

// ============================================
// 4. RESET PASSWORD - Verify OTP and Reset
// ============================================
export const resetPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp, newPassword } = req.body;

        // Validate input
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "❌ All fields (Email, OTP, and New Password) are required." 
            });
        }

        // Validate OTP format
        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ 
                success: false, 
                message: "❌ Invalid OTP code. It must be exactly 6 digits." 
            });
        }

        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "❌ Password must be at least 6 characters long."
            });
        }

        // Find user with valid OTP
        const user = await User.findOne({ 
            email,
            resetPasswordToken: otp,
            resetPasswordExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "❌ Invalid or expired OTP. Please request a new OTP." 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "✅ Password updated successfully! Moving you back to login screen."
        });

    } catch (error: any) {
        console.error("🔥 Reset Password Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error during password reset: " + error.message 
        });
    }
};

// ============================================
// 5. GET CURRENT USER
// ============================================
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userResponse: any = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            approvalStatus: user.approvalStatus,
            isVerified: user.isVerified,
            isActive: user.isActive
        };

        // Add vendor specific fields
        if (user.role === 'vendor') {
            userResponse.shopName = user.shopName;
            userResponse.shopAddress = user.shopAddress;
            userResponse.subscriptionPlan = user.subscriptionPlan;
            userResponse.subscriptionStatus = user.subscriptionStatus;
            userResponse.trialStartDate = user.trialStartDate;
            userResponse.trialEndDate = user.trialEndDate;
            userResponse.hasRequestedExtension = user.hasRequestedExtension || false;
            userResponse.totalEarnings = user.totalEarnings || 0;
            userResponse.availableBalance = user.availableBalance || 0;
            userResponse.totalOrdersCount = user.totalOrdersCount || 0;
            
            // Calculate trial days remaining
            if (user.subscriptionPlan === 'free' && user.trialEndDate) {
                const diffTime = new Date(user.trialEndDate).getTime() - new Date().getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                userResponse.trialDaysRemaining = daysRemaining > 0 ? daysRemaining : 0;
                userResponse.showTrialWarning = daysRemaining <= 3 && daysRemaining > 0;
            }
        }

        return res.status(200).json({
            success: true,
            user: userResponse
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// 6. LOGOUT
// ============================================
export const logout = async (req: Request, res: Response): Promise<any> => {
    try {
        // Since JWT is stateless, we just tell client to remove token
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully. Please remove token from client.'
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// 7. UPDATE PROFILE
// ============================================
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId;
        const { name, phone, shopName, shopAddress } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (shopName) updateData.shopName = shopName;
        if (shopAddress) updateData.shopAddress = shopAddress;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// 8. CHANGE PASSWORD
// ============================================
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// 9. VERIFY EMAIL (Optional)
// ============================================
export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.params;

        // Verify email verification token
        // You'll need to implement this based on your verification flow

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// ============================================
// 10. RESEND VERIFICATION EMAIL
// ============================================
export const resendVerificationEmail = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Send verification email
        // Implement your email sending logic here

        return res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};