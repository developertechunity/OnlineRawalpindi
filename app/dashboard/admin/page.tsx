'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './admin.module.css';

// ============================================
// TYPES
// ============================================
interface Vendor {
    id: string;
    shopName: string;
    ownerName: string;
    email: string;
    phone: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
    cnicFront: string | null;
    cnicBack: string | null;
    shopAddress: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    totalProducts: number;
    totalEarnings: number;
}

interface DashboardStats {
    totalVendors: number;
    totalCustomers: number;
    totalRiders: number;
    pendingVendors: number;
    approvedVendors: number;
    newVendorsThisWeek: number;
    newVendorsThisMonth: number;
}

// ============================================
// API BASE URL
// ============================================
const API_BASE = 'http://localhost:5002/api';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalVendors: 0,
        totalCustomers: 0,
        totalRiders: 0,
        pendingVendors: 0,
        approvedVendors: 0,
        newVendorsThisWeek: 0,
        newVendorsThisMonth: 0
    });
    const [activeTab, setActiveTab] = useState('vendors');
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    const showToast = (text: string, type: 'success' | 'error') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 5000);
    };

    // ============================================
    // FETCH VENDORS - ✅ FIXED API ENDPOINT
    // ============================================
    const fetchVendors = useCallback(async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            // ✅ FIXED: Use /api/admin/vendors instead of /api/auth/vendors
            const response = await axios.get(`${API_BASE}/admin/vendors`, config);

            if (response.data.success) {
                const vendorsList = response.data.vendors || [];
                setVendors(vendorsList);

                // Calculate stats
                const total = vendorsList.length;
                const pending = vendorsList.filter((v: Vendor) => v.status === 'pending').length;
                const approved = vendorsList.filter((v: Vendor) => v.status === 'approved').length;

                setStats(prev => ({
                    ...prev,
                    totalVendors: total,
                    pendingVendors: pending,
                    approvedVendors: approved
                }));
            }
        } catch (error: any) {
            console.error('❌ Error fetching vendors:', error);
            setError(error.response?.data?.message || 'Failed to fetch vendors');
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/auth/login');
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    // ============================================
    // UPDATE VENDOR STATUS
    // ============================================
    const updateVendorStatus = async (vendorId: string, status: 'approved' | 'rejected') => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            // ✅ FIXED: Use /api/admin/vendors/:id/status
            const response = await axios.put(
                `${API_BASE}/admin/vendors/${vendorId}/status`,
                { status },
                config
            );

            if (response.data.success) {
                showToast(`✅ Vendor ${status} successfully!`, 'success');
                // Refresh vendors list
                await fetchVendors();
            }
        } catch (error: any) {
            console.error('❌ Error updating vendor status:', error);
            showToast(error.response?.data?.message || 'Failed to update vendor status', 'error');
        }
    };

    // ============================================
    // FETCH SUBSCRIPTION REQUESTS
    // ============================================
    const fetchSubscriptionRequests = useCallback(async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            // ✅ Use /api/admin/subscription-requests
            const response = await axios.get(`${API_BASE}/admin/subscription-requests`, config);
            console.log('📋 Subscription requests:', response.data);
        } catch (error: any) {
            console.error('❌ Error fetching subscription requests:', error);
        }
    }, [router]);

    // ============================================
    // APPROVE SUBSCRIPTION REQUEST
    // ============================================
    const approveSubscriptionRequest = async (vendorId: string, action: 'approve' | 'reject', extensionDays?: number) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            // ✅ Use /api/admin/subscription-requests/:vendorId/approve
            const response = await axios.post(
                `${API_BASE}/admin/subscription-requests/${vendorId}/approve`,
                { action, extensionDays },
                config
            );

            if (response.data.success) {
                showToast(response.data.message, 'success');
                await fetchSubscriptionRequests();
            }
        } catch (error: any) {
            console.error('❌ Error approving subscription:', error);
            showToast(error.response?.data?.message || 'Failed to process request', 'error');
        }
    };

    // ============================================
    // INITIAL LOAD
    // ============================================
    useEffect(() => {
        fetchVendors();
        fetchSubscriptionRequests();
    }, [fetchVendors, fetchSubscriptionRequests]);

    // ============================================
    // RENDER FUNCTIONS
    // ============================================

    // Render Vendors Table
    const renderVendorsTable = () => {
        if (loading) {
            return <div className={styles.loading}>Loading vendors...</div>;
        }

        if (error) {
            return <div className={styles.error}>❌ {error}</div>;
        }

        if (vendors.length === 0) {
            return <div className={styles.empty}>No vendors registered yet.</div>;
        }

        return (
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Shop Name</th>
                            <th>Owner</th>
                            <th>Email</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Plan</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendors.map((vendor) => (
                            <tr key={vendor.id}>
                                <td>{vendor.shopName}</td>
                                <td>{vendor.ownerName}</td>
                                <td>{vendor.email}</td>
                                <td>{vendor.date}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${
                                        vendor.status === 'approved' ? styles.statusApproved :
                                        vendor.status === 'pending' ? styles.statusPending :
                                        styles.statusRejected
                                    }`}>
                                        {vendor.status}
                                    </span>
                                </td>
                                <td>
                                    <span className={styles.planBadge}>
                                        {vendor.subscriptionPlan || 'free'}
                                    </span>
                                </td>
                                <td>
                                    {vendor.status === 'pending' && (
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.approveBtn}
                                                onClick={() => updateVendorStatus(vendor.id, 'approved')}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className={styles.rejectBtn}
                                                onClick={() => updateVendorStatus(vendor.id, 'rejected')}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {vendor.status === 'approved' && (
                                        <span className={styles.approvedText}>✅ Approved</span>
                                    )}
                                    {vendor.status === 'rejected' && (
                                        <span className={styles.rejectedText}>❌ Rejected</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Render Stats Cards
    const renderStats = () => (
        <div className={styles.statsGrid}>
            <div className={styles.statCard}>
                <h3>Total Vendors</h3>
                <p className={styles.statValue}>{stats.totalVendors}</p>
                <span className={styles.statSub}>+{stats.newVendorsThisMonth} this month</span>
            </div>
            <div className={styles.statCard}>
                <h3>Approved</h3>
                <p className={styles.statValue}>{stats.approvedVendors}</p>
                <span className={styles.statSub}>✅ Active vendors</span>
            </div>
            <div className={styles.statCard}>
                <h3>Pending</h3>
                <p className={styles.statValue}>{stats.pendingVendors}</p>
                <span className={styles.statSub}>⏳ Awaiting approval</span>
            </div>
            <div className={styles.statCard}>
                <h3>Total Customers</h3>
                <p className={styles.statValue}>{stats.totalCustomers}</p>
                <span className={styles.statSub}>👥 Registered users</span>
            </div>
        </div>
    );

    // ============================================
    // TOAST RENDER
    // ============================================
    const renderToast = () => {
        if (!toastMessage) return null;
        return (
            <div className={`${styles.toast} ${toastMessage.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                {toastMessage.text}
            </div>
        );
    };

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <h2 className={styles.logo}>🛒 Admin</h2>
                <ul className={styles.menu}>
                    <li className={activeTab === 'dashboard' ? styles.menuItemActive : styles.menuItem}>
                        Dashboard
                    </li>
                    <li className={activeTab === 'vendors' ? styles.menuItemActive : styles.menuItem}>
                        Vendors
                    </li>
                    <li className={activeTab === 'customers' ? styles.menuItemActive : styles.menuItem}>
                        Customers
                    </li>
                    <li className={activeTab === 'riders' ? styles.menuItemActive : styles.menuItem}>
                        Riders
                    </li>
                    <li className={activeTab === 'announcements' ? styles.menuItemActive : styles.menuItem}>
                        Announcements
                    </li>
                    <li className={styles.menuItemLogout} onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        router.push('/auth/login');
                    }}>
                        Logout
                    </li>
                </ul>
            </div>

            <div className={styles.main}>
                <div className={styles.header}>
                    <h1>Admin Dashboard</h1>
                    <p>Welcome back, Admin!</p>
                </div>

                {activeTab === 'dashboard' && (
                    <>
                        {renderStats()}
                        <div className={styles.recentSection}>
                            <h2>Recent Vendors</h2>
                            {renderVendorsTable()}
                        </div>
                    </>
                )}

                {activeTab === 'vendors' && (
                    <>
                        <div className={styles.sectionHeader}>
                            <h2>Vendor Management</h2>
                            <div className={styles.statsSummary}>
                                <span>Total: {vendors.length}</span>
                                <span className={styles.pending}>Pending: {stats.pendingVendors}</span>
                                <span className={styles.approved}>Approved: {stats.approvedVendors}</span>
                            </div>
                        </div>
                        {renderVendorsTable()}
                    </>
                )}

                {activeTab === 'announcements' && (
                    <div className={styles.section}>
                        <h2>Announcements</h2>
                        <button className={styles.primaryBtn}>+ Send Announcement</button>
                        <div className={styles.announcementList}>
                            <p className={styles.empty}>No announcements yet.</p>
                        </div>
                    </div>
                )}

                {renderToast()}
            </div>
        </div>
    );
}