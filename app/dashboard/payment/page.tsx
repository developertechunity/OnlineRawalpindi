// app/payment/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paymentService } from '@/lib/payment.service';
import styles from './payment.module.css';

export default function PaymentGatewayPage() {
    const router = useRouter();
    
    // ===== USER STATE =====
    const [user, setUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<string>('');
    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    // ===== PAYMENT STATE =====
    const [paymentMethod, setPaymentMethod] = useState<string>('cod');
    const [amount, setAmount] = useState<number>(0);
    const [orderId, setOrderId] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [transactionId, setTransactionId] = useState<string>('');
    const [paymentStatus, setPaymentStatus] = useState<string>('');

    // ===== SUBSCRIPTION STATE =====
    const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly' | 'yearly'>('monthly');

    // ===== PAYMENT HISTORY =====
    const [payments, setPayments] = useState<any[]>([]);
    const [paymentStats, setPaymentStats] = useState<any>({});
    const [selectedPayment, setSelectedPayment] = useState<any>(null);

    // ===== VIEW MODES =====
    const [viewMode, setViewMode] = useState<'create' | 'history' | 'details' | 'stats' | 'cod'>('create');

    // ============================================
    // INITIAL LOAD
    // ============================================
    useEffect(() => {
        const t = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!t) {
            router.push('/auth/login');
            return;
        }

        setToken(t);
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                setUser(parsed);
                setUserRole(parsed.role || 'customer');
            } catch (e) {}
        }

        // Get order details from URL
        const params = new URLSearchParams(window.location.search);
        const order = params.get('orderId');
        const amt = params.get('amount');
        if (order) setOrderId(order);
        if (amt) setAmount(Number(amt));

        // Load payment history
        fetchPaymentHistory(t);

        // If admin, load stats
        if (userRole === 'admin') {
            fetchPaymentStats(t);
        }

        setLoading(false);
    }, [router, userRole]);

    // ============================================
    // FETCH PAYMENT HISTORY
    // ============================================
    const fetchPaymentHistory = async (t?: string) => {
        const tokenToUse = t || token;
        if (!tokenToUse) return;

        try {
            const result = await paymentService.getPaymentHistory(tokenToUse);
            if (result.success) {
                setPayments(result.data?.payments || []);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    // ============================================
    // FETCH PAYMENT STATISTICS (Admin Only)
    // ============================================
    const fetchPaymentStats = async (t?: string) => {
        const tokenToUse = t || token;
        if (!tokenToUse || userRole !== 'admin') return;

        try {
            const result = await paymentService.getPaymentStatistics(tokenToUse);
            if (result.success) {
                setPaymentStats(result.data || {});
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // ============================================
    // CREATE PAYMENT - Customer
    // ============================================
    const handleCreatePayment = async () => {
        if (!orderId) {
            alert('Please enter Order ID');
            return;
        }

        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if ((paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && !phoneNumber) {
            alert('Please enter your phone number');
            return;
        }

        setLoading(true);

        try {
            const result = await paymentService.createPayment({
                orderId,
                amount,
                method: paymentMethod as 'easypaisa' | 'jazzcash' | 'cod',
                customerPhone: phoneNumber || undefined
            }, token);

            if (result.success) {
                const data = result.data;
                setTransactionId(data?.transactionId || '');
                setPaymentStatus('success');
                
                // For COD, show success
                if (paymentMethod === 'cod') {
                    alert('✅ Order placed successfully! Pay on delivery.');
                } else {
                    alert(`✅ Payment initiated! Transaction ID: ${data?.transactionId}`);
                }

                // Refresh history
                await fetchPaymentHistory();
            } else {
                alert(result.message || 'Payment failed');
                setPaymentStatus('failed');
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            alert(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CONFIRM COD - Rider
    // ============================================
    const handleConfirmCOD = async () => {
        if (!orderId || !amount) {
            alert('Please enter Order ID and Amount');
            return;
        }

        if (!confirm(`Confirm COD collection of PKR ${amount}?`)) return;

        setLoading(true);

        try {
            const result = await paymentService.confirmCOD(orderId, amount, token);
            if (result.success) {
                alert('✅ COD confirmed successfully!');
                setPaymentStatus('success');
                await fetchPaymentHistory();
            } else {
                alert(result.message || 'Failed to confirm COD');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // DEPOSIT COD TO ADMIN - Rider
    // ============================================
    const handleDepositCOD = async () => {
        if (!orderId) {
            alert('Please enter Order ID');
            return;
        }

        if (!confirm('Deposit COD to admin?')) return;

        setLoading(true);

        try {
            const result = await paymentService.depositCOD(orderId, token);
            if (result.success) {
                alert('✅ COD deposited to admin successfully!');
                await fetchPaymentHistory();
            } else {
                alert(result.message || 'Failed to deposit COD');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // VENDOR SUBSCRIPTION
    // ============================================
    const handleSubscription = async () => {
        if (!confirm(`Subscribe to ${subscriptionPlan} plan for ${subscriptionPlan === 'yearly' ? 'PKR 10,000' : 'PKR 1,000'}?`)) return;

        setLoading(true);

        try {
            const result = await paymentService.subscribe(subscriptionPlan, token);
            if (result.success) {
                alert('✅ Subscription successful!');
                await fetchPaymentHistory();
            } else {
                alert(result.message || 'Subscription failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // PROCESS REFUND - Admin
    // ============================================
    const handleRefund = async (paymentId: string) => {
        const reason = prompt('Enter refund reason:');
        if (!reason) return;

        const amountInput = prompt('Enter refund amount (leave empty for full refund):');

        setLoading(true);

        try {
            const result = await paymentService.processRefund(
                paymentId,
                reason,
                token,
                amountInput ? Number(amountInput) : undefined
            );
            if (result.success) {
                alert('✅ Refund processed successfully!');
                await fetchPaymentHistory();
            } else {
                alert(result.message || 'Failed to process refund');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // RENDER METHODS
    // ============================================

    // 1. Create Payment Form (Customer)
    const renderCreatePayment = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>💳 Create Payment</h2>
            
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Order ID *</label>
                <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Enter Order ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Amount (PKR) *</label>
                <input
                    type="number"
                    className={styles.formInput}
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Payment Method *</label>
                <div className={styles.methodGrid}>
                    <div 
                        className={`${styles.methodCard} ${paymentMethod === 'cod' ? styles.methodActive : ''}`}
                        onClick={() => setPaymentMethod('cod')}
                    >
                        <span className={styles.methodIcon}>💰</span>
                        <span className={styles.methodName}>COD</span>
                        <span className={styles.methodDesc}>Pay on Delivery</span>
                    </div>
                    <div 
                        className={`${styles.methodCard} ${paymentMethod === 'easypaisa' ? styles.methodActive : ''}`}
                        onClick={() => setPaymentMethod('easypaisa')}
                    >
                        <span className={styles.methodIcon}>📱</span>
                        <span className={styles.methodName}>EasyPaisa</span>
                        <span className={styles.methodDesc}>Mobile Wallet</span>
                    </div>
                    <div 
                        className={`${styles.methodCard} ${paymentMethod === 'jazzcash' ? styles.methodActive : ''}`}
                        onClick={() => setPaymentMethod('jazzcash')}
                    >
                        <span className={styles.methodIcon}>📱</span>
                        <span className={styles.methodName}>JazzCash</span>
                        <span className={styles.methodDesc}>Mobile Wallet</span>
                    </div>
                </div>
            </div>

            {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number *</label>
                    <input
                        type="tel"
                        className={styles.formInput}
                        placeholder="03XX-XXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
            )}

            <button 
                className={styles.primaryBtn}
                onClick={handleCreatePayment}
                disabled={loading}
            >
                {loading ? '⏳ Processing...' : '💰 Pay Now'}
            </button>
        </div>
    );

    // 2. COD Management (Rider)
    const renderCODManagement = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📦 COD Management</h2>
            
            <div className={styles.codGrid}>
                <div className={styles.codCard}>
                    <h3>Confirm COD</h3>
                    <div className={styles.formGroup}>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Order ID"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <input
                            type="number"
                            className={styles.formInput}
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                        />
                    </div>
                    <button className={styles.successBtn} onClick={handleConfirmCOD} disabled={loading}>
                        {loading ? '⏳...' : '✅ Confirm COD'}
                    </button>
                </div>

                <div className={styles.codCard}>
                    <h3>Deposit to Admin</h3>
                    <div className={styles.formGroup}>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Order ID"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                        />
                    </div>
                    <button className={styles.warningBtn} onClick={handleDepositCOD} disabled={loading}>
                        {loading ? '⏳...' : '💰 Deposit COD'}
                    </button>
                </div>
            </div>
        </div>
    );

    // 3. Vendor Subscription
    const renderSubscription = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📋 Subscription Plans</h2>
            
            <div className={styles.subscriptionGrid}>
                <div className={`${styles.planCard} ${subscriptionPlan === 'monthly' ? styles.planActive : ''}`}>
                    <h3 className={styles.planName}>Monthly</h3>
                    <p className={styles.planPrice}>PKR 1,000 <span>/month</span></p>
                    <ul className={styles.planFeatures}>
                        <li>✓ Unlimited Products</li>
                        <li>✓ Priority Support</li>
                        <li>✓ Advanced Analytics</li>
                    </ul>
                    <button 
                        className={styles.primaryBtn}
                        onClick={() => {
                            setSubscriptionPlan('monthly');
                            handleSubscription();
                        }}
                        disabled={loading}
                    >
                        {loading ? '⏳...' : 'Subscribe'}
                    </button>
                </div>

                <div className={`${styles.planCard} ${subscriptionPlan === 'yearly' ? styles.planActive : ''}`}>
                    <h3 className={styles.planName}>Yearly</h3>
                    <p className={styles.planPrice}>PKR 10,000 <span>/year</span></p>
                    <ul className={styles.planFeatures}>
                        <li>✓ Everything in Monthly</li>
                        <li>✓ 2 Months Free</li>
                        <li>✓ VIP Support</li>
                    </ul>
                    <button 
                        className={styles.primaryBtn}
                        onClick={() => {
                            setSubscriptionPlan('yearly');
                            handleSubscription();
                        }}
                        disabled={loading}
                    >
                        {loading ? '⏳...' : 'Subscribe'}
                    </button>
                </div>
            </div>
        </div>
    );

    // 4. Payment History (All Roles)
    const renderPaymentHistory = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 Payment History</h2>
            
            {payments.length === 0 ? (
                <p className={styles.emptyState}>No payments found</p>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Date</th>
                                {userRole === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p: any) => (
                                <tr key={p._id}>
                                    <td>#{p.orderNumber}</td>
                                    <td>PKR {p.amount}</td>
                                    <td>{p.method}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${
                                            p.status === 'success' ? styles.statusSuccess :
                                            p.status === 'pending' ? styles.statusPending :
                                            p.status === 'failed' ? styles.statusFailed :
                                            styles.statusRefunded
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                    {userRole === 'admin' && (
                                        <td>
                                            {p.status === 'success' && (
                                                <button 
                                                    className={styles.dangerBtn}
                                                    onClick={() => handleRefund(p._id)}
                                                    disabled={loading}
                                                >
                                                    Refund
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    // 5. Payment Statistics (Admin Only)
    const renderPaymentStats = () => {
        if (userRole !== 'admin') return null;

        const stats = paymentStats;
        
        return (
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📈 Payment Statistics</h2>
                
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h3>Total Payments</h3>
                        <p className={styles.statValue}>{stats.totalPayments || 0}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Today's Payments</h3>
                        <p className={styles.statValue}>{stats.todayPayments || 0}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Pending COD</h3>
                        <p className={styles.statValue}>{stats.pendingCOD || 0}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Total Revenue</h3>
                        <p className={styles.statValue}>PKR {(stats.totalRevenue || 0).toLocaleString()}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Total Commission</h3>
                        <p className={styles.statValue}>PKR {(stats.totalCommission || 0).toLocaleString()}</p>
                    </div>
                </div>

                {stats.paymentsByMethod && (
                    <div className={styles.methodStats}>
                        <h3>Payments by Method</h3>
                        <div className={styles.methodBars}>
                            {stats.paymentsByMethod.map((m: any) => (
                                <div key={m._id} className={styles.methodBar}>
                                    <span className={styles.methodLabel}>{m._id}</span>
                                    <div className={styles.barContainer}>
                                        <div 
                                            className={styles.barFill}
                                            style={{ 
                                                width: `${(m.count / (stats.totalPayments || 1)) * 100}%`,
                                                backgroundColor: m._id === 'cod' ? '#28a745' : 
                                                               m._id === 'easypaisa' ? '#4a6cf7' : '#ffc107'
                                            }}
                                        />
                                    </div>
                                    <span className={styles.methodCount}>{m.count} ({m.total.toLocaleString()} PKR)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // MAIN RENDER
    // ============================================
    if (loading && !payments.length) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>💳 Payment Gateway</h1>
                <p>Welcome, {user?.name || 'User'}!</p>
                <span className={styles.roleBadge}>{userRole}</span>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${viewMode === 'create' ? styles.tabActive : ''}`}
                    onClick={() => setViewMode('create')}
                >
                    💳 Create Payment
                </button>
                
                {userRole === 'rider' && (
                    <button 
                        className={`${styles.tab} ${viewMode === 'cod' ? styles.tabActive : ''}`}
                        onClick={() => setViewMode('cod')}
                    >
                        📦 COD Management
                    </button>
                )}
                
                {userRole === 'vendor' && (
                    <button 
                        className={`${styles.tab} ${viewMode === 'create' ? styles.tabActive : ''}`}
                        onClick={() => setViewMode('create')}
                    >
                        📋 Subscription
                    </button>
                )}
                
                <button 
                    className={`${styles.tab} ${viewMode === 'history' ? styles.tabActive : ''}`}
                    onClick={() => setViewMode('history')}
                >
                    📊 History
                </button>
                
                {userRole === 'admin' && (
                    <button 
                        className={`${styles.tab} ${viewMode === 'stats' ? styles.tabActive : ''}`}
                        onClick={() => setViewMode('stats')}
                    >
                        📈 Statistics
                    </button>
                )}
            </div>

            {/* Content based on view mode and role */}
            <div className={styles.content}>
                {viewMode === 'create' && userRole === 'customer' && renderCreatePayment()}
                {viewMode === 'create' && userRole === 'vendor' && renderSubscription()}
                {viewMode === 'cod' && userRole === 'rider' && renderCODManagement()}
                {viewMode === 'history' && renderPaymentHistory()}
                {viewMode === 'stats' && userRole === 'admin' && renderPaymentStats()}
                
                {/* If no matching view, show default based on role */}
                {viewMode === 'create' && userRole !== 'customer' && userRole !== 'vendor' && (
                    <div className={styles.section}>
                        <p className={styles.emptyState}>You don't have permission to create payments.</p>
                    </div>
                )}
            </div>
        </div>
    );
}