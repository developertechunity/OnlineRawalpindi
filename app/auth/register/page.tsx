'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import styles from './register.module.css';

interface Message {
    type: 'success' | 'error';
    text: string;
}

interface ErrorResponse {
    message: string;
}

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('customer');
    
    // ============================================
    // COMMON FIELDS
    // ============================================
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    
    // ============================================
    // VENDOR FIELDS
    // ============================================
    const [shopName, setShopName] = useState<string>('');
    const [shopAddress, setShopAddress] = useState<string>('');
    
    // ✅ New Optional Fields
    const [ntnNumber, setNtnNumber] = useState<string>('');
    const [businessLicense, setBusinessLicense] = useState<File | null>(null);
    const [businessLicensePreview, setBusinessLicensePreview] = useState<string>('');
    
    const [cnicFront, setCnicFront] = useState<File | null>(null);
    const [cnicBack, setCnicBack] = useState<File | null>(null);
    const [cnicFrontPreview, setCnicFrontPreview] = useState<string>('');
    const [cnicBackPreview, setCnicBackPreview] = useState<string>('');

    // ============================================
    // RIDER FIELDS
    // ============================================
    const [vehicleType, setVehicleType] = useState<string>('bike');
    const [vehicleNumber, setVehicleNumber] = useState<string>('');
    const [licenseNumber, setLicenseNumber] = useState<string>('');
    const [zone, setZone] = useState<string>('Rawalpindi');

    const roles = [
        { id: 'vendor', label: '🏪 Vendor' },
        { id: 'customer', label: '🛍️ Customer' },
        { id: 'rider', label: '🛵 Rider' }
    ];

    const vehicleTypes = ['bike', 'car', 'van', 'cycle'];
    const zones = ['Rawalpindi', 'Islamabad', 'Both'];

    // ============================================
    // FILE HANDLERS
    // ============================================
    const handleCnicFrontChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCnicFront(file);
            setCnicFrontPreview(URL.createObjectURL(file));
        }
    };

    const handleCnicBackChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCnicBack(file);
            setCnicBackPreview(URL.createObjectURL(file));
        }
    };

    // ✅ Business License Handler
    const handleBusinessLicenseChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBusinessLicense(file);
            setBusinessLicensePreview(URL.createObjectURL(file));
        }
    };

    const removeCnicFront = () => {
        setCnicFront(null);
        setCnicFrontPreview('');
    };

    const removeCnicBack = () => {
        setCnicBack(null);
        setCnicBackPreview('');
    };

    const removeBusinessLicense = () => {
        setBusinessLicense(null);
        setBusinessLicensePreview('');
    };

    // ============================================
    // SUBMIT HANDLER
    // ============================================
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('password', password);
            formData.append('role', selectedRole);

            // ============================================
            // VENDOR FIELDS (With Optional NTN + Business License)
            // ============================================
            if (selectedRole === 'vendor') {
                formData.append('shopName', shopName);
                formData.append('shopAddress', shopAddress);
                
                // ✅ Optional fields - only append if provided
                if (ntnNumber) formData.append('ntnNumber', ntnNumber);
                if (businessLicense) formData.append('businessLicense', businessLicense);
                
                if (cnicFront) formData.append('cnicFront', cnicFront);
                if (cnicBack) formData.append('cnicBack', cnicBack);
            }

            // ============================================
            // RIDER FIELDS
            // ============================================
            if (selectedRole === 'rider') {
                formData.append('vehicleType', vehicleType);
                formData.append('vehicleNumber', vehicleNumber);
                formData.append('licenseNumber', licenseNumber);
                formData.append('zone', zone);
                if (cnicFront) formData.append('cnicFront', cnicFront);
                if (cnicBack) formData.append('cnicBack', cnicBack);
            }

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (selectedRole === 'vendor' || selectedRole === 'rider') {
                setMessage({ 
                    type: 'success', 
                    text: '✅ Registration successful! Your account is pending admin approval. You will be notified once approved.' 
                });
            } else {
                setMessage({ 
                    type: 'success', 
                    text: '✅ Registration successful! Redirecting to login...' 
                });
            }
            
            setTimeout(() => router.push('/auth/login'), 3000);
        } catch (error: unknown) {
            const axiosError = error as AxiosError<ErrorResponse>;
            setMessage({ 
                type: 'error', 
                text: axiosError.response?.data?.message || '❌ Registration failed' 
            });
        } finally {
            setLoading(false);
        }
    };

    const isVendor = selectedRole === 'vendor';
    const isRider = selectedRole === 'rider';

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <Link href="/" className={styles.backLink}>← Back</Link>
                <h2 className={styles.title}>Create Account</h2>
                <p className={styles.subtitle}>Join DigitalRawalpindi</p>

                {message && (
                    <div className={message.type === 'error' ? styles.messageError : styles.messageSuccess}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* ============================================
                        ROLE SELECTION
                    ============================================ */}
                    <div className={styles.roleSection}>
                        <label className={styles.roleLabel}>I want to register as:</label>
                        <div className={styles.roleGroup}>
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`${styles.roleBtn} ${selectedRole === role.id ? styles.roleBtnActive : ''}`}
                                >
                                    {role.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.divider}></div>

                    {/* ============================================
                        COMMON FIELDS
                    ============================================ */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Full Name</label>
                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Phone Number</label>
                        <input
                            type="text"
                            placeholder="e.g., 03001234567"
                            value={phone}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Password</label>
                        <input
                            type="password"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    {/* ============================================
                        VENDOR FIELDS
                    ============================================ */}
                    {isVendor && (
                        <div className={styles.vendorSection}>
                            <h3 className={styles.sectionTitle}>🏪 Shop Information</h3>
                            
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Shop Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your shop name"
                                    value={shopName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setShopName(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Shop Address</label>
                                <textarea
                                    placeholder="Enter your shop address (Rawalpindi)"
                                    value={shopAddress}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setShopAddress(e.target.value)}
                                    required
                                    className={styles.textarea}
                                    rows={3}
                                />
                            </div>

                            {/* ============================================
                                OPTIONAL FIELDS (NTN + Business License)
                            ============================================ */}
                            <div className={styles.sectionTitle}>📋 Business Documents</div>
                            <p className={styles.uploadHint}>These fields are optional. You can skip them.</p>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>NTN Number <span style={{ color: '#6c757d', fontWeight: 400 }}>(Optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter NTN number (optional)"
                                    value={ntnNumber}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNtnNumber(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Business License <span style={{ color: '#6c757d', fontWeight: 400 }}>(Optional)</span></label>
                                <div className={styles.uploadBox}>
                                    <label className={styles.uploadLabel} style={{ padding: '15px 10px' }}>
                                        <span className={styles.uploadIcon}>📄</span>
                                        Upload Business License (Optional)
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleBusinessLicenseChange}
                                            className={styles.uploadInput}
                                        />
                                    </label>
                                    {businessLicensePreview && (
                                        <div className={styles.previewContainer}>
                                            <picture>
                                                <source srcSet={businessLicensePreview} />
                                                <img 
                                                    src={businessLicensePreview} 
                                                    alt="Business License" 
                                                    className={styles.previewImage} 
                                                />
                                            </picture>
                                            <button 
                                                type="button" 
                                                onClick={removeBusinessLicense}
                                                className={styles.removeBtn}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.sectionTitle}>📄 CNIC Upload</div>
                            <p className={styles.uploadHint}>Please upload clear images of your CNIC (Front & Back)</p>

                            <div className={styles.uploadGroup}>
                                <div className={styles.uploadBox}>
                                    <label className={styles.uploadLabel}>
                                        <span className={styles.uploadIcon}>📷</span>
                                        CNIC Front
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCnicFrontChange}
                                            required
                                            className={styles.uploadInput}
                                        />
                                    </label>
                                    {cnicFrontPreview && (
                                        <div className={styles.previewContainer}>
                                            <picture>
                                                <source srcSet={cnicFrontPreview} />
                                                <img 
                                                    src={cnicFrontPreview} 
                                                    alt="CNIC Front" 
                                                    className={styles.previewImage} 
                                                />
                                            </picture>
                                            <button 
                                                type="button" 
                                                onClick={removeCnicFront}
                                                className={styles.removeBtn}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.uploadBox}>
                                    <label className={styles.uploadLabel}>
                                        <span className={styles.uploadIcon}>📷</span>
                                        CNIC Back
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCnicBackChange}
                                            required
                                            className={styles.uploadInput}
                                        />
                                    </label>
                                    {cnicBackPreview && (
                                        <div className={styles.previewContainer}>
                                            <picture>
                                                <source srcSet={cnicBackPreview} />
                                                <img 
                                                    src={cnicBackPreview} 
                                                    alt="CNIC Back" 
                                                    className={styles.previewImage} 
                                                />
                                            </picture>
                                            <button 
                                                type="button" 
                                                onClick={removeCnicBack}
                                                className={styles.removeBtn}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================
                        RIDER FIELDS
                    ============================================ */}
                    {isRider && (
                        <div className={styles.vendorSection}>
                            <h3 className={styles.sectionTitle}>🛵 Rider Information</h3>
                            
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Vehicle Type</label>
                                <select
                                    value={vehicleType}
                                    onChange={(e) => setVehicleType(e.target.value)}
                                    className={styles.select}
                                    required
                                >
                                    {vehicleTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Vehicle Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g., RIV-1234"
                                    value={vehicleNumber}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setVehicleNumber(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>License Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter your driving license number"
                                    value={licenseNumber}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLicenseNumber(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Delivery Zone</label>
                                <select
                                    value={zone}
                                    onChange={(e) => setZone(e.target.value)}
                                    className={styles.select}
                                    required
                                >
                                    {zones.map((z) => (
                                        <option key={z} value={z}>{z}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.sectionTitle}>📄 CNIC Upload</div>
                            <p className={styles.uploadHint}>Please upload clear images of your CNIC (Front & Back)</p>

                            <div className={styles.uploadGroup}>
                                <div className={styles.uploadBox}>
                                    <label className={styles.uploadLabel}>
                                        <span className={styles.uploadIcon}>📷</span>
                                        CNIC Front
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCnicFrontChange}
                                            required
                                            className={styles.uploadInput}
                                        />
                                    </label>
                                    {cnicFrontPreview && (
                                        <div className={styles.previewContainer}>
                                            <picture>
                                                <source srcSet={cnicFrontPreview} />
                                                <img 
                                                    src={cnicFrontPreview} 
                                                    alt="CNIC Front" 
                                                    className={styles.previewImage} 
                                                />
                                            </picture>
                                            <button 
                                                type="button" 
                                                onClick={removeCnicFront}
                                                className={styles.removeBtn}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.uploadBox}>
                                    <label className={styles.uploadLabel}>
                                        <span className={styles.uploadIcon}>📷</span>
                                        CNIC Back
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCnicBackChange}
                                            required
                                            className={styles.uploadInput}
                                        />
                                    </label>
                                    {cnicBackPreview && (
                                        <div className={styles.previewContainer}>
                                            <picture>
                                                <source srcSet={cnicBackPreview} />
                                                <img 
                                                    src={cnicBackPreview} 
                                                    alt="CNIC Back" 
                                                    className={styles.previewImage} 
                                                />
                                            </picture>
                                            <button 
                                                type="button" 
                                                onClick={removeCnicBack}
                                                className={styles.removeBtn}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className={styles.button}>
                        {loading ? '⏳ Creating account...' : '🚀 Create Account'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Already have an account? <Link href="/auth/login" className={styles.link}>Login</Link>
                </p>
            </div>
        </div>
    );
}