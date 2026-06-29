'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './admin.module.css';

// ============================================
// INTERFACES / TYPES
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
}

interface Rider {
    id: string;
    name: string;
    email: string;
    status: string;
}

interface Customer {
    id: string;
    name: string;
    email: string;
    status: string;
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
    // STATES - Backend se data aayega
    // ============================================
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [adminEmployees, setAdminEmployees] = useState<AdminEmployee[]>([]);
    const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    // ============================================
    // MODALS STATE
    // ============================================
    const [showAddCoupon, setShowAddCoupon] = useState(false);
    const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showAddCommission, setShowAddCommission] = useState(false);

    // ============================================
    // FORM STATES
    // ============================================
    const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', role: 'Vendor Manager' });
    const [couponForm, setCouponForm] = useState({ code: '', type: 'percentage' as const, discount: '', expiry: '' });
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', audience: 'all' as const });
    const [commissionForm, setCommissionForm] = useState({ name: '', type: 'percentage' as const, value: '', description: '' });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

    // ============================================
    // FETCH DATA FROM BACKEND
    // ============================================
    const loadAllDashboardData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/auth/login');
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            // 1. Vendors - GET /api/auth/vendors
            const resVendors = await axios.get(`${API_URL}/api/auth/vendors`, { headers });
            if (resVendors?.data?.success) setVendors(resVendors.data.vendors);

            // 2. Riders - GET /api/auth/riders
            const resRiders = await axios.get(`${API_URL}/api/auth/riders`, { headers });
            if (resRiders?.data?.success) setRiders(resRiders.data.riders);

            // 3. Customers - GET /api/auth/customers
            const resCustomers = await axios.get(`${API_URL}/api/auth/customers`, { headers });
            if (resCustomers?.data?.success) setCustomers(resCustomers.data.customers);

            // 4. Employees - GET /api/auth/employees
            const resEmployees = await axios.get(`${API_URL}/api/auth/employees`, { headers });
            if (resEmployees?.data?.success) setAdminEmployees(resEmployees.data.employees);

            // 5. Commissions - GET /api/auth/commissions
            const resCommissions = await axios.get(`${API_URL}/api/auth/commissions`, { headers });
            if (resCommissions?.data?.success) setCommissionTypes(resCommissions.data.commissions);

            // 6. Coupons - GET /api/auth/coupons
            const resCoupons = await axios.get(`${API_URL}/api/auth/coupons`, { headers });
            if (resCoupons?.data?.success) setCoupons(resCoupons.data.coupons);

            // 7. Announcements - GET /api/auth/announcements
            const resAnnouncements = await axios.get(`${API_URL}/api/auth/announcements`, { headers });
            if (resAnnouncements?.data?.success) setAnnouncements(resAnnouncements.data.announcements);

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, router]);

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
            alert(`❌ Error updating vendor status`);
        }
    }, [API_URL, loadAllDashboardData]);

    // ============================================
    // EMPLOYEE CRUD - POST /api/auth/employee
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
    // COUPON CRUD - POST /api/auth/coupon
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
    // COMMISSION CRUD - POST /api/auth/commission
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
    // ANNOUNCEMENT CRUD - POST /api/auth/announcement
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

    if (loading) return <div className={styles.loading}>Loading...</div>;

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
                    </>
                )}

                {/* VENDORS */}
                {activeTab === 'vendors' && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Vendor Approvals</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Shop Name</th><th>Owner</th><th>Email</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {vendors.map(v => (
                                    <tr key={v.id}>
                                        <td>{v.shopName}</td>
                                        <td>{v.ownerName}</td>
                                        <td>{v.email}</td>
                                        <td><span className={`${styles.statusBadge} ${v.status === 'approved' ? styles.statusApproved : v.status === 'pending' ? styles.statusPending : styles.statusRejected}`}>{v.status}</span></td>
                                        <td><button className={styles.primaryBtn} onClick={() => { setSelectedVendor(v); setShowVendorDetail(true); }}>Review</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CUSTOMERS */}
                {activeTab === 'customers' && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Customers</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{c.email}</td>
                                        <td><span className={`${styles.statusBadge} ${styles.statusApproved}`}>{c.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* RIDERS */}
                {activeTab === 'riders' && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Riders</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {riders.map(r => (
                                    <tr key={r.id}>
                                        <td>{r.name}</td>
                                        <td>{r.email}</td>
                                        <td><span className={`${styles.statusBadge} ${styles.statusApproved}`}>{r.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* EMPLOYEES */}
                {activeTab === 'employees' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>👔 Admin Employees</h3>
                            <button className={styles.primaryBtn} onClick={() => setShowAddEmployee(true)}>+ Add Employee</button>
                        </div>
                        {adminEmployees.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}><p>No employees added yet.</p></div>
                        ) : (
                            <div className={styles.employeeGrid}>
                                {adminEmployees.map(emp => (
                                    <div key={emp.id} className={styles.employeeCard}>
                                        <div className={styles.employeeIcon}>👤</div>
                                        <div className={styles.employeeName}>{emp.name}</div>
                                        <div className={styles.employeeRole}>{emp.role}</div>
                                        <div className={styles.employeeEmail}>{emp.email}</div>
                                        <button className={styles.dangerBtn} onClick={() => handleDeleteEmployee(emp.id)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* COMMISSION */}
                {activeTab === 'commission' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>💰 Commission Rules</h3>
                            <button className={styles.primaryBtn} onClick={() => setShowAddCommission(true)}>+ Add Rule</button>
                        </div>
                        {commissionTypes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}><p>No commission rules defined.</p></div>
                        ) : (
                            <div className={styles.commissionGrid}>
                                {commissionTypes.map(c => (
                                    <div key={c.id} className={styles.commissionCard}>
                                        <div><div className={styles.commissionName}>{c.name}</div><div className={styles.commissionDesc}>{c.description}</div></div>
                                        <div className={styles.commissionValue}>{c.value}</div>
                                        <button className={styles.dangerBtn} onClick={() => handleDeleteCommission(c.id)}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* COUPONS */}
                {activeTab === 'coupons' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>🎟️ Coupons</h3>
                            <button className={styles.primaryBtn} onClick={() => setShowAddCoupon(true)}>+ Create Coupon</button>
                        </div>
                        {coupons.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}><p>No coupons created yet.</p></div>
                        ) : (
                            <div className={styles.couponGrid}>
                                {coupons.map(cp => (
                                    <div key={cp.id} className={styles.couponCard}>
                                        <div className={styles.couponCode}>{cp.code}</div>
                                        <div className={styles.couponDiscount}>{cp.discount} Off</div>
                                        <div className={styles.couponExpiry}>Expires: {cp.expiry}</div>
                                        <div style={{ fontSize: '11px' }}>Used: {cp.usage} times</div>
                                        <button className={styles.dangerBtn} onClick={() => handleDeleteCoupon(cp.id)}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ANNOUNCEMENTS */}
                {activeTab === 'announcements' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>📢 Announcements</h3>
                            <button className={styles.successBtn} onClick={() => setShowAddAnnouncement(true)}>+ Send Announcement</button>
                        </div>
                        {announcements.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}><p>No announcements sent yet.</p></div>
                        ) : (
                            <div>
                                {announcements.map(an => (
                                    <div key={an.id} className={styles.announcementItem}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className={styles.announcementTitle}>{an.title}</span>
                                            <span className={styles.statusBadge} style={{ backgroundColor: '#edf2f7' }}>To: {an.audience}</span>
                                        </div>
                                        <p className={styles.announcementContent}>{an.content}</p>
                                        <div className={styles.announcementDate}>{an.date}</div>
                                        <button className={styles.dangerBtn} onClick={() => handleDeleteAnnouncement(an.id)}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ============================================
                MODALS
            ============================================ */}

            {/* ADD EMPLOYEE MODAL */}
            {showAddEmployee && (
                <div className={styles.modalOverlay} onClick={() => setShowAddEmployee(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Add Employee</h3>
                        <form onSubmit={handleAddEmployeeSubmit}>
                            <div className={styles.formGroup}><label>Name</label><input type="text" className={styles.formInput} required value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} /></div>
                            <div className={styles.formGroup}><label>Email</label><input type="email" className={styles.formInput} required value={employeeForm.email} onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})} /></div>
                            <div className={styles.formGroup}><label>Role</label>
                                <select className={styles.formSelect} value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} title="Select Role">
                                    <option>Vendor Manager</option>
                                    <option>Product Moderator</option>
                                    <option>Order Manager</option>
                                    <option>Finance Manager</option>
                                    <option>Support Manager</option>
                                </select>
                            </div>
                            <button type="submit" className={styles.primaryBtn} style={{ marginTop: '10px', width: '100%' }}>Add Employee</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD COUPON MODAL */}
            {showAddCoupon && (
                <div className={styles.modalOverlay} onClick={() => setShowAddCoupon(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Create Coupon</h3>
                        <form onSubmit={handleAddCouponSubmit}>
                            <div className={styles.formGroup}><label>Code</label><input type="text" className={styles.formInput} placeholder="e.g., FLAT20" required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value})} /></div>
                            <div className={styles.formGroup}><label>Type</label>
                                <select className={styles.formSelect} value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value as 'percentage' | 'fixed'})} title="Select Coupon Type">
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}><label>Discount</label><input type="text" className={styles.formInput} placeholder="15% or 150" required value={couponForm.discount} onChange={e => setCouponForm({...couponForm, discount: e.target.value})} /></div>
                            <div className={styles.formGroup}><label>Expiry</label><input type="date" className={styles.formInput} required value={couponForm.expiry} onChange={e => setCouponForm({...couponForm, expiry: e.target.value})} /></div>
                            <button type="submit" className={styles.primaryBtn} style={{ marginTop: '10px', width: '100%' }}>Create Coupon</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD ANNOUNCEMENT MODAL */}
            {showAddAnnouncement && (
                <div className={styles.modalOverlay} onClick={() => setShowAddAnnouncement(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Send Announcement</h3>
                        <form onSubmit={handleAddAnnouncementSubmit}>
                            <div className={styles.formGroup}><label>Title</label><input type="text" className={styles.formInput} required value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} /></div>
                            <div className={styles.formGroup}><label>Content</label><textarea className={styles.formTextarea} rows={4} required value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} /></div>
                            <div className={styles.formGroup}><label>Audience</label>
                                <select className={styles.formSelect} value={announcementForm.audience} onChange={e => setAnnouncementForm({...announcementForm, audience: e.target.value as 'all' | 'vendors' | 'customers' | 'riders'})} title="Select Audience">
                                    <option value="all">All Users</option>
                                    <option value="vendors">Vendors</option>
                                    <option value="customers">Customers</option>
                                    <option value="riders">Riders</option>
                                </select>
                            </div>
                            <button type="submit" className={styles.successBtn} style={{ marginTop: '10px', width: '100%' }}>Send</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD COMMISSION MODAL */}
            {showAddCommission && (
                <div className={styles.modalOverlay} onClick={() => setShowAddCommission(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Add Commission Rule</h3>
                        <form onSubmit={handleAddCommissionSubmit}>
                            <div className={styles.formGroup}><label>Name</label><input type="text" className={styles.formInput} required value={commissionForm.name} onChange={e => setCommissionForm({...commissionForm, name: e.target.value})} /></div>
                            <div className={styles.formGroup}><label>Type</label>
                                <select className={styles.formSelect} value={commissionForm.type} onChange={e => setCommissionForm({...commissionForm, type: e.target.value as 'percentage' | 'fixed'})} title="Select Commission Type">
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}><label>Value</label><input type="text" className={styles.formInput} placeholder="e.g., 2% or PKR 20" required value={commissionForm.value} onChange={e => setCommissionForm({...commissionForm, value: e.target.value})} /></div>
                            <div className={styles.formGroup}><label>Description</label><input type="text" className={styles.formInput} required value={commissionForm.description} onChange={e => setCommissionForm({...commissionForm, description: e.target.value})} /></div>
                            <button type="submit" className={styles.primaryBtn} style={{ marginTop: '10px', width: '100%' }}>Add</button>
                        </form>
                    </div>
                </div>
            )}

            {/* VENDOR DETAIL MODAL */}
            {showVendorDetail && selectedVendor && (
                <div className={styles.modalOverlay} onClick={() => setShowVendorDetail(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>📋 Vendor Details</h3>
                            <button className={styles.modalClose} onClick={() => setShowVendorDetail(false)}>×</button>
                        </div>
                        <div className={styles.detailGrid}>
                            <div><label className={styles.detailLabel}>Shop Name</label><p>{selectedVendor.shopName}</p></div>
                            <div><label className={styles.detailLabel}>Owner</label><p>{selectedVendor.ownerName}</p></div>
                            <div><label className={styles.detailLabel}>Email</label><p>{selectedVendor.email}</p></div>
                            <div><label className={styles.detailLabel}>Phone</label><p>{selectedVendor.phone}</p></div>
                            <div className={styles.detailFull}><label className={styles.detailLabel}>Address</label><p>{selectedVendor.shopAddress}</p></div>
                        </div>
                        <div className={styles.modalActions}>
                            {selectedVendor.status === 'pending' && (
                                <>
                                    <button className={styles.successBtn} onClick={() => updateVendorStatus(selectedVendor.id, 'approved')}>Approve</button>
                                    <button className={styles.dangerBtn} onClick={() => updateVendorStatus(selectedVendor.id, 'rejected')}>Reject</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}