'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import styles from './login.module.css';

interface ErrorResponse {
    message: string;
}

// ✅ FIXED: Correct API_BASE
const API_BASE = 'http://localhost:5002/api';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || '');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [mode, setMode] = useState<'login' | 'forgot' | 'verify_otp'>('login');

    const roles = [
        { id: 'admin', label: '🛒 Admin' },
        { id: 'vendor', label: '🏪 Vendor' },
        { id: 'customer', label: '🛍️ Customer' },
        { id: 'rider', label: '🛵 Rider' }
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (mode === 'forgot') {
                const response = await axios.post(
                    `${API_BASE}/auth/forgot-password`,
                    { email }
                );
                setMessage(`✅ ${response.data.message || 'OTP code sent to your email!'}`);
                setMode('verify_otp');
            } 
            else if (mode === 'verify_otp') {
                const response = await axios.post(
                    `${API_BASE}/auth/reset-password`,
                    { email, otp, newPassword }
                );
                setMessage(`✅ ${response.data.message || 'Password reset successfully!'}`);
                setTimeout(() => {
                    setMode('login');
                    setMessage('');
                }, 2000);
            } 
            else {
                const response = await axios.post(
                    `${API_BASE}/auth/login`,
                    { email, password }
                );
                const user = response.data.user;
                if (user.role !== selectedRole) {
                    setMessage(`❌ You are registered as ${user.role}. Please select the correct role.`);
                    setLoading(false);
                    return;
                }
                
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(user));
                }
                
                setMessage('✅ Login successful! Redirecting...');
                setTimeout(() => router.push(`/dashboard/${user.role}`), 1500);
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<ErrorResponse>;
            const detailedError = axiosError.response?.data?.message || axiosError.message || 'Request failed';
            setMessage(`❌ Error: ${detailedError}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <Link href="/" className={styles.backLink}>← Back</Link>
                
                <h2 className={styles.title}>
                    {mode === 'login' && 'Login'}
                    {mode === 'forgot' && 'Reset Password'}
                    {mode === 'verify_otp' && 'Verify OTP'}
                </h2>

                {mode === 'login' && (
                    <p className={styles.subtitle}>Login as <strong>{selectedRole || 'User'}</strong></p>
                )}

                {message && (
                    <div className={message.includes('❌') ? styles.messageError : styles.messageSuccess}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {mode === 'login' && (
                        <>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={styles.input}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={styles.input}
                            />

                            <div className={styles.forgotContainer}>
                                <button 
                                    type="button" 
                                    className={styles.forgotBtn}
                                    onClick={() => { setMode('forgot'); setMessage(''); }}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <label className={styles.roleLabel}>Login as:</label>
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
                        </>
                    )}

                    {mode === 'forgot' && (
                        <>
                            <input
                                type="email"
                                placeholder="Enter Registered Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={styles.input}
                            />
                        </>
                    )}

                    {mode === 'verify_otp' && (
                        <>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                                Sent OTP to <strong>{email}</strong>
                            </p>
                            <input
                                type="text"
                                placeholder="Enter 6-Digit OTP Code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                                className={styles.input}
                                style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                            />
                            <input
                                type="password"
                                placeholder="Enter New Secure Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className={styles.input}
                            />
                        </>
                    )}

                    <button type="submit" disabled={loading} className={styles.button}>
                        {loading ? '⏳ Processing...' : 
                         mode === 'login' ? '🚀 Login' : 
                         mode === 'forgot' ? '📩 Send OTP Code' : '🔒 Reset Password'}
                    </button>

                    {mode !== 'login' && (
                        <button 
                            type="button" 
                            className={styles.cancelBtn} 
                            onClick={() => { setMode('login'); setMessage(''); }}
                        >
                            Back to Login
                        </button>
                    )}
                </form>

                <p className={styles.footer}>
                    Don&apos;t have an account? <Link href="/auth/register" className={styles.link}>Register</Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className={styles.container}>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}