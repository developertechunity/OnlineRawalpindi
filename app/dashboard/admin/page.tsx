'use client';

import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './admin.module.css';

// ============================================
// INTERFACES
// ============================================
interface Vendor {
    id: string;
    vendorId?: string;
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
    whatsapp?: string;
    city?: string;
    country?: string;
    businessPhone?: string;
    businessWhatsapp?: string;
    businessLandline?: string;
    businessEmail?: string;
    businessCity?: string;
    businessCountry?: string;
    businessNtn?: string;
    businessWebsite?: string;
    socialLink?: string;
    mapLocation?: string;
    businessLogo?: string;
    coverImage?: string;
    galleryImages?: string[];
    businessTimings?: string;
    streetAddress?: string;
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [vendorDetailTab, setVendorDetailTab] = useState<'personal' | 'business'>('personal');
    
    // ============================================
    // CURRENT TIME STATE
    // ============================================
    const [currentTime, setCurrentTime] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ============================================
    // PAGINATION STATE - UPDATED
    // ============================================
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pageSizeOptions] = useState([10, 20, 50, 70, 100, 200, 500, 1000]);

    // ============================================
    // ADD VENDOR MODAL STATE
    // ============================================
    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [addVendorLoading, setAddVendorLoading] = useState(false);
    const [addVendorMessage, setAddVendorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Add Vendor Form State
    const [addVendorForm, setAddVendorForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        shopName: '',
        shopAddress: '',
        ntnNumber: '',
    });
    
    // Add Vendor File States
    const [addCnicFront, setAddCnicFront] = useState<File | null>(null);
    const [addCnicBack, setAddCnicBack] = useState<File | null>(null);
    const [addBusinessLicense, setAddBusinessLicense] = useState<File | null>(null);
    
    // Add Vendor Preview States
    const [addCnicFrontPreview, setAddCnicFrontPreview] = useState<string>('');
    const [addCnicBackPreview, setAddCnicBackPreview] = useState<string>('');
    const [addBusinessLicensePreview, setAddBusinessLicensePreview] = useState<string>('');

    // ============================================
    // EDIT FORM STATE - WITH FILES
    // ============================================
    const [editForm, setEditForm] = useState({
        shopName: '',
        ownerName: '',
        email: '',
        phone: '',
        shopAddress: '',
        ntnNumber: ''
    });
    
    const [editCnicFront, setEditCnicFront] = useState<File | null>(null);
    const [editCnicBack, setEditCnicBack] = useState<File | null>(null);
    const [editBusinessLicense, setEditBusinessLicense] = useState<File | null>(null);
    const [editCnicFrontPreview, setEditCnicFrontPreview] = useState<string>('');
    const [editCnicBackPreview, setEditCnicBackPreview] = useState<string>('');
    const [editBusinessLicensePreview, setEditBusinessLicensePreview] = useState<string>('');
    const [existingCnicFront, setExistingCnicFront] = useState<string>('');
    const [existingCnicBack, setExistingCnicBack] = useState<string>('');
    const [existingBusinessLicense, setExistingBusinessLicense] = useState<string>('');

    // ============================================
    // SEARCH/FILTER STATES
    // ============================================
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

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
    // CLICK OUTSIDE DROPDOWN
    // ============================================
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================
    // CURRENT TIME UPDATER
    // ============================================
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            setCurrentTime(`${hours}:${minutes}:${seconds}`);
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // ============================================
    // LOGOUT HANDLER
    // ============================================
    const handleLogout = useCallback(() => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            router.push('/auth/login');
        }
    }, [router]);

    // ============================================
    // IMAGE URL HELPER
    // ============================================
    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return "";
        if (imagePath.startsWith("http")) return imagePath;
        const cleanPath = imagePath
            .replace(/\\/g, "/")
            .replace(/^\/+/, "")
            .replace(/^uploads\/+/, "");
        return `${API_URL}/uploads/${cleanPath}`;
    };

    // ============================================
    // ADD VENDOR HANDLERS
    // ============================================
    const handleAddVendorFileChange = (e: ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void, setPreview: (preview: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const removeAddVendorFile = (setFile: (file: File | null) => void, setPreview: (preview: string) => void) => {
        setFile(null);
        setPreview('');
    };

    const handleAddVendorSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAddVendorLoading(true);
        setAddVendorMessage(null);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            formData.append('name', addVendorForm.name);
            formData.append('email', addVendorForm.email);
            formData.append('phone', addVendorForm.phone);
            formData.append('password', addVendorForm.password);
            formData.append('role', 'vendor');
            formData.append('shopName', addVendorForm.shopName);
            formData.append('shopAddress', addVendorForm.shopAddress);
            if (addVendorForm.ntnNumber) formData.append('ntnNumber', addVendorForm.ntnNumber);
            
            if (addCnicFront) formData.append('cnicFront', addCnicFront);
            if (addCnicBack) formData.append('cnicBack', addCnicBack);
            if (addBusinessLicense) formData.append('businessLicense', addBusinessLicense);

            await axios.post(
                `${API_URL}/api/auth/register`,
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );

            setAddVendorMessage({ type: 'success', text: '✅ Vendor added successfully! Pending admin approval.' });
            
            setAddVendorForm({
                name: '',
                email: '',
                phone: '',
                password: '',
                shopName: '',
                shopAddress: '',
                ntnNumber: '',
            });
            setAddCnicFront(null);
            setAddCnicBack(null);
            setAddBusinessLicense(null);
            setAddCnicFrontPreview('');
            setAddCnicBackPreview('');
            setAddBusinessLicensePreview('');
            
            loadAllDashboardData();
            
            setTimeout(() => {
                setShowAddVendorModal(false);
                setAddVendorMessage(null);
            }, 3000);
            
        } catch (error: any) {
            setAddVendorMessage({ 
                type: 'error', 
                text: error.response?.data?.message || '❌ Failed to add vendor'
            });
        } finally {
            setAddVendorLoading(false);
        }
    };

    // ============================================
    // FILTERED VENDORS
    // ============================================
    const filteredVendors = useMemo(() => {
        let filtered = [...vendors];

        if (filterStatus !== 'all') {
            filtered = filtered.filter(v => v.status === filterStatus);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(v => {
                return (
                    v.vendorId?.toLowerCase().includes(term) ||
                    v.shopName?.toLowerCase().includes(term) ||
                    v.ownerName?.toLowerCase().includes(term) ||
                    v.email?.toLowerCase().includes(term) ||
                    v.phone?.toLowerCase().includes(term) ||
                    v.date?.includes(term) ||
                    v.status?.toLowerCase().includes(term)
                );
            });
        }

        filtered.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        return filtered;
    }, [vendors, searchTerm, filterStatus]);

    // ============================================
    // PAGINATION CALCULATIONS
    // ============================================
    const totalItems = filteredVendors.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const paginatedVendors = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredVendors.slice(startIndex, endIndex);
    }, [filteredVendors, currentPage, itemsPerPage]);

    // Reset to page 1 when filter/search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, itemsPerPage]);

    // ============================================
    // STATS CALCULATIONS
    // ============================================
    const totalVendors = vendors.length;
    const activeVendors = vendors.filter(v => v.status === 'approved').length;
    const pendingVendors = vendors.filter(v => v.status === 'pending').length;

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active' || c.status === 'approved').length;

    const totalRiders = riders.length;
    const activeRiders = riders.filter(r => r.status === 'approved' || r.status === 'active').length;

    // ============================================
    // FETCH FUNCTIONS
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
    // VENDOR CRUD OPERATIONS
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

    const handleDeleteVendor = useCallback(async (vendorId: string) => {
        if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_URL}/api/auth/vendor/${vendorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                alert('✅ Vendor deleted successfully!');
                setShowVendorDetail(false);
                loadAllDashboardData();
            }
        } catch (error: any) {
            alert(`❌ Error deleting vendor: ${error.response?.data?.message || error.message}`);
        }
    }, [API_URL, loadAllDashboardData]);

    // ============================================
    // EDIT VENDOR - WITH FILE SUPPORT
    // ============================================
    const handleEditVendor = useCallback((vendor: Vendor) => {
        setEditingVendor(vendor);
        setEditForm({
            shopName: vendor.shopName || '',
            ownerName: vendor.ownerName || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            shopAddress: vendor.shopAddress || '',
            ntnNumber: vendor.ntnNumber || ''
        });
        
        setExistingCnicFront(vendor.cnicFront || '');
        setExistingCnicBack(vendor.cnicBack || '');
        setExistingBusinessLicense(vendor.businessLicense || '');
        
        setEditCnicFront(null);
        setEditCnicBack(null);
        setEditBusinessLicense(null);
        setEditCnicFrontPreview('');
        setEditCnicBackPreview('');
        setEditBusinessLicensePreview('');
        
        setShowEditModal(true);
    }, []);

    const handleEditCnicFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditCnicFront(file);
            setEditCnicFrontPreview(URL.createObjectURL(file));
        }
    };

    const handleEditCnicBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditCnicBack(file);
            setEditCnicBackPreview(URL.createObjectURL(file));
        }
    };

    const handleEditBusinessLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditBusinessLicense(file);
            setEditBusinessLicensePreview(URL.createObjectURL(file));
        }
    };

    const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVendor) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            formData.append('shopName', editForm.shopName);
            formData.append('ownerName', editForm.ownerName);
            formData.append('email', editForm.email);
            formData.append('phone', editForm.phone);
            formData.append('shopAddress', editForm.shopAddress);
            formData.append('ntnNumber', editForm.ntnNumber);
            
            if (editCnicFront) formData.append('cnicFront', editCnicFront);
            if (editCnicBack) formData.append('cnicBack', editCnicBack);
            if (editBusinessLicense) formData.append('businessLicense', editBusinessLicense);

            const response = await axios.put(
                `${API_URL}/api/auth/vendor/${editingVendor.id}`,
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );
            
            if (response.data.success) {
                alert('✅ Vendor updated successfully!');
                setShowEditModal(false);
                setEditingVendor(null);
                loadAllDashboardData();
            }
        } catch (error: any) {
            alert(`❌ Error updating vendor: ${error.response?.data?.message || error.message}`);
        }
    }, [API_URL, editingVendor, editForm, editCnicFront, editCnicBack, editBusinessLicense, loadAllDashboardData]);

    const handleViewVendor = useCallback((vendor: Vendor) => {
        setSelectedVendor(vendor);
        setVendorDetailTab('personal');
        setShowVendorDetail(true);
    }, []);

    // ============================================
    // WITHDRAWAL & SUBSCRIPTION HANDLERS
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
    // ADD VENDOR MODAL
    // ============================================
    const renderAddVendorModal = () => {
        if (!showAddVendorModal) return null;

        return (
            <div className={styles.modalOverlay} onClick={() => setShowAddVendorModal(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>➕ Add Vendor</h3>
                        <button className={styles.modalClose} onClick={() => setShowAddVendorModal(false)}>×</button>
                    </div>

                    {addVendorMessage && (
                        <div className={addVendorMessage.type === 'error' ? styles.messageError : styles.messageSuccess} style={{ marginBottom: '15px' }}>
                            {addVendorMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleAddVendorSubmit}>
                        <div className={styles.editDivider}>
                            <span>👤 Personal Information</span>
                        </div>

                        <div className={styles.editGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Full Name *</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Enter full name"
                                    value={addVendorForm.name}
                                    onChange={(e) => setAddVendorForm({ ...addVendorForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email *</label>
                                <input
                                    type="email"
                                    className={styles.formInput}
                                    placeholder="Enter email"
                                    value={addVendorForm.email}
                                    onChange={(e) => setAddVendorForm({ ...addVendorForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Phone *</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Enter phone number"
                                    value={addVendorForm.phone}
                                    onChange={(e) => setAddVendorForm({ ...addVendorForm, phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Password *</label>
                                <input
                                    type="password"
                                    className={styles.formInput}
                                    placeholder="Create password"
                                    value={addVendorForm.password}
                                    onChange={(e) => setAddVendorForm({ ...addVendorForm, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.editDivider}>
                            <span>🏪 Business Information</span>
                        </div>

                        <div className={styles.editGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Shop Name *</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Enter shop name"
                                    value={addVendorForm.shopName}
                                    onChange={(e) => setAddVendorForm({ ...addVendorForm, shopName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>NTN Number</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Enter NTN (optional)"
                                    value={addVendorForm.ntnNumber}
                                    onChange={(e) => setAddVendorForm({ ...addVendorForm, ntnNumber: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.formLabel}>Shop Address *</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Enter shop address"
                                    value={addVendorForm.shopAddress}
                                    onChange={(e) => setAddVendorForm({ ...addVendorForm, shopAddress: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.editDivider}>
                            <span>📄 Documents</span>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Business License <span className={styles.optionalLabel}>(Optional)</span></label>
                            <div className={styles.uploadBoxModern}>
                                <label className={styles.uploadLabelModern}>
                                    <span className={styles.uploadIconModern}>📄</span>
                                    {addBusinessLicensePreview ? 'Change Business License' : 'Upload Business License'}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleAddVendorFileChange(e, setAddBusinessLicense, setAddBusinessLicensePreview)}
                                        className={styles.uploadInput}
                                    />
                                </label>
                                {addBusinessLicensePreview && (
                                    <div className={styles.previewContainerModern}>
                                        <img src={addBusinessLicensePreview} alt="Business License" className={styles.previewImageModern} />
                                        <button type="button" className={styles.removeBtnModern} onClick={() => removeAddVendorFile(setAddBusinessLicense, setAddBusinessLicensePreview)}>
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.cnicRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>CNIC Front *</label>
                                <div className={styles.uploadBoxModern}>
                                    <label className={styles.uploadLabelModern}>
                                        <span className={styles.uploadIconModern}>🪪</span>
                                        {addCnicFrontPreview ? 'Change CNIC Front' : 'Upload CNIC Front'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleAddVendorFileChange(e, setAddCnicFront, setAddCnicFrontPreview)}
                                            className={styles.uploadInput}
                                            required={!addCnicFrontPreview}
                                        />
                                    </label>
                                    {addCnicFrontPreview && (
                                        <div className={styles.previewContainerModern}>
                                            <img src={addCnicFrontPreview} alt="CNIC Front" className={styles.previewImageModern} />
                                            <button type="button" className={styles.removeBtnModern} onClick={() => removeAddVendorFile(setAddCnicFront, setAddCnicFrontPreview)}>
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>CNIC Back *</label>
                                <div className={styles.uploadBoxModern}>
                                    <label className={styles.uploadLabelModern}>
                                        <span className={styles.uploadIconModern}>🪪</span>
                                        {addCnicBackPreview ? 'Change CNIC Back' : 'Upload CNIC Back'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleAddVendorFileChange(e, setAddCnicBack, setAddCnicBackPreview)}
                                            className={styles.uploadInput}
                                            required={!addCnicBackPreview}
                                        />
                                    </label>
                                    {addCnicBackPreview && (
                                        <div className={styles.previewContainerModern}>
                                            <img src={addCnicBackPreview} alt="CNIC Back" className={styles.previewImageModern} />
                                            <button type="button" className={styles.removeBtnModern} onClick={() => removeAddVendorFile(setAddCnicBack, setAddCnicBackPreview)}>
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.editActions}>
                            <button type="submit" className={styles.saveBtn} disabled={addVendorLoading}>
                                {addVendorLoading ? '⏳ Adding...' : '➕ Add Vendor'}
                            </button>
                            <button type="button" className={styles.cancelBtn} onClick={() => setShowAddVendorModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
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
        const businessLogoUrl = getImageUrl(selectedVendor.businessLogo);
        const coverImageUrl = getImageUrl(selectedVendor.coverImage);

        return (
            <div className={styles.modalOverlay} onClick={() => setShowVendorDetail(false)}>
                <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <div className={styles.modalTitleWrapper}>
                            <h3 className={styles.modalTitle}>📋 Vendor Details</h3>
                            <span className={styles.vendorIdBadgeSmall}>{selectedVendor.vendorId || 'N/A'}</span>
                        </div>
                        <div className={styles.modalHeaderActions}>
                            {isPending && (
                                <>
                                    <button className={styles.successBtn} onClick={() => updateVendorStatus(selectedVendor.id, 'approved')}>
                                        ✅ Approve
                                    </button>
                                    <button className={styles.dangerBtn} onClick={() => updateVendorStatus(selectedVendor.id, 'rejected')}>
                                        ❌ Reject
                                    </button>
                                </>
                            )}
                            <button className={styles.secondaryBtn} onClick={() => setShowVendorDetail(false)}>
                                ✕ Close
                            </button>
                        </div>
                    </div>

                    <div className={styles.detailTabs}>
                        <button 
                            className={`${styles.detailTab} ${vendorDetailTab === 'personal' ? styles.detailTabActive : ''}`}
                            onClick={() => setVendorDetailTab('personal')}
                        >
                            👤 Personal Info
                        </button>
                        <button 
                            className={`${styles.detailTab} ${vendorDetailTab === 'business' ? styles.detailTabActive : ''}`}
                            onClick={() => setVendorDetailTab('business')}
                        >
                            🏪 Business Info
                        </button>
                    </div>

                    {/* Personal Tab */}
                    {vendorDetailTab === 'personal' && (
                        <div className={styles.detailTabContent}>
                            <div className={styles.detailTwoColumn}>
                                <div className={styles.detailColumn}>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Full Name</label>
                                        <p className={styles.detailValue}>{selectedVendor.ownerName}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Email</label>
                                        <p className={styles.detailValue}>{selectedVendor.email}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Phone Number</label>
                                        <p className={styles.detailValue}>{selectedVendor.phone || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>WhatsApp Number</label>
                                        <p className={styles.detailValue}>{selectedVendor.whatsapp || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>CNIC Number</label>
                                        <p className={styles.detailValue}>{selectedVendor.ntnNumber || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className={styles.detailColumn}>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Street Address</label>
                                        <p className={styles.detailValue}>{selectedVendor.streetAddress || selectedVendor.shopAddress || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>City</label>
                                        <p className={styles.detailValue}>{selectedVendor.city || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Country</label>
                                        <p className={styles.detailValue}>{selectedVendor.country || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Status</label>
                                        <p className={styles.detailValue}>
                                            <span className={`${styles.statusBadge} ${selectedVendor.status === 'approved' ? styles.statusApproved :
                                                selectedVendor.status === 'rejected' ? styles.statusRejected :
                                                    styles.statusPending
                                                }`}>
                                                {selectedVendor.status.charAt(0).toUpperCase() + selectedVendor.status.slice(1)}
                                            </span>
                                        </p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Registration Date</label>
                                        <p className={styles.detailValue}>{selectedVendor.date}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailDocumentsSection}>
                                <div className={styles.detailSectionTitle}>
                                    <span>📄 Documents</span>
                                </div>
                                <div className={styles.detailDocumentsGrid}>
                                    <div className={styles.detailDocBox}>
                                        <label className={styles.detailDocLabel}>CNIC Front</label>
                                        <div className={styles.detailDocWrapper}>
                                            {cnicFrontUrl ? (
                                                <>
                                                    <img src={cnicFrontUrl} alt="CNIC Front" className={styles.detailDocImage} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                    <a href={cnicFrontUrl} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View Full</a>
                                                </>
                                            ) : (
                                                <div className={styles.detailDocEmpty}>No CNIC Front uploaded</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.detailDocBox}>
                                        <label className={styles.detailDocLabel}>CNIC Back</label>
                                        <div className={styles.detailDocWrapper}>
                                            {cnicBackUrl ? (
                                                <>
                                                    <img src={cnicBackUrl} alt="CNIC Back" className={styles.detailDocImage} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                    <a href={cnicBackUrl} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View Full</a>
                                                </>
                                            ) : (
                                                <div className={styles.detailDocEmpty}>No CNIC Back uploaded</div>
                                            )}
                                        </div>
                                    </div>
                                    {businessLicenseUrl && (
                                        <div className={styles.detailDocBox}>
                                            <label className={styles.detailDocLabel}>Business License</label>
                                            <div className={styles.detailDocWrapper}>
                                                <img src={businessLicenseUrl} alt="Business License" className={styles.detailDocImage} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                <a href={businessLicenseUrl} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View Full</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Business Tab */}
                    {vendorDetailTab === 'business' && (
                        <div className={styles.detailTabContent}>
                            <div className={styles.detailTwoColumn}>
                                <div className={styles.detailColumn}>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business Name</label>
                                        <p className={styles.detailValue}>{selectedVendor.shopName}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business NTN</label>
                                        <p className={styles.detailValue}>{selectedVendor.businessNtn || selectedVendor.ntnNumber || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business License</label>
                                        <p className={styles.detailValue}>
                                            {businessLicenseUrl ? (
                                                <a href={businessLicenseUrl} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>📄 View License</a>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business Phone</label>
                                        <p className={styles.detailValue}>{selectedVendor.businessPhone || selectedVendor.phone || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business WhatsApp</label>
                                        <p className={styles.detailValue}>{selectedVendor.businessWhatsapp || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business Landline</label>
                                        <p className={styles.detailValue}>{selectedVendor.businessLandline || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business Email</label>
                                        <p className={styles.detailValue}>{selectedVendor.businessEmail || selectedVendor.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className={styles.detailColumn}>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business City</label>
                                        <p className={styles.detailValue}>{selectedVendor.businessCity || selectedVendor.city || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business Country</label>
                                        <p className={styles.detailValue}>{selectedVendor.businessCountry || selectedVendor.country || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business Website</label>
                                        <p className={styles.detailValue}>
                                            {selectedVendor.businessWebsite ? (
                                                <a href={selectedVendor.businessWebsite} target="_blank" rel="noopener noreferrer" style={{ color: '#4a6cf7', textDecoration: 'none' }}>
                                                    {selectedVendor.businessWebsite}
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Social Link</label>
                                        <p className={styles.detailValue}>
                                            {selectedVendor.socialLink ? (
                                                <a href={selectedVendor.socialLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4a6cf7', textDecoration: 'none' }}>
                                                    {selectedVendor.socialLink}
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Map Location</label>
                                        <p className={styles.detailValue}>
                                            {selectedVendor.mapLocation ? (
                                                <a href={selectedVendor.mapLocation} target="_blank" rel="noopener noreferrer" style={{ color: '#4a6cf7', textDecoration: 'none' }}>
                                                    📍 View on Map
                                                </a>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailDocumentsSection}>
                                <div className={styles.detailSectionTitle}>
                                    <span>🕐 Business Timings</span>
                                </div>
                                <div className={styles.detailTimingsWrapper}>
                                    {selectedVendor.businessTimings ? (
                                        <p className={styles.detailTimingsText}>{selectedVendor.businessTimings}</p>
                                    ) : (
                                        <p className={styles.detailDocEmpty}>No business timings set</p>
                                    )}
                                </div>
                            </div>

                            <div className={styles.detailDocumentsSection}>
                                <div className={styles.detailSectionTitle}>
                                    <span>🖼️ Business Media</span>
                                </div>
                                <div className={styles.detailBusinessMediaGrid}>
                                    <div className={styles.detailDocBox}>
                                        <label className={styles.detailDocLabel}>Business Logo</label>
                                        <div className={styles.detailDocWrapper}>
                                            {businessLogoUrl ? (
                                                <>
                                                    <img src={businessLogoUrl} alt="Business Logo" className={styles.detailDocImage} />
                                                    <a href={businessLogoUrl} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View</a>
                                                </>
                                            ) : (
                                                <div className={styles.detailDocEmpty}>No Logo uploaded</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.detailDocBox}>
                                        <label className={styles.detailDocLabel}>Cover Image</label>
                                        <div className={styles.detailDocWrapper}>
                                            {coverImageUrl ? (
                                                <>
                                                    <img src={coverImageUrl} alt="Cover Image" className={styles.detailDocImage} />
                                                    <a href={coverImageUrl} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View</a>
                                                </>
                                            ) : (
                                                <div className={styles.detailDocEmpty}>No Cover uploaded</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.detailDocBox}>
                                        <label className={styles.detailDocLabel}>Gallery Images</label>
                                        <div className={styles.detailGalleryWrapper}>
                                            {selectedVendor.galleryImages && selectedVendor.galleryImages.length > 0 ? (
                                                <>
                                                    {selectedVendor.galleryImages.slice(0, 3).map((img, idx) => (
                                                        <img key={idx} src={getImageUrl(img)} alt={`Gallery ${idx + 1}`} className={styles.detailGalleryThumb} />
                                                    ))}
                                                    {selectedVendor.galleryImages.length > 3 && (
                                                        <span className={styles.detailGalleryMore}>+{selectedVendor.galleryImages.length - 3}</span>
                                                    )}
                                                </>
                                            ) : (
                                                <div className={styles.detailDocEmpty}>No Gallery images</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }, [showVendorDetail, selectedVendor, vendorDetailTab, updateVendorStatus]);

    // ============================================
    // EDIT MODAL
    // ============================================
    const renderEditModal = useCallback(() => {
        if (!showEditModal || !editingVendor) return null;

        const displayCnicFront = editCnicFrontPreview || (existingCnicFront ? getImageUrl(existingCnicFront) : '');
        const displayCnicBack = editCnicBackPreview || (existingCnicBack ? getImageUrl(existingCnicBack) : '');
        const displayBusinessLicense = editBusinessLicensePreview || (existingBusinessLicense ? getImageUrl(existingBusinessLicense) : '');

        return (
            <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>✏️ Edit Vendor</h3>
                        <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>×</button>
                    </div>

                    <form onSubmit={handleEditSubmit}>
                        <div className={styles.editGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Shop Name *</label>
                                <input type="text" className={styles.formInput} value={editForm.shopName} onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Owner Name *</label>
                                <input type="text" className={styles.formInput} value={editForm.ownerName} onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email *</label>
                                <input type="email" className={styles.formInput} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Phone</label>
                                <input type="text" className={styles.formInput} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                            </div>
                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.formLabel}>Shop Address</label>
                                <input type="text" className={styles.formInput} value={editForm.shopAddress} onChange={(e) => setEditForm({ ...editForm, shopAddress: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>NTN Number</label>
                                <input type="text" className={styles.formInput} value={editForm.ntnNumber} onChange={(e) => setEditForm({ ...editForm, ntnNumber: e.target.value })} />
                            </div>
                        </div>

                        <div className={styles.editDivider}>
                            <span>📄 Documents</span>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Business License <span className={styles.optionalLabel}>(Optional)</span></label>
                            <div className={styles.uploadBoxModern}>
                                <label className={styles.uploadLabelModern}>
                                    <span className={styles.uploadIconModern}>📄</span>
                                    {displayBusinessLicense ? 'Change Business License' : 'Upload Business License'}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleEditBusinessLicenseChange}
                                        className={styles.uploadInput}
                                    />
                                </label>
                                {displayBusinessLicense && (
                                    <div className={styles.previewContainerModern}>
                                        <img src={displayBusinessLicense} alt="Business License" className={styles.previewImageModern} />
                                        <button type="button" onClick={() => { setEditBusinessLicense(null); setEditBusinessLicensePreview(''); setExistingBusinessLicense(''); }} className={styles.removeBtnModern}>✕</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.cnicRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>CNIC Front</label>
                                <div className={styles.uploadBoxModern}>
                                    <label className={styles.uploadLabelModern}>
                                        <span className={styles.uploadIconModern}>🪪</span>
                                        {displayCnicFront ? 'Change CNIC Front' : 'Upload CNIC Front'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleEditCnicFrontChange}
                                            className={styles.uploadInput}
                                        />
                                    </label>
                                    {displayCnicFront && (
                                        <div className={styles.previewContainerModern}>
                                            <img src={displayCnicFront} alt="CNIC Front" className={styles.previewImageModern} />
                                            <button type="button" onClick={() => { setEditCnicFront(null); setEditCnicFrontPreview(''); setExistingCnicFront(''); }} className={styles.removeBtnModern}>✕</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>CNIC Back</label>
                                <div className={styles.uploadBoxModern}>
                                    <label className={styles.uploadLabelModern}>
                                        <span className={styles.uploadIconModern}>🪪</span>
                                        {displayCnicBack ? 'Change CNIC Back' : 'Upload CNIC Back'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleEditCnicBackChange}
                                            className={styles.uploadInput}
                                        />
                                    </label>
                                    {displayCnicBack && (
                                        <div className={styles.previewContainerModern}>
                                            <img src={displayCnicBack} alt="CNIC Back" className={styles.previewImageModern} />
                                            <button type="button" onClick={() => { setEditCnicBack(null); setEditCnicBackPreview(''); setExistingCnicBack(''); }} className={styles.removeBtnModern}>✕</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.editActions}>
                            <button type="submit" className={styles.saveBtn}>💾 Save Changes</button>
                            <button type="button" className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }, [showEditModal, editingVendor, editForm, existingCnicFront, existingCnicBack, existingBusinessLicense, editCnicFrontPreview, editCnicBackPreview, editBusinessLicensePreview, handleEditSubmit]);

    // ============================================
    // RENDER VENDORS TABLE - WITH PAGINATION (UPDATED)
    // ============================================
    const renderVendors = useCallback(() => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>🏪 Vendor Management</h2>
                <div className={styles.headerRight}>
                    <button className={styles.addVendorBtn} onClick={() => setShowAddVendorModal(true)}>
                        ➕ Add Vendor
                    </button>
                </div>
            </div>

            <div className={styles.filterWrapper}>
                <div className={styles.filterRow}>
                    <div className={styles.searchGroup}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search by name, email, phone, date or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className={styles.clearSearchBtn} onClick={() => setSearchTerm('')} title="Clear search">✕</button>
                        )}
                    </div>
                    <div className={styles.filterGroup}>
                        <select className={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="approved">✅ Approved</option>
                            <option value="rejected">❌ Rejected</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <button className={styles.clearBtn} onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}>Clear</button>
                    </div>
                </div>
            </div>

            {/* ✅ PAGINATION CONTROLS - UPDATED */}
            <div className={styles.paginationControls}>
                <div className={styles.perPageWrapper}>
                    <span className={styles.perPageLabel}>Entries</span>
                    <select 
                        className={styles.perPageSelect}
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        {pageSizeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.paginationInfo}>
                    Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vendor ID</th>
                            <th>Shop Name</th>
                            <th>Owner</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Registration Date</th>
                            <th>Status</th>
                            <th className={styles.actionsHeader}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedVendors.length === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>No vendors found matching your search.</td></tr>
                        ) : (
                            paginatedVendors.map((vendor, index) => (
                                <tr key={vendor.id}>
                                    <td className={styles.snoCell}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className={styles.vendorIdCell}><span className={styles.vendorIdBadge}>{vendor.vendorId || 'N/A'}</span></td>
                                    <td className={styles.shopNameCell}><span className={styles.shopNameText}>{vendor.shopName}</span></td>
                                    <td className={styles.ownerCell}>{vendor.ownerName}</td>
                                    <td className={styles.emailCell}>{vendor.email}</td>
                                    <td className={styles.phoneCell}>{vendor.phone || 'N/A'}</td>
                                    <td className={styles.dateCell}>{vendor.date}</td>
                                    <td className={styles.statusCell}>
                                        <span className={`${styles.statusBadge} ${vendor.status === 'approved' ? styles.statusApproved : vendor.status === 'rejected' ? styles.statusRejected : styles.statusPending}`}>
                                            {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <div className={styles.actionIcons}>
                                            <button className={styles.iconBtn} onClick={() => handleEditVendor(vendor)} title="Edit Vendor">
                                                <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </button>
                                            <button className={styles.iconBtn} onClick={() => handleViewVendor(vendor)} title="View Details">
                                                <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                    <circle cx="12" cy="12" r="3"/>
                                                </svg>
                                            </button>
                                            <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteVendor(vendor.id)} title="Delete Vendor">
                                                <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"/>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ✅ PAGINATION FOOTER - UPDATED with ellipsis */}
            {totalItems > 0 && (
                <div className={styles.paginationFooter}>
                    <div className={styles.paginationButtons}>
                        <button 
                            className={styles.pageBtn}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                            ◀ Previous
                        </button>
                        
                        <div className={styles.pageNumbers}>
                            {/* Always show first page */}
                            {totalPages > 5 && currentPage > 3 && (
                                <>
                                    <button
                                        className={styles.pageNumBtn}
                                        onClick={() => setCurrentPage(1)}
                                    >
                                        1
                                    </button>
                                    <span className={styles.pageDots}>…</span>
                                </>
                            )}

                            {/* Show page numbers around current page */}
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        className={`${styles.pageNumBtn} ${currentPage === pageNum ? styles.pageNumActive : ''}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            {/* Always show last page */}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <>
                                    <span className={styles.pageDots}>…</span>
                                    <button
                                        className={styles.pageNumBtn}
                                        onClick={() => setCurrentPage(totalPages)}
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                        </div>

                        <button 
                            className={styles.pageBtn}
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                            Next ▶
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.tableFooter}>
                <span className={styles.vendorCount}>Total: {totalItems}</span>
            </div>
        </div>
    ), [paginatedVendors, searchTerm, filterStatus, currentPage, itemsPerPage, totalItems, totalPages, handleEditVendor, handleViewVendor, handleDeleteVendor]);

    // ============================================
    // RENDER DASHBOARD
    // ============================================
    const renderDashboard = () => (
        <>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h2>Admin Dashboard</h2>
                        <p>Welcome back, Admin!</p>
                    </div>
                    <div className={styles.headerRightControls}>
                        <div className={styles.updatedTime}>
                            <span className={styles.updatedIcon}>🕐</span>
                            <span className={styles.updatedText}>Updated: {currentTime || '00:00:00'}</span>
                        </div>
                        <div className={styles.profileWrapper} ref={dropdownRef}>
                            <button 
                                className={styles.profileBtn} 
                                onClick={() => setShowDropdown(!showDropdown)}
                                aria-label="Profile menu"
                            >
                                <span className={styles.profileAvatar}>A</span>
                            </button>
                            {showDropdown && (
                                <div className={styles.dropdownMenu}>
                                    <div className={styles.dropdownHeader}>
                                        <span className={styles.dropdownAvatar}>A</span>
                                        <div className={styles.dropdownUserInfo}>
                                            <p className={styles.dropdownName}>Admin</p>
                                            <p className={styles.dropdownEmail}>admin@gmail.com</p>
                                        </div>
                                    </div>
                                    <div className={styles.dropdownDivider}></div>
                                    <button className={styles.dropdownLogout} onClick={handleLogout}>
                                        <span className={styles.dropdownLogoutIcon}>🚪</span>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>🏪 Vendors</h3>
                    <p className={styles.statValue}>{totalVendors}</p>
                    <div className={styles.statDetails}>
                        <span className={styles.statActive}>✅ Active: {activeVendors}</span>
                        <span className={styles.statPending}>⏳ Pending: {pendingVendors}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <h3>👥 Customers</h3>
                    <p className={styles.statValue}>{totalCustomers}</p>
                    <div className={styles.statDetails}>
                        <span className={styles.statActive}>✅ Active: {activeCustomers}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <h3>🛵 Riders</h3>
                    <p className={styles.statValue}>{totalRiders}</p>
                    <div className={styles.statDetails}>
                        <span className={styles.statActive}>✅ Active: {activeRiders}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <h3>👔 Employees</h3>
                    <p className={styles.statValue}>{adminEmployees.length}</p>
                    <div className={styles.statDetails}>
                        <span className={styles.statActive}>✅ Total Staff: {adminEmployees.length}</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>📢 Recent Announcements</h2>
                    <button className={styles.primaryBtn} onClick={() => setActiveTab('announcements')}>View All</button>
                </div>
                {announcements.length === 0 ? (
                    <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
                        No announcements yet. <button className={styles.primaryBtn} style={{ padding: '5px 15px', fontSize: '12px' }} onClick={() => setActiveTab('announcements')}>Create One</button>
                    </p>
                ) : (
                    <div className={styles.announcementList}>
                        {announcements.slice(0, 3).map((an) => (
                            <div key={an.id} className={styles.announcementItem}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className={styles.announcementTitle}>{an.title}</span>
                                    <span className={styles.statusBadge} style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>📢 {an.audience}</span>
                                </div>
                                <p className={styles.announcementContent}>{an.content}</p>
                                <div className={styles.announcementDate}>{an.date}</div>
                            </div>
                        ))}
                        {announcements.length > 3 && (
                            <button className={styles.secondaryBtn} onClick={() => setActiveTab('announcements')} style={{ marginTop: '10px' }}>
                                View All {announcements.length} Announcements
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.section} style={{ marginBottom: '0' }}>
                <h2 className={styles.sectionTitle}>⚡ Quick Actions</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className={styles.primaryBtn} onClick={() => setActiveTab('vendors')}>Manage Vendors</button>
                    <button className={styles.primaryBtn} onClick={() => setActiveTab('announcements')}>Send Announcement</button>
                    <button className={styles.primaryBtn} onClick={() => setActiveTab('withdrawals')}>View Withdrawals</button>
                    <button className={styles.primaryBtn} onClick={() => setActiveTab('subscriptions')}>📋 View Subscriptions</button>
                </div>
            </div>
        </>
    );

    // ============================================
    // OTHER RENDER FUNCTIONS
    // ============================================
    const renderWithdrawalRequests = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>💳 Withdrawal Requests</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead><tr><th>Vendor</th><th>Shop</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {withdrawalRequests.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>No withdrawal requests found.</td></tr>
                        ) : (
                            withdrawalRequests.map((w) => (
                                <tr key={w.id}>
                                    <td>{w.vendorName}</td>
                                    <td>{w.shopName}</td>
                                    <td><strong>PKR {w.amount.toLocaleString()}</strong></td>
                                    <td>{w.method}</td>
                                    <td>{w.requestedAt}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${w.status === 'approved' ? styles.statusApproved : w.status === 'rejected' ? styles.statusRejected : w.status === 'processed' ? styles.statusApproved : styles.statusPending}`}>
                                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        {w.status === 'pending' && (
                                            <>
                                                <button className={styles.successBtn} onClick={() => handleWithdrawalStatus(w.id, 'approved')} style={{ marginRight: '5px' }}>Approve</button>
                                                <button className={styles.dangerBtn} onClick={() => handleWithdrawalStatus(w.id, 'rejected')}>Reject</button>
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
                    <thead><tr><th>Vendor</th><th>Shop</th><th>Plan</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {subscriptionRequests.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>No subscription requests found.</td></tr>
                        ) : (
                            subscriptionRequests.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.vendorName}</td>
                                    <td>{s.shopName}</td>
                                    <td><span className={styles.statusBadge} style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>{s.planType.charAt(0).toUpperCase() + s.planType.slice(1)}</span></td>
                                    <td><strong>PKR {s.amount.toLocaleString()}</strong></td>
                                    <td>{s.requestedAt}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${s.status === 'approved' ? styles.statusApproved : s.status === 'rejected' ? styles.statusRejected : styles.statusPending}`}>
                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        {s.status === 'pending' && (
                                            <>
                                                <button className={styles.successBtn} onClick={() => handleSubscriptionStatus(s.id, 'approved')} style={{ marginRight: '5px' }}>Approve</button>
                                                <button className={styles.dangerBtn} onClick={() => handleSubscriptionStatus(s.id, 'rejected')}>Reject</button>
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
                <button className={styles.primaryBtn} onClick={() => setShowAddEmployee(true)}>+ Add Employee</button>
            </div>
            <div className={styles.employeeGrid}>
                {adminEmployees.map((emp) => (
                    <div key={emp.id} className={styles.employeeCard}>
                        <div className={styles.employeeIcon}>👤</div>
                        <div className={styles.employeeName}>{emp.name}</div>
                        <div className={styles.employeeRole}>{emp.role}</div>
                        <div className={styles.employeeEmail}>{emp.email}</div>
                        <button className={styles.dangerBtn} onClick={() => handleDeleteEmployee(emp.id)}>Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCommissionTypes = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>💰 Commission Rules</h2>
                <button className={styles.primaryBtn} onClick={() => setShowAddCommission(true)}>+ Add Rule</button>
            </div>
            <div className={styles.commissionGrid}>
                {commissionTypes.map((c) => (
                    <div key={c.id} className={styles.commissionCard}>
                        <div><div className={styles.commissionName}>{c.name}</div><div className={styles.commissionDesc}>{c.description}</div></div>
                        <div className={styles.commissionValue}>{c.value}</div>
                        <button className={styles.dangerBtn} onClick={() => handleDeleteCommission(c.id)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCoupons = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>🎟️ Coupons</h2>
                <button className={styles.primaryBtn} onClick={() => setShowAddCoupon(true)}>+ Create Coupon</button>
            </div>
            <div className={styles.couponGrid}>
                {coupons.map((cp) => (
                    <div key={cp.id} className={styles.couponCard}>
                        <div className={styles.couponCode}>{cp.code}</div>
                        <div className={styles.couponDiscount}>{cp.discount} Off</div>
                        <div className={styles.couponExpiry}>Expires: {cp.expiry}</div>
                        <div className={styles.couponExpiry}>Used: {cp.usage} times</div>
                        <button className={styles.dangerBtn} onClick={() => handleDeleteCoupon(cp.id)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAnnouncements = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>📢 Announcements</h2>
                <button className={styles.primaryBtn} onClick={() => setShowAddAnnouncement(true)}>+ Send Announcement</button>
            </div>
            {announcements.map((an) => (
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
    );

    const renderCustomers = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>👥 Customers</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
                    <tbody>
                        {customers.map((c) => (
                            <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td><span className={`${styles.statusBadge} ${styles.statusApproved}`}>{c.status || 'Active'}</span></td></tr>
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
                    <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
                    <tbody>
                        {riders.map((r) => (
                            <tr key={r.id}><td>{r.name}</td><td>{r.email}</td><td><span className={`${styles.statusBadge} ${styles.statusApproved}`}>{r.status || 'Active'}</span></td></tr>
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
                        <div className={styles.formGroup}><label className={styles.formLabel}>Name</label><input type="text" className={styles.formInput} required value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })} /></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Email</label><input type="email" className={styles.formInput} required value={employeeForm.email} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })} /></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Role</label><select className={styles.formSelect} value={employeeForm.role} onChange={e => setEmployeeForm({ ...employeeForm, role: e.target.value })}><option>Vendor Manager</option><option>Product Moderator</option><option>Order Manager</option><option>Finance Manager</option><option>Support Manager</option></select></div>
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
                        <div className={styles.formGroup}><label className={styles.formLabel}>Coupon Code</label><input type="text" className={styles.formInput} placeholder="e.g., FLAT20" required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} /></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Type</label><select className={styles.formSelect} value={couponForm.type} onChange={e => setCouponForm({ ...couponForm, type: e.target.value as 'percentage' | 'fixed' })}><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Discount</label><input type="text" className={styles.formInput} placeholder="15% or 150" required value={couponForm.discount} onChange={e => setCouponForm({ ...couponForm, discount: e.target.value })} /></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Expiry</label><input type="date" className={styles.formInput} required value={couponForm.expiry} onChange={e => setCouponForm({ ...couponForm, expiry: e.target.value })} /></div>
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
                        <div className={styles.formGroup}><label className={styles.formLabel}>Title</label><input type="text" className={styles.formInput} required value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} /></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Content</label><textarea className={styles.formTextarea} rows={4} required value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} /></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Audience</label><select className={styles.formSelect} value={announcementForm.audience} onChange={e => setAnnouncementForm({ ...announcementForm, audience: e.target.value as 'all' | 'vendors' | 'customers' | 'riders' })}><option value="all">All Users</option><option value="vendors">Vendors</option><option value="customers">Customers</option><option value="riders">Riders</option></select></div>
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
                        <div className={styles.formGroup}><label className={styles.formLabel}>Name</label><input type="text" className={styles.formInput} required value={commissionForm.name} onChange={e => setCommissionForm({ ...commissionForm, name: e.target.value })} /></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Type</label><select className={styles.formSelect} value={commissionForm.type} onChange={e => setCommissionForm({ ...commissionForm, type: e.target.value as 'percentage' | 'fixed' })}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Value</label><input type="text" className={styles.formInput} placeholder="e.g., 2% or PKR 20" required value={commissionForm.value} onChange={e => setCommissionForm({ ...commissionForm, value: e.target.value })} /></div>
                        <div className={styles.formGroup}><label className={styles.formLabel}>Description</label><input type="text" className={styles.formInput} required value={commissionForm.description} onChange={e => setCommissionForm({ ...commissionForm, description: e.target.value })} /></div>
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
            <div className={styles.sidebar}>
                <div className={styles.logo}>⚙️ Admin Panel</div>
                <ul className={styles.menu}>
                    <li className={activeTab === 'dashboard' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('dashboard')}>Dashboard</li>
                    <li className={activeTab === 'vendors' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('vendors')}>Vendors</li>
                    <li className={activeTab === 'customers' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('customers')}>Customers</li>
                    <li className={activeTab === 'riders' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('riders')}>Riders</li>
                    <li className={activeTab === 'employees' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('employees')}>Employees</li>
                    <li className={activeTab === 'commission' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('commission')}>Commission</li>
                    <li className={activeTab === 'coupons' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('coupons')}>Coupons</li>
                    <li className={activeTab === 'announcements' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('announcements')}>Announcements</li>
                    <li className={activeTab === 'withdrawals' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('withdrawals')}>Withdrawals</li>
                    <li className={activeTab === 'subscriptions' ? styles.menuItemActive : styles.menuItem} onClick={() => setActiveTab('subscriptions')}>Subscriptions</li>
                </ul>
            </div>

            <div className={styles.main}>
                {activeTab === 'dashboard' && renderDashboard()}
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

            {renderAddEmployeeModal()}
            {renderAddCouponModal()}
            {renderAddAnnouncementModal()}
            {renderAddCommissionModal()}
            {renderVendorDetailModal()}
            {renderEditModal()}
            {renderAddVendorModal()}
        </div>
    );
}