import { Request, Response } from 'express';
import User from './User.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// ============================================
// REGISTER (UPDATED WITH RIDER + NTN + BUSINESS LICENSE)
// ============================================
export const register = async (req: Request, res: Response) => {
    try {
        const { 
            name, email, password, phone, role, 
            shopName, shopAddress,
            ntnNumber, // ✅ New Field - Optional
            vehicleType, vehicleNumber, licenseNumber, zone 
        } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData: any = {
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'customer',
            isVerified: false,
            isActive: true,
            approvalStatus: 'approved'
        };

        // ============================================
        // VENDOR REGISTRATION (With NTN + Business License)
        // ============================================
        if (role === 'vendor') {
            if (!shopName || !shopAddress) {
                return res.status(400).json({
                    success: false,
                    message: 'Shop Name and Address required for vendors'
                });
            }

            userData.approvalStatus = 'pending';
            userData.shopName = shopName;
            userData.shopAddress = shopAddress;
            
            // ✅ NTN Number - Optional (only if provided)
            if (ntnNumber) {
                userData.ntnNumber = ntnNumber;
            }
            
            const files = req.files as any;
            if (files) {
                if (files.cnicFront) userData.cnicFront = files.cnicFront[0].path;
                if (files.cnicBack) userData.cnicBack = files.cnicBack[0].path;
                // ✅ Business License - Optional (only if uploaded)
                if (files.businessLicense) {
                    userData.businessLicense = files.businessLicense[0].path;
                }
            }
        }

        // ============================================
        // RIDER REGISTRATION
        // ============================================
        if (role === 'rider') {
            if (!vehicleType || !vehicleNumber || !licenseNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle Type, Vehicle Number, and License Number are required for riders'
                });
            }

            userData.approvalStatus = 'pending';
            userData.vehicleType = vehicleType;
            userData.vehicleNumber = vehicleNumber;
            userData.licenseNumber = licenseNumber;
            userData.zone = zone || 'Rawalpindi';
            
            const files = req.files as any;
            if (files) {
                if (files.cnicFront) userData.cnicFront = files.cnicFront[0].path;
                if (files.cnicBack) userData.cnicBack = files.cnicBack[0].path;
            }
        }

        const user = await User.create(userData);

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: role === 'vendor' || role === 'rider'
                ? 'Registration successful! Your account is pending admin approval.'
                : 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                approvalStatus: user.approvalStatus
            }
        });
    } catch (error: any) {
        console.error('Registration error:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// LOGIN
// ============================================
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Vendor approval check
        if (user.role === 'vendor' && user.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: user.approvalStatus === 'pending'
                    ? '⏳ Your account is pending admin approval.'
                    : '❌ Your account has been rejected.'
            });
        }

        // Rider approval check
        if (user.role === 'rider' && user.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: user.approvalStatus === 'pending'
                    ? '⏳ Your account is pending admin approval.'
                    : '❌ Your account has been rejected.'
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret123',
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
                approvalStatus: user.approvalStatus
            }
        });
    } catch (error: any) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// ============================================
// FORGOT PASSWORD
// ============================================
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '❌ User with this email does not exist.'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
                    <p style="font-size: 14px; color: #374151;">Yeh OTP code security wajah se valid hai.</p>
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
        console.error("Nodemailer Error Details:", error);
        return res.status(500).json({ 
            success: false, 
            message: '❌ Failed to send email. Server error: ' + error.message 
        });
    }
};

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "❌ All fields (Email, OTP, and New Password) are required." 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "❌ User not found." 
            });
        }

        if (otp.length !== 6) {
            return res.status(400).json({ 
                success: false, 
                message: "❌ Invalid OTP code. It must be exactly 6 digits." 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "✅ Password updated successfully! Moving you back to login screen."
        });

    } catch (error: any) {
        console.error('Reset password error:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Server error during password reset: " + error.message 
        });
    }
};