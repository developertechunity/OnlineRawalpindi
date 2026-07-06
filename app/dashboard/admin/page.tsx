'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './admin.module.css';

// ============================================
// INTERFACES
// ============================================
interface Vendor {
    id: string;
    shopName: string;
    ownerName: string;
    email: string;
    phone: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
    cnicFront?: string;
    cnicBack?: string;
    shopAddress?: string;
    ntnNumber?: string;
    businessLicense?: string;
}

interface WithdrawalRequest {
    id: string;
    vendorId: string;
    vendorName: string;
    shopName: string;
    amount: number;
    method: string;
    accountDetails: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    requestedAt: string;
}

interface SubscriptionRequest {
    id: string;
    vendorId: string;
    vendorName: string;
    shopName: string;
    planType: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
}

interface AdminEmployee {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Coupon {
    id: string;
    code: string;
    discount: string;
    type: 'percentage' | 'fixed';
    expiry: string;
    usage: number;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    audience: 'all' | 'vendors' | 'customers' | 'riders';
}

interface CommissionType {
    id: string;
    name: string;
    value: string;
    type: 'percentage' | 'fixed';
    description: string;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [showVendorDetail, setShowVendorDetail] = useState(false);

    // ============================================
    // STATES
    // ============================================
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [adminEmployees, setAdminEmployees] = useState<AdminEmployee[]>([]);
    const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
    const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);

    // ============================================
    // MODALS
    // ============================================
    const [showAddCoupon, setShowAddCoupon] = useState(false);
    const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showAddCommission, setShowAddCommission] = useState(false);

    // ============================================
    // FORMS
    // ============================================
    const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', role: 'Vendor Manager' });
    const [couponForm, setCouponForm] = useState({ code: '', type: 'percentage' as const, discount: '', expiry: '' });
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', audience: 'all' as const });
    const [commissionForm, setCommissionForm] = useState({ name: '', type: 'percentage' as const, value: '', description: '' });

    const API_URL = 'http://localhost:5002';

    // ============================================
    // ✅ IMAGE URL HELPERS - FIXED (SIRF YAHI CHANGE)
    // ============================================
    
const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http")) {
        return imagePath;
    }

    const cleanPath = imagePath
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(/^uploads\/+/, "");

    return `${API_URL}/uploads/${cleanPath}`;
};
    // ============================================
    // FETCH WITHDRAWALS
    // ============================================
    const fetchWithdrawals = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${API_URL}/api/auth/withdrawals`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setWithdrawalRequests(response.data.withdrawals || []);
            }
        } catch (error: any) {
            console.error('❌ Withdrawals error:', error.message);
        }
    }, [API_URL]);

    // ============================================
    // FETCH SUBSCRIPTIONS
    // ============================================
    const fetchSubscriptions = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${API_URL}/api/auth/subscriptions`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSubscriptionRequests(response.data.requests || []);
            }
        } catch (error: any) {
            console.error('❌ Subscriptions error:', error.message);
        }
    }, [API_URL]);

    // ============================================
    // LOAD ALL DATA
    // ============================================
    const loadAllDashboardData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/auth/login');
                setLoading(false);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            const [vendorsRes, ridersRes, customersRes, employeesRes, commissionsRes, couponsRes, announcementsRes] = await Promise.all([
                axios.get(`${API_URL}/api/auth/vendors`, { headers }),
                axios.get(`${API_URL}/api/auth/riders`, { headers }),
                axios.get(`${API_URL}/api/auth/customers`, { headers }),
                axios.get(`${API_URL}/api/auth/employees`, { headers }),
                axios.get(`${API_URL}/api/auth/commissions`, { headers }),
                axios.get(`${API_URL}/api/auth/coupons`, { headers }),
                axios.get(`${API_URL}/api/auth/announcements`, { headers })
            ]);

            if (vendorsRes.data?.success) setVendors(vendorsRes.data.vendors || []);
            if (ridersRes.data?.success) setRiders(ridersRes.data.riders || []);
            if (customersRes.data?.success) setCustomers(customersRes.data.customers || []);
            if (employeesRes.data?.success) setAdminEmployees(employeesRes.data.employees || []);
            if (commissionsRes.data?.success) setCommissionTypes(commissionsRes.data.commissions || []);
            if (couponsRes.data?.success) setCoupons(couponsRes.data.coupons || []);
            if (announcementsRes.data?.success) setAnnouncements(announcementsRes.data.announcements || []);

            await fetchWithdrawals();
            await fetchSubscriptions();

        } catch (error: any) {
            console.error("Error loading dashboard data:", error.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL, router, fetchWithdrawals, fetchSubscriptions]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            setLoading(false);
            return;
        }
        loadAllDashboardData();
    }, [router, loadAllDashboardData]);

    // ============================================
    // VENDOR APPROVAL
    // ============================================
    const updateVendorStatus = useCallback(async (vendorId: string, status: 'approved' | 'rejected') => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/auth/vendor/${vendorId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert(`✅ Vendor ${status} successfully!`);
                setShowVendorDetail(false);
                loadAllDashboardData();
            }
        } catch (error: any) {
            alert(`❌ Error updating vendor status: ${error.response?.data?.message || error.message}`);
        }
    }, [API_URL, loadAllDashboardData]);

    // ============================================
    // WITHDRAWAL STATUS UPDATE
    // ============================================
    const handleWithdrawalStatus = useCallback(async (requestId: string, status: 'approved' | 'rejected' | 'processed') => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/auth/withdrawal/${requestId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert(`✅ Withdrawal ${status} successfully!`);
                fetchWithdrawals();
            }
        } catch (error: any) {
            alert(`❌ Error updating withdrawal: ${error.response?.data?.message || error.message}`);
        }
    }, [API_URL, fetchWithdrawals]);

    // ============================================
    // SUBSCRIPTION STATUS UPDATE
    // ============================================
    const handleSubscriptionStatus = useCallback(async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/auth/subscription/${requestId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert(`✅ Subscription ${status} successfully!`);
                fetchSubscriptions();
            }
        } catch (error: any) {
            alert(`❌ Error updating subscription: ${error.response?.data?.message || error.message}`);
        }
    }, [API_URL, fetchSubscriptions]);

    // ============================================
    // EMPLOYEE CRUD
    // ============================================
    const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/employee`,
                employeeForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert('✅ Employee added successfully!');
                setShowAddEmployee(false);
                setEmployeeForm({ name: '', email: '', role: 'Vendor Manager' });
                loadAllDashboardData();
            }
        } catch (error) {
            alert('❌ Failed to add employee');
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!confirm('Are you sure you want to remove this employee?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/auth/employee/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Employee removed successfully!');
            loadAllDashboardData();
        } catch (error) {
            alert('❌ Failed to remove employee');
        }
    };

    // ============================================
    // COUPON CRUD
    // ============================================
    const handleAddCouponSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/coupon`,
                couponForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert('✅ Coupon created successfully!');
                setShowAddCoupon(false);
                setCouponForm({ code: '', type: 'percentage', discount: '', expiry: '' });
                loadAllDashboardData();
            }
        } catch (error) {
            alert('❌ Failed to create coupon');
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/auth/coupon/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Coupon deleted successfully!');
            loadAllDashboardData();
        } catch (error) {
            alert('❌ Failed to delete coupon');
        }
    };

    // ============================================
    // COMMISSION CRUD
    // ============================================
    const handleAddCommissionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/commission`,
                commissionForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert('✅ Commission type added successfully!');
                setShowAddCommission(false);
                setCommissionForm({ name: '', type: 'percentage', value: '', description: '' });
                loadAllDashboardData();
            }
        } catch (error) {
            alert('❌ Failed to add commission type');
        }
    };

    const handleDeleteCommission = async (id: string) => {
        if (!confirm('Are you sure you want to delete this commission type?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/auth/commission/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Commission type deleted successfully!');
            loadAllDashboardData();
        } catch (error) {
            alert('❌ Failed to delete commission type');
        }
    };

    // ============================================
    // ANNOUNCEMENT CRUD
    // ============================================
    const handleAddAnnouncementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/announcement`,
                announcementForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert('✅ Announcement sent successfully!');
                setShowAddAnnouncement(false);
                setAnnouncementForm({ title: '', content: '', audience: 'all' });
                loadAllDashboardData();
            }
        } catch (error) {
            alert('❌ Failed to send announcement');
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/auth/announcement/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Announcement deleted successfully!');
            loadAllDashboardData();
        } catch (error) {
            alert('❌ Failed to delete announcement');
        }
    };

    // ============================================
    // VENDOR DETAIL MODAL
    // ============================================
    const renderVendorDetailModal = useCallback(() => {
        if (!showVendorDetail || !selectedVendor) return null;

        const isPending = selectedVendor.status === 'pending';

        const cnicFrontUrl = getImageUrl(selectedVendor.cnicFront);
        const cnicBackUrl = getImageUrl(selectedVendor.cnicBack);
        const businessLicenseUrl = getImageUrl(selectedVendor.businessLicense);

        return (
            <div className={styles.modalOverlay} onClick={() => setShowVendorDetail(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>📋 Vendor Details</h3>
                        <button className={styles.modalClose} onClick={() => setShowVendorDetail(false)}>×</button>
                    </div>

                    <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                            <label className={styles.detailLabel}>Shop Name</label>
                            <p className={styles.detailValue}>{selectedVendor.shopName}</p>
                        </div>
                        <div className={styles.detailItem}>
                            <label className={styles.detailLabel}>Owner Name</label>
                            <p className={styles.detailValue}>{selectedVendor.ownerName}</p>
                        </div>
                        <div className={styles.detailItem}>
                            <label className={styles.detailLabel}>Email</label>
                            <p className={styles.detailValue}>{selectedVendor.email}</p>
                        </div>
                        <div className={styles.detailItem}>
                            <label className={styles.detailLabel}>Phone</label>
                            <p className={styles.detailValue}>{selectedVendor.phone}</p>
                        </div>
                        <div className={styles.detailFull}>
                            <label className={styles.detailLabel}>Shop Address</label>
                            <p className={styles.detailValue}>{selectedVendor.shopAddress}</p>
                        </div>
                        {selectedVendor.ntnNumber && (
                            <div className={styles.detailItem}>
                                <label className={styles.detailLabel}>NTN Number</label>
                                <p className={styles.detailValue}>{selectedVendor.ntnNumber}</p>
                            </div>
                        )}
                        <div className={styles.detailItem}>
                            <label className={styles.detailLabel}>Status</label>
                            <p className={styles.detailValue}>
                                <span className={`${styles.statusBadge} ${
                                    selectedVendor.status === 'approved' ? styles.statusApproved :
                                    selectedVendor.status === 'rejected' ? styles.statusRejected :
                                    styles.statusPending
                                }`}>
                                    {selectedVendor.status.charAt(0).toUpperCase() + selectedVendor.status.slice(1)}
                                </span>
                            </p>
                        </div>
                        <div className={styles.detailItem}>
                            <label className={styles.detailLabel}>Registered On</label>
                            <p className={styles.detailValue}>{selectedVendor.date}</p>
                        </div>
                    </div>

                    <div className={styles.cnicSection}>
                        <h4 className={styles.cnicTitle}>📄 CNIC Documents</h4>
                        <div className={styles.cnicContainer}>
                            <div className={styles.cnicBox}>
                                <label className={styles.cnicLabel}>CNIC Front</label>
                                {cnicFrontUrl ? (
                                    <div className={styles.cnicImageWrapper}>
                                        <img 
                                            src={cnicFrontUrl}
                                            alt="CNIC Front"
                                            className={styles.cnicImage}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) {
                                                    const msg = document.createElement('span');
                                                    msg.textContent = '📷 No image available';
                                                    msg.style.color = '#6c757d';
                                                    msg.style.padding = '10px';
                                                    msg.style.display = 'block';
                                                    msg.style.textAlign = 'center';
                                                    parent.appendChild(msg);
                                                }
                                            }}
                                        />
                                        <a 
                                            href={cnicFrontUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.cnicViewBtn}
                                        >
                                            🔍 View Full Image
                                        </a>
                                    </div>
                                ) : (
                                    <div className={styles.cnicEmpty}>No CNIC Front uploaded</div>
                                )}
                            </div>
                            <div className={styles.cnicBox}>
                                <label className={styles.cnicLabel}>CNIC Back</label>
                                {cnicBackUrl ? (
                                    <div className={styles.cnicImageWrapper}>
                                        <img 
                                            src={cnicBackUrl}
                                            alt="CNIC Back"
                                            className={styles.cnicImage}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) {
                                                    const msg = document.createElement('span');
                                                    msg.textContent = '📷 No image available';
                                                    msg.style.color = '#6c757d';
                                                    msg.style.padding = '10px';
                                                    msg.style.display = 'block';
                                                    msg.style.textAlign = 'center';
                                                    parent.appendChild(msg);
                                                }
                                            }}
                                        />
                                        <a 
                                            href={cnicBackUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.cnicViewBtn}
                                        >
                                            🔍 View Full Image
                                        </a>
                                    </div>
                                ) : (
                                    <div className={styles.cnicEmpty}>No CNIC Back uploaded</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {businessLicenseUrl && (
                        <div className={styles.cnicSection}>
                            <h4 className={styles.cnicTitle}>📄 Business License</h4>
                            <div className={styles.cnicContainer}>
                                <div className={styles.cnicBox}>
                                    <label className={styles.cnicLabel}>Business License</label>
                                    <div className={styles.cnicImageWrapper}>
                                        <img 
                                            src={businessLicenseUrl}
                                            alt="Business License"
                                            className={styles.cnicImage}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) {
                                                    const msg = document.createElement('span');
                                                    msg.textContent = '📷 No image available';
                                                    msg.style.color = '#6c757d';
                                                    msg.style.padding = '10px';
                                                    msg.style.display = 'block';
                                                    msg.style.textAlign = 'center';
                                                    parent.appendChild(msg);
                                                }
                                            }}
                                        />
                                        <a 
                                            href={businessLicenseUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.cnicViewBtn}
                                        >
                                            🔍 View Full Image
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isPending && (
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.successBtn}
                                onClick={() => updateVendorStatus(selectedVendor.id, 'approved')}
                            >
                                ✅ Approve Vendor
                            </button>
                            <button 
                                className={styles.dangerBtn}
                                onClick={() => updateVendorStatus(selectedVendor.id, 'rejected')}
                            >
                                ❌ Reject Vendor
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }, [showVendorDetail, selectedVendor, updateVendorStatus, API_URL]);

    // ============================================
    // RENDER FUNCTIONS
    // ============================================
    const renderWithdrawalRequests = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>💳 Withdrawal Requests</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Vendor</th>
                            <th>Shop</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawalRequests.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                                    No withdrawal requests found.
                                </td>
                            </tr>
                        ) : (
                            withdrawalRequests.map((w) => (
                                <tr key={w.id}>
                                    <td>{w.vendorName}</td>
                                    <td>{w.shopName}</td>
                                    <td><strong>PKR {w.amount.toLocaleString()}</strong></td>
                                    <td>{w.method}</td>
                                    <td>{w.requestedAt}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${
                                            w.status === 'approved' ? styles.statusApproved :
                                            w.status === 'rejected' ? styles.statusRejected :
                                            w.status === 'processed' ? styles.statusApproved :
                                            styles.statusPending
                                        }`}>
                                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        {w.status === 'pending' && (
                                            <>
                                                <button 
                                                    className={styles.successBtn}
                                                    onClick={() => handleWithdrawalStatus(w.id, 'approved')}
                                                    style={{ marginRight: '5px' }}
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    className={styles.dangerBtn}
                                                    onClick={() => handleWithdrawalStatus(w.id, 'rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSubscriptionRequests = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📋 Subscription Upgrade Requests</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Vendor</th>
                            <th>Shop</th>
                            <th>Plan</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscriptionRequests.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                                    No subscription requests found.
                                </td>
                            </tr>
                        ) : (
                            subscriptionRequests.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.vendorName}</td>
                                    <td>{s.shopName}</td>
                                    <td>
                                        <span className={styles.statusBadge} style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
                                            {s.planType.charAt(0).toUpperCase() + s.planType.slice(1)}
                                        </span>
                                    </td>
                                    <td><strong>PKR {s.amount.toLocaleString()}</strong></td>
                                    <td>{s.requestedAt}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${
                                            s.status === 'approved' ? styles.statusApproved :
                                            s.status === 'rejected' ? styles.statusRejected :
                                            styles.statusPending
                                        }`}>
                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        {s.status === 'pending' && (
                                            <>
                                                <button 
                                                    className={styles.successBtn}
                                                    onClick={() => handleSubscriptionStatus(s.id, 'approved')}
                                                    style={{ marginRight: '5px' }}
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    className={styles.dangerBtn}
                                                    onClick={() => handleSubscriptionStatus(s.id, 'rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderVendors = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🏪 Vendor Management</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Shop Name</th>
                            <th>Owner</th>
                            <th>Email</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendors.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                                    No vendors registered yet.
                                </td>
                            </tr>
                        ) : (
                            vendors.map((vendor) => (
                                <tr key={vendor.id}>
                                    <td>{vendor.shopName}</td>
                                    <td>{vendor.ownerName}</td>
                                    <td>{vendor.email}</td>
                                    <td>{vendor.date}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${vendor.status === 'approved' ? styles.statusApproved :
                                                vendor.status === 'rejected' ? styles.statusRejected :
                                                styles.statusPending
                                            }`}>
                                            {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.primaryBtn}
                                            onClick={() => { setSelectedVendor(vendor); setShowVendorDetail(true); }}
                                        >
                                            👁️ View Details
                                        </button>
                                        {vendor.status === 'pending' && (
                                            <>
                                                <button
                                                    className={styles.successBtn}
                                                    onClick={() => updateVendorStatus(vendor.id, 'approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className={styles.dangerBtn}
                                                    onClick={() => updateVendorStatus(vendor.id, 'rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAdminEmployees = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>👥 Admin Employees</h2>
                <button className={styles.primaryBtn} onClick={() => setShowAddEmployee(true)}>
                    + Add Employee
                </button>
            </div>
            <div className={styles.employeeGrid}>
                {adminEmployees.map((emp) => (
                    <div key={emp.id} className={styles.employeeCard}>
                        <div className={styles.employeeIcon}>👤</div>
                        <div className={styles.employeeName}>{emp.name}</div>
                        <div className={styles.employeeRole}>{emp.role}</div>
                        <div className={styles.employeeEmail}>{emp.email}</div>
                        <button className={styles.dangerBtn} onClick={() => handleDeleteEmployee(emp.id)}>
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCommissionTypes = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>💰 Commission Rules</h2>
                <button className={styles.primaryBtn} onClick={() => setShowAddCommission(true)}>
                    + Add Rule
                </button>
            </div>
            <div className={styles.commissionGrid}>
                {commissionTypes.map((c) => (
                    <div key={c.id} className={styles.commissionCard}>
                        <div>
                            <div className={styles.commissionName}>{c.name}</div>
                            <div className={styles.commissionDesc}>{c.description}</div>
                        </div>
                        <div className={styles.commissionValue}>{c.value}</div>
                        <button className={styles.dangerBtn} onClick={() => handleDeleteCommission(c.id)}>
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCoupons = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>🎟️ Coupons</h2>
                <button className={styles.primaryBtn} onClick={() => setShowAddCoupon(true)}>
                    + Create Coupon
                </button>
            </div>
            <div className={styles.couponGrid}>
                {coupons.map((cp) => (
                    <div key={cp.id} className={styles.couponCard}>
                        <div className={styles.couponCode}>{cp.code}</div>
                        <div className={styles.couponDiscount}>{cp.discount} Off</div>
                        <div className={styles.couponExpiry}>Expires: {cp.expiry}</div>
                        <div className={styles.couponExpiry}>Used: {cp.usage} times</div>
                        <button className={styles.dangerBtn} onClick={() => handleDeleteCoupon(cp.id)}>
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAnnouncements = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>📢 Announcements</h2>
                <button className={styles.primaryBtn} onClick={() => setShowAddAnnouncement(true)}>
                    + Send Announcement
                </button>
            </div>
            {announcements.map((an) => (
                <div key={an.id} className={styles.announcementItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className={styles.announcementTitle}>{an.title}</span>
                        <span className={styles.statusBadge} style={{ backgroundColor: '#edf2f7' }}>To: {an.audience}</span>
                    </div>
                    <p className={styles.announcementContent}>{an.content}</p>
                    <div className={styles.announcementDate}>{an.date}</div>
                    <button className={styles.dangerBtn} onClick={() => handleDeleteAnnouncement(an.id)}>
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );

    const renderCustomers = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>👥 Customers</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((c) => (
                            <tr key={c.id}>
                                <td>{c.name}</td>
                                <td>{c.email}</td>
                                <td><span className={`${styles.statusBadge} ${styles.statusApproved}`}>{c.status || 'Active'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderRiders = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🛵 Riders</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {riders.map((r) => (
                            <tr key={r.id}>
                                <td>{r.name}</td>
                                <td>{r.email}</td>
                                <td><span className={`${styles.statusBadge} ${styles.statusApproved}`}>{r.status || 'Active'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // ============================================
    // MODALS FOR ADD
    // ============================================
    const renderAddEmployeeModal = () => {
        if (!showAddEmployee) return null;
        return (
            <div className={styles.modalOverlay} onClick={() => setShowAddEmployee(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3 className={styles.modalTitle}>Add Employee</h3>
                    <form onSubmit={handleAddEmployeeSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Name</label>
                            <input type="text" className={styles.formInput} required value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Email</label>
                            <input type="email" className={styles.formInput} required value={employeeForm.email} onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Role</label>
                            <select className={styles.formSelect} value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}>
                                <option>Vendor Manager</option>
                                <option>Product Moderator</option>
                                <option>Order Manager</option>
                                <option>Finance Manager</option>
                                <option>Support Manager</option>
                            </select>
                        </div>
                        <button type="submit" className={styles.primaryBtn}>Add Employee</button>
                    </form>
                </div>
            </div>
        );
    };

    const renderAddCouponModal = () => {
        if (!showAddCoupon) return null;
        return (
            <div className={styles.modalOverlay} onClick={() => setShowAddCoupon(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3 className={styles.modalTitle}>Create Coupon</h3>
                    <form onSubmit={handleAddCouponSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Coupon Code</label>
                            <input type="text" className={styles.formInput} placeholder="e.g., FLAT20" required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Type</label>
                            <select className={styles.formSelect} value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value as 'percentage' | 'fixed'})}>
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Discount</label>
                            <input type="text" className={styles.formInput} placeholder="15% or 150" required value={couponForm.discount} onChange={e => setCouponForm({...couponForm, discount: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Expiry</label>
                            <input type="date" className={styles.formInput} required value={couponForm.expiry} onChange={e => setCouponForm({...couponForm, expiry: e.target.value})} />
                        </div>
                        <button type="submit" className={styles.primaryBtn}>Create Coupon</button>
                    </form>
                </div>
            </div>
        );
    };

    const renderAddAnnouncementModal = () => {
        if (!showAddAnnouncement) return null;
        return (
            <div className={styles.modalOverlay} onClick={() => setShowAddAnnouncement(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3 className={styles.modalTitle}>Send Announcement</h3>
                    <form onSubmit={handleAddAnnouncementSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Title</label>
                            <input type="text" className={styles.formInput} required value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Content</label>
                            <textarea className={styles.formTextarea} rows={4} required value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Audience</label>
                            <select className={styles.formSelect} value={announcementForm.audience} onChange={e => setAnnouncementForm({...announcementForm, audience: e.target.value as 'all' | 'vendors' | 'customers' | 'riders'})}>
                                <option value="all">All Users</option>
                                <option value="vendors">Vendors</option>
                                <option value="customers">Customers</option>
                                <option value="riders">Riders</option>
                            </select>
                        </div>
                        <button type="submit" className={styles.successBtn}>Send Announcement</button>
                    </form>
                </div>
            </div>
        );
    };

    const renderAddCommissionModal = () => {
        if (!showAddCommission) return null;
        return (
            <div className={styles.modalOverlay} onClick={() => setShowAddCommission(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3 className={styles.modalTitle}>Add Commission Rule</h3>
                    <form onSubmit={handleAddCommissionSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Name</label>
                            <input type="text" className={styles.formInput} required value={commissionForm.name} onChange={e => setCommissionForm({...commissionForm, name: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Type</label>
                            <select className={styles.formSelect} value={commissionForm.type} onChange={e => setCommissionForm({...commissionForm, type: e.target.value as 'percentage' | 'fixed'})}>
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Value</label>
                            <input type="text" className={styles.formInput} placeholder="e.g., 2% or PKR 20" required value={commissionForm.value} onChange={e => setCommissionForm({...commissionForm, value: e.target.value})} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Description</label>
                            <input type="text" className={styles.formInput} required value={commissionForm.description} onChange={e => setCommissionForm({...commissionForm, description: e.target.value})} />
                        </div>
                        <button type="submit" className={styles.primaryBtn}>Add Commission</button>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================
    // MAIN RENDER
    // ============================================
    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            {/* SIDEBAR */}
            <div className={styles.sidebar}>
                <div className={styles.logo}>⚙️ Admin Panel</div>
                <ul className={styles.menu}>
                    <li className={activeTab === 'dashboard' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</li>
                    <li className={activeTab === 'vendors' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('vendors')}>🏪 Vendors</li>
                    <li className={activeTab === 'customers' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('customers')}>👥 Customers</li>
                    <li className={activeTab === 'riders' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('riders')}>🚚 Riders</li>
                    <li className={activeTab === 'employees' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('employees')}>👔 Employees</li>
                    <li className={activeTab === 'commission' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('commission')}>💰 Commission</li>
                    <li className={activeTab === 'coupons' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('coupons')}>🎟️ Coupons</li>
                    <li className={activeTab === 'announcements' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('announcements')}>📢 Announcements</li>
                    <li className={activeTab === 'withdrawals' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('withdrawals')}>💳 Withdrawals</li>
                    <li className={activeTab === 'subscriptions' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('subscriptions')}>📋 Subscriptions</li>
                    <li className={styles.menuItemLogout} onClick={() => { localStorage.clear(); router.push('/auth/login'); }}>🔒 Logout</li>
                </ul>
            </div>

            {/* MAIN CONTENT */}
            <div className={styles.main}>
                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <>
                        <div className={styles.header}>
                            <h2>Admin Dashboard</h2>
                            <p>Welcome back, Admin!</p>
                        </div>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}><h3>Vendors</h3><p className={styles.statValue}>{vendors.length}</p></div>
                            <div className={styles.statCard}><h3>Riders</h3><p className={styles.statValue}>{riders.length}</p></div>
                            <div className={styles.statCard}><h3>Customers</h3><p className={styles.statValue}>{customers.length}</p></div>
                            <div className={styles.statCard}><h3>Pending</h3><p className={styles.statValue}>{vendors.filter(v => v.status === 'pending').length}</p></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                            <div className={styles.section} style={{ marginBottom: '0' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>💳 Pending Withdrawals</h3>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                                    {withdrawalRequests.filter(w => w.status === 'pending').length}
                                </p>
                                <button className={styles.primaryBtn} onClick={() => setActiveTab('withdrawals')}>View All</button>
                            </div>
                            <div className={styles.section} style={{ marginBottom: '0' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>📋 Pending Subscriptions</h3>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a6cf7' }}>
                                    {subscriptionRequests.filter(s => s.status === 'pending').length}
                                </p>
                                <button className={styles.primaryBtn} onClick={() => setActiveTab('subscriptions')}>View All</button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'vendors' && renderVendors()}
                {activeTab === 'customers' && renderCustomers()}
                {activeTab === 'riders' && renderRiders()}
                {activeTab === 'employees' && renderAdminEmployees()}
                {activeTab === 'commission' && renderCommissionTypes()}
                {activeTab === 'coupons' && renderCoupons()}
                {activeTab === 'announcements' && renderAnnouncements()}
                {activeTab === 'withdrawals' && renderWithdrawalRequests()}
                {activeTab === 'subscriptions' && renderSubscriptionRequests()}
            </div>

            {/* MODALS */}
            {renderAddEmployeeModal()}
            {renderAddCouponModal()}
            {renderAddAnnouncementModal()}
            {renderAddCommissionModal()}
            {renderVendorDetailModal()}
        </div>
    );
}