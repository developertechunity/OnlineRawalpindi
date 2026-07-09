// app/dashboard/admin/page.tsx

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
    businessType?: string;
    businessSubtypes?: string[];
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
    businessId?: string;
    businessName?: string;
    businessEmail?: string;
    plan?: string;
    paymentMethod?: string;
    accountNumber?: string;
    accountHolderName?: string;
    phoneNumber?: string;
    bankName?: string;
    notes?: string;
    createdAt?: string;
    vendorEmail?: string;
    vendorPhone?: string;
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

interface BusinessType {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
}

interface BusinessSubtype {
    _id: string;
    name: string;
    slug: string;
    businessTypeId: string;
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
    const [editTab, setEditTab] = useState<'personal' | 'business'>('personal');
    
    const [dashboardFilter, setDashboardFilter] = useState<{
        type: 'vendors' | 'customers' | 'riders' | 'employees' | null;
        status: 'all' | 'active' | 'pending' | 'blocklist' | null;
    }>({ type: null, status: null });
    const [showFilteredData, setShowFilteredData] = useState(false);

    const [currentTime, setCurrentTime] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pageSizeOptions] = useState([10, 20, 50, 70, 100, 200, 500, 1000]);

    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [addVendorLoading, setAddVendorLoading] = useState(false);
    const [addVendorMessage, setAddVendorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [addTab, setAddTab] = useState<'personal' | 'business'>('personal');

    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [businessSubtypes, setBusinessSubtypes] = useState<BusinessSubtype[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string>('');
    const [selectedSubtypeIds, setSelectedSubtypeIds] = useState<string[]>([]);
    const [showOtherSubtype, setShowOtherSubtype] = useState(false);
    const [otherSubtypeName, setOtherSubtypeName] = useState('');

    const [addVendorForm, setAddVendorForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        shopName: '',
        shopAddress: '',
        ntnNumber: '',
        whatsapp: '',
        city: '',
        country: '',
        streetAddress: '',
        businessPhone: '',
        businessWhatsapp: '',
        businessLandline: '',
        businessEmail: '',
        businessCity: '',
        businessCountry: '',
        businessNtn: '',
        businessWebsite: '',
        socialLink: '',
        mapLocation: '',
        businessTimings: '',
        businessType: '',
        businessSubtypes: [] as string[],
    });

    const [addCnicFront, setAddCnicFront] = useState<File | null>(null);
    const [addCnicBack, setAddCnicBack] = useState<File | null>(null);
    const [addBusinessLicense, setAddBusinessLicense] = useState<File | null>(null);
    const [addBusinessLogo, setAddBusinessLogo] = useState<File | null>(null);
    const [addCoverImage, setAddCoverImage] = useState<File | null>(null);
    const [addGalleryImages, setAddGalleryImages] = useState<File[]>([]);

    const [addCnicFrontPreview, setAddCnicFrontPreview] = useState<string>('');
    const [addCnicBackPreview, setAddCnicBackPreview] = useState<string>('');
    const [addBusinessLicensePreview, setAddBusinessLicensePreview] = useState<string>('');
    const [addBusinessLogoPreview, setAddBusinessLogoPreview] = useState<string>('');
    const [addCoverImagePreview, setAddCoverImagePreview] = useState<string>('');
    const [addGalleryPreviews, setAddGalleryPreviews] = useState<string[]>([]);

    const [editForm, setEditForm] = useState({
        shopName: '',
        ownerName: '',
        email: '',
        phone: '',
        shopAddress: '',
        ntnNumber: '',
        whatsapp: '',
        city: '',
        country: '',
        streetAddress: '',
        businessPhone: '',
        businessWhatsapp: '',
        businessLandline: '',
        businessEmail: '',
        businessCity: '',
        businessCountry: '',
        businessNtn: '',
        businessWebsite: '',
        socialLink: '',
        mapLocation: '',
        businessTimings: '',
        businessType: '',
    });
    
    const [editCnicFront, setEditCnicFront] = useState<File | null>(null);
    const [editCnicBack, setEditCnicBack] = useState<File | null>(null);
    const [editBusinessLicense, setEditBusinessLicense] = useState<File | null>(null);
    const [editBusinessLogo, setEditBusinessLogo] = useState<File | null>(null);
    const [editCoverImage, setEditCoverImage] = useState<File | null>(null);
    const [editGalleryImages, setEditGalleryImages] = useState<File[]>([]);
    
    const [editCnicFrontPreview, setEditCnicFrontPreview] = useState<string>('');
    const [editCnicBackPreview, setEditCnicBackPreview] = useState<string>('');
    const [editBusinessLicensePreview, setEditBusinessLicensePreview] = useState<string>('');
    const [editBusinessLogoPreview, setEditBusinessLogoPreview] = useState<string>('');
    const [editCoverImagePreview, setEditCoverImagePreview] = useState<string>('');
    const [editGalleryPreviews, setEditGalleryPreviews] = useState<string[]>([]);
    
    const [existingCnicFront, setExistingCnicFront] = useState<string>('');
    const [existingCnicBack, setExistingCnicBack] = useState<string>('');
    const [existingBusinessLicense, setExistingBusinessLicense] = useState<string>('');
    const [existingBusinessLogo, setExistingBusinessLogo] = useState<string>('');
    const [existingCoverImage, setExistingCoverImage] = useState<string>('');
    const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [adminEmployees, setAdminEmployees] = useState<AdminEmployee[]>([]);
    const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
    const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);

    const [showAddCoupon, setShowAddCoupon] = useState(false);
    const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showAddCommission, setShowAddCommission] = useState(false);

    const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', role: 'Vendor Manager' });
    const [couponForm, setCouponForm] = useState({ code: '', type: 'percentage' as const, discount: '', expiry: '' });
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', audience: 'all' as const });
    const [commissionForm, setCommissionForm] = useState({ name: '', type: 'percentage' as const, value: '', description: '' });

    const API_URL = 'http://localhost:5002';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleLogout = useCallback(() => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            router.push('/auth/login');
        }
    }, [router]);

    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return "";
        if (imagePath.startsWith("http")) return imagePath;
        const cleanPath = imagePath
            .replace(/\\/g, "/")
            .replace(/^\/+/, "")
            .replace(/^uploads\/+/, "");
        return `${API_URL}/uploads/${cleanPath}`;
    };

    const fetchBusinessTypes = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await axios.get(`${API_URL}/api/auth/business/types`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setBusinessTypes(response.data.data || []);
            }
        } catch (error: any) {
            console.error('❌ Error fetching business types:', error.message);
        }
    }, [API_URL]);

    const fetchSubtypesByType = useCallback(async (typeId: string) => {
        if (!typeId) {
            setBusinessSubtypes([]);
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await axios.get(`${API_URL}/api/auth/business/subtypes/${typeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setBusinessSubtypes(response.data.data || []);
            }
        } catch (error: any) {
            console.error('❌ Error fetching subtypes:', error.message);
        }
    }, [API_URL]);

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
            formData.append('whatsapp', addVendorForm.whatsapp || '');
            formData.append('city', addVendorForm.city || '');
            formData.append('country', addVendorForm.country || '');
            formData.append('streetAddress', addVendorForm.streetAddress || '');
            
            formData.append('shopName', addVendorForm.shopName);
            formData.append('shopAddress', addVendorForm.shopAddress);
            formData.append('ntnNumber', addVendorForm.ntnNumber || '');
            formData.append('businessPhone', addVendorForm.businessPhone || '');
            formData.append('businessWhatsapp', addVendorForm.businessWhatsapp || '');
            formData.append('businessLandline', addVendorForm.businessLandline || '');
            formData.append('businessEmail', addVendorForm.businessEmail || '');
            formData.append('businessCity', addVendorForm.businessCity || '');
            formData.append('businessCountry', addVendorForm.businessCountry || '');
            formData.append('businessNtn', addVendorForm.businessNtn || '');
            formData.append('businessWebsite', addVendorForm.businessWebsite || '');
            formData.append('socialLink', addVendorForm.socialLink || '');
            formData.append('mapLocation', addVendorForm.mapLocation || '');
            formData.append('businessTimings', addVendorForm.businessTimings || '');
            formData.append('businessType', addVendorForm.businessType || '');
            formData.append('businessSubtypes', JSON.stringify(selectedSubtypeIds));
            if (showOtherSubtype && otherSubtypeName) {
                formData.append('otherSubtype', otherSubtypeName);
            }
            
            if (addCnicFront) formData.append('cnicFront', addCnicFront);
            if (addCnicBack) formData.append('cnicBack', addCnicBack);
            if (addBusinessLicense) formData.append('businessLicense', addBusinessLicense);
            if (addBusinessLogo) formData.append('businessLogo', addBusinessLogo);
            if (addCoverImage) formData.append('coverImage', addCoverImage);
            addGalleryImages.forEach(file => formData.append('galleryImages', file));

            const response = await axios.post(
                `${API_URL}/api/auth/register`,
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );

            if (response.data.success && response.data.user && response.data.user.vendorId) {
                let vendorId = response.data.user.vendorId;
                vendorId = vendorId.replace(/V-0+/, 'V-');
                
                if (vendorId !== response.data.user.vendorId) {
                    const userId = response.data.user.id || response.data.user._id;
                    try {
                        await axios.put(
                            `${API_URL}/api/auth/vendor/${userId}/vendor-id`,
                            { vendorId },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        console.log(`✅ Vendor ID fixed: ${response.data.user.vendorId} -> ${vendorId}`);
                    } catch (fixError) {
                        console.warn('⚠️ Could not fix vendor ID in database, but vendor was created:', fixError);
                    }
                }
            }

            setAddVendorMessage({ type: 'success', text: '✅ Vendor added successfully! Pending admin approval.' });
            
            setAddVendorForm({
                name: '',
                email: '',
                phone: '',
                password: '',
                shopName: '',
                shopAddress: '',
                ntnNumber: '',
                whatsapp: '',
                city: '',
                country: '',
                streetAddress: '',
                businessPhone: '',
                businessWhatsapp: '',
                businessLandline: '',
                businessEmail: '',
                businessCity: '',
                businessCountry: '',
                businessNtn: '',
                businessWebsite: '',
                socialLink: '',
                mapLocation: '',
                businessTimings: '',
                businessType: '',
                businessSubtypes: [],
            });
            setSelectedTypeId('');
            setSelectedSubtypeIds([]);
            setShowOtherSubtype(false);
            setOtherSubtypeName('');
            setBusinessSubtypes([]);
            setAddCnicFront(null);
            setAddCnicBack(null);
            setAddBusinessLicense(null);
            setAddBusinessLogo(null);
            setAddCoverImage(null);
            setAddGalleryImages([]);
            setAddCnicFrontPreview('');
            setAddCnicBackPreview('');
            setAddBusinessLicensePreview('');
            setAddBusinessLogoPreview('');
            setAddCoverImagePreview('');
            setAddGalleryPreviews([]);
            setAddTab('personal');
            
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

    const totalItems = filteredVendors.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const paginatedVendors = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredVendors.slice(startIndex, endIndex);
    }, [filteredVendors, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, itemsPerPage]);

    const totalVendors = vendors.length;
    const activeVendors = vendors.filter(v => v.status === 'approved').length;
    const pendingVendors = vendors.filter(v => v.status === 'pending').length;
    const rejectedVendors = vendors.filter(v => v.status === 'rejected').length;

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active' || c.status === 'approved').length;
    const pendingCustomers = customers.filter(c => c.status === 'pending').length;
    const rejectedCustomers = customers.filter(c => c.status === 'rejected' || c.status === 'blocked').length;

    const totalRiders = riders.length;
    const activeRiders = riders.filter(r => r.status === 'approved' || r.status === 'active').length;
    const pendingRiders = riders.filter(r => r.status === 'pending').length;
    const rejectedRiders = riders.filter(r => r.status === 'rejected' || r.status === 'blocked').length;

    const totalEmployees = adminEmployees.length;
    const activeEmployees = adminEmployees.filter(e => e.role !== 'inactive').length;
    const pendingEmployees = adminEmployees.filter(e => e.role === 'pending').length;
    const rejectedEmployees = adminEmployees.filter(e => e.role === 'rejected' || e.role === 'blocked').length;

    const handleStatClick = (type: 'vendors' | 'customers' | 'riders' | 'employees', status: 'all' | 'active' | 'pending' | 'blocklist') => {
        setDashboardFilter({ type, status });
        setShowFilteredData(true);
        setActiveTab('dashboard');
    };

    const clearDashboardFilter = () => {
        setDashboardFilter({ type: null, status: null });
        setShowFilteredData(false);
    };

    const getFilteredData = useCallback(() => {
        if (!dashboardFilter.type || !dashboardFilter.status) return [];

        let data: any[] = [];
        switch (dashboardFilter.type) {
            case 'vendors':
                data = vendors;
                break;
            case 'customers':
                data = customers;
                break;
            case 'riders':
                data = riders;
                break;
            case 'employees':
                data = adminEmployees;
                break;
            default:
                return [];
        }

        if (dashboardFilter.status === 'all') return data;
        
        return data.filter(item => {
            const status = item.status || item.approvalStatus || item.role || 'active';
            if (dashboardFilter.status === 'active') {
                return status === 'approved' || status === 'active';
            }
            if (dashboardFilter.status === 'pending') {
                return status === 'pending';
            }
            if (dashboardFilter.status === 'blocklist') {
                return status === 'rejected' || status === 'blocked' || status === 'inactive';
            }
            return true;
        });
    }, [dashboardFilter, vendors, customers, riders, adminEmployees]);

    const filteredDashboardData = getFilteredData();

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

    // ✅ ONLY fetch Business subscriptions (Global subscriptions removed from frontend)
    const fetchSubscriptions = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            console.log('📋 [ADMIN] Fetching business subscriptions...');
            
            const response = await axios.get(`${API_URL}/api/auth/business-subscriptions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('📋 Business subscriptions response:', response.data);
            
            if (response.data?.success && response.data?.requests) {
                setSubscriptionRequests(response.data.requests);
                console.log('✅ Business subscriptions loaded:', response.data.requests.length);
            } else {
                setSubscriptionRequests([]);
                console.log('ℹ️ No business subscriptions found');
            }
            
        } catch (error: any) {
            console.error('❌ Subscriptions error:', error.message);
            setSubscriptionRequests([]);
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
            await fetchBusinessTypes();

        } catch (error: any) {
            console.error("Error loading dashboard data:", error.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL, router, fetchWithdrawals, fetchSubscriptions, fetchBusinessTypes]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            setLoading(false);
            return;
        }
        loadAllDashboardData();
    }, [router, loadAllDashboardData]);

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

    const handleEditVendor = useCallback((vendor: Vendor) => {
        setEditingVendor(vendor);
        setEditTab('personal');
        setEditForm({
            shopName: vendor.shopName || '',
            ownerName: vendor.ownerName || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            shopAddress: vendor.shopAddress || '',
            ntnNumber: vendor.ntnNumber || '',
            whatsapp: vendor.whatsapp || '',
            city: vendor.city || '',
            country: vendor.country || '',
            streetAddress: vendor.streetAddress || '',
            businessPhone: vendor.businessPhone || '',
            businessWhatsapp: vendor.businessWhatsapp || '',
            businessLandline: vendor.businessLandline || '',
            businessEmail: vendor.businessEmail || '',
            businessCity: vendor.businessCity || '',
            businessCountry: vendor.businessCountry || '',
            businessNtn: vendor.businessNtn || '',
            businessWebsite: vendor.businessWebsite || '',
            socialLink: vendor.socialLink || '',
            mapLocation: vendor.mapLocation || '',
            businessTimings: vendor.businessTimings || '',
            businessType: vendor.businessType || '',
        });
        
        setExistingCnicFront(vendor.cnicFront || '');
        setExistingCnicBack(vendor.cnicBack || '');
        setExistingBusinessLicense(vendor.businessLicense || '');
        setExistingBusinessLogo(vendor.businessLogo || '');
        setExistingCoverImage(vendor.coverImage || '');
        setExistingGalleryImages(vendor.galleryImages || []);
        
        setEditCnicFront(null);
        setEditCnicBack(null);
        setEditBusinessLicense(null);
        setEditBusinessLogo(null);
        setEditCoverImage(null);
        setEditGalleryImages([]);
        setEditCnicFrontPreview('');
        setEditCnicBackPreview('');
        setEditBusinessLicensePreview('');
        setEditBusinessLogoPreview('');
        setEditCoverImagePreview('');
        setEditGalleryPreviews([]);
        
        setShowEditModal(true);
    }, []);

    const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void, setPreview: (preview: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleEditGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setEditGalleryImages(prev => [...prev, ...fileArray]);
            const previews = fileArray.map(file => URL.createObjectURL(file));
            setEditGalleryPreviews(prev => [...prev, ...previews]);
        }
    };

    const removeEditGalleryImage = (index: number) => {
        setEditGalleryImages(prev => prev.filter((_, i) => i !== index));
        setEditGalleryPreviews(prev => prev.filter((_, i) => i !== index));
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
            formData.append('whatsapp', editForm.whatsapp);
            formData.append('city', editForm.city);
            formData.append('country', editForm.country);
            formData.append('streetAddress', editForm.streetAddress);
            
            formData.append('businessPhone', editForm.businessPhone);
            formData.append('businessWhatsapp', editForm.businessWhatsapp);
            formData.append('businessLandline', editForm.businessLandline);
            formData.append('businessEmail', editForm.businessEmail);
            formData.append('businessCity', editForm.businessCity);
            formData.append('businessCountry', editForm.businessCountry);
            formData.append('businessNtn', editForm.businessNtn);
            formData.append('businessWebsite', editForm.businessWebsite);
            formData.append('socialLink', editForm.socialLink);
            formData.append('mapLocation', editForm.mapLocation);
            formData.append('businessTimings', editForm.businessTimings);
            formData.append('businessType', editForm.businessType);
            
            if (editCnicFront) formData.append('cnicFront', editCnicFront);
            if (editCnicBack) formData.append('cnicBack', editCnicBack);
            if (editBusinessLicense) formData.append('businessLicense', editBusinessLicense);
            if (editBusinessLogo) formData.append('businessLogo', editBusinessLogo);
            if (editCoverImage) formData.append('coverImage', editCoverImage);
            editGalleryImages.forEach(file => formData.append('galleryImages', file));

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
    }, [API_URL, editingVendor, editForm, editCnicFront, editCnicBack, editBusinessLicense, editBusinessLogo, editCoverImage, editGalleryImages, loadAllDashboardData]);

    const handleViewVendor = useCallback((vendor: Vendor) => {
        setSelectedVendor(vendor);
        setVendorDetailTab('personal');
        setShowVendorDetail(true);
    }, []);

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

    // ✅ ✅ ✅ FIXED: Business Subscription Approve/Reject with proper error handling
    const handleBusinessSubscriptionStatus = useCallback(async (requestId: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${status} this business subscription request?`)) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Session expired. Please login again.');
                return;
            }
            
            let reason = '';
            if (status === 'rejected') {
                reason = prompt('Reason for rejection:') || 'No reason provided';
            }
            
            // ✅ For reject, we send reason in body
            const endpoint = status === 'approved' ? 'approve' : 'reject';
            const payload = status === 'rejected' ? { reason } : {};
            
            console.log(`📋 [ADMIN] ${status} business subscription: ${requestId} -> endpoint: ${endpoint}`);
            console.log(`📋 Payload:`, payload);
            
            const response = await axios.put(
                `${API_URL}/api/auth/business-subscription/${requestId}/${endpoint}`,
                payload,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            console.log('📋 Response:', response.data);

            if (response.data.success) {
                alert(`✅ Business subscription ${status} successfully!`);
                fetchSubscriptions();
                loadAllDashboardData();
            } else {
                alert(`❌ Error: ${response.data.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('❌ Error updating business subscription:', error);
            console.error('❌ Error response:', error.response?.data);
            
            let errorMsg = 'Failed to update business subscription';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.status === 404) {
                errorMsg = 'Subscription request not found. Please refresh and try again.';
            } else if (error.response?.status === 401) {
                errorMsg = 'Unauthorized. Please login again.';
            } else if (error.response?.status === 500) {
                errorMsg = 'Server error. Please check backend logs.';
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            alert(`❌ Error: ${errorMsg}`);
        }
    }, [API_URL, fetchSubscriptions, loadAllDashboardData]);

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
    // RENDER ADD VENDOR MODAL
    // ============================================
    const renderAddVendorModal = () => {
        if (!showAddVendorModal) return null;

        return (
            <div className={styles.modalOverlay} onClick={() => setShowAddVendorModal(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>➕ Add Vendor</h3>
                        <button className={styles.modalClose} onClick={() => setShowAddVendorModal(false)}>×</button>
                    </div>

                    {addVendorMessage && (
                        <div className={addVendorMessage.type === 'error' ? styles.messageError : styles.messageSuccess} style={{ marginBottom: '15px' }}>
                            {addVendorMessage.text}
                        </div>
                    )}

                    <div className={styles.detailTabs}>
                        <button 
                            className={`${styles.detailTab} ${addTab === 'personal' ? styles.detailTabActive : ''}`}
                            onClick={() => setAddTab('personal')}
                        >
                            👤 Personal Info
                        </button>
                        <button 
                            className={`${styles.detailTab} ${addTab === 'business' ? styles.detailTabActive : ''}`}
                            onClick={() => setAddTab('business')}
                        >
                            🏪 Business Info
                        </button>
                    </div>

                    <form onSubmit={handleAddVendorSubmit}>
                        {addTab === 'personal' && (
                            <div className={styles.detailTabContent}>
                                <div className={styles.editDivider}><span>👤 Personal Information</span></div>
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

                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Street Address</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter street address"
                                            value={addVendorForm.streetAddress}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, streetAddress: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>City</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter city"
                                            value={addVendorForm.city}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, city: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Country</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter country"
                                            value={addVendorForm.country}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, country: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>WhatsApp Number</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter WhatsApp number"
                                            value={addVendorForm.whatsapp}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, whatsapp: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>CNIC Number</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter CNIC number"
                                            value={addVendorForm.ntnNumber}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, ntnNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className={styles.editDivider}><span>📄 Documents</span></div>

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
                            </div>
                        )}

                        {addTab === 'business' && (
                            <div className={styles.detailTabContent}>
                                <div className={styles.editDivider}><span>🏪 Business Information</span></div>
                                <div className={styles.editGrid}>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
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

                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Business Category *</label>
                                        <select
                                            className={styles.formSelect}
                                            value={addVendorForm.businessType}
                                            onChange={(e) => {
                                                const typeId = e.target.value;
                                                setAddVendorForm({ ...addVendorForm, businessType: typeId, businessSubtypes: [] });
                                                setSelectedTypeId(typeId);
                                                setSelectedSubtypeIds([]);
                                                if (typeId) {
                                                    fetchSubtypesByType(typeId);
                                                } else {
                                                    setBusinessSubtypes([]);
                                                }
                                            }}
                                        >
                                            <option value="">Select Business Category</option>
                                            {businessTypes.map((type) => (
                                                <option key={type._id} value={type._id}>
                                                    {type.icon || '📌'} {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {businessSubtypes.length > 0 && (
                                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                            <label className={styles.formLabel}>Sub Categories (Select multiple)</label>
                                            <div className={styles.subtypeGrid}>
                                                {businessSubtypes.map((sub) => (
                                                    <div key={sub._id} className={styles.subtypeOption}>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSubtypeIds.includes(sub._id)}
                                                                onChange={() => {
                                                                    setSelectedSubtypeIds(prev =>
                                                                        prev.includes(sub._id)
                                                                            ? prev.filter(id => id !== sub._id)
                                                                            : [...prev, sub._id]
                                                                    );
                                                                    setAddVendorForm({
                                                                        ...addVendorForm,
                                                                        businessSubtypes: selectedSubtypeIds.includes(sub._id)
                                                                            ? addVendorForm.businessSubtypes.filter(id => id !== sub._id)
                                                                            : [...addVendorForm.businessSubtypes, sub._id]
                                                                    });
                                                                }}
                                                            />
                                                            {sub.name}
                                                        </label>
                                                    </div>
                                                ))}
                                                <div className={styles.subtypeOption}>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={showOtherSubtype}
                                                            onChange={() => {
                                                                setShowOtherSubtype(!showOtherSubtype);
                                                                if (!showOtherSubtype) {
                                                                    setSelectedSubtypeIds(prev => [...prev, 'other']);
                                                                } else {
                                                                    setSelectedSubtypeIds(prev => prev.filter(id => id !== 'other'));
                                                                    setOtherSubtypeName('');
                                                                }
                                                            }}
                                                        />
                                                        Other
                                                    </label>
                                                </div>
                                            </div>
                                            {showOtherSubtype && (
                                                <input
                                                    type="text"
                                                    className={styles.formInput}
                                                    placeholder="Specify other category"
                                                    value={otherSubtypeName}
                                                    onChange={(e) => setOtherSubtypeName(e.target.value)}
                                                    style={{ marginTop: '10px' }}
                                                />
                                            )}
                                            {selectedSubtypeIds.length > 0 && (
                                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#4a6cf7' }}>
                                                    ✅ {selectedSubtypeIds.length} sub-categorie(s) selected
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business NTN</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter business NTN"
                                            value={addVendorForm.businessNtn}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, businessNtn: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Phone</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter business phone"
                                            value={addVendorForm.businessPhone}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, businessPhone: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business WhatsApp</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter business WhatsApp"
                                            value={addVendorForm.businessWhatsapp}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, businessWhatsapp: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Landline</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter business landline"
                                            value={addVendorForm.businessLandline}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, businessLandline: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Email</label>
                                        <input
                                            type="email"
                                            className={styles.formInput}
                                            placeholder="Enter business email"
                                            value={addVendorForm.businessEmail}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, businessEmail: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business City</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter business city"
                                            value={addVendorForm.businessCity}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, businessCity: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Country</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter business country"
                                            value={addVendorForm.businessCountry}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, businessCountry: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Business Website</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter business website"
                                            value={addVendorForm.businessWebsite}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, businessWebsite: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Social Link</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter social link"
                                            value={addVendorForm.socialLink}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, socialLink: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Map Location</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Enter map location URL"
                                            value={addVendorForm.mapLocation}
                                            onChange={(e) => setAddVendorForm({ ...addVendorForm, mapLocation: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className={styles.editDivider}><span>🕐 Business Timings</span></div>
                                <div className={styles.formGroup}>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 10AM-2PM"
                                        value={addVendorForm.businessTimings}
                                        onChange={(e) => setAddVendorForm({ ...addVendorForm, businessTimings: e.target.value })}
                                    />
                                </div>

                                <div className={styles.editDivider}><span>🖼️ Business Media</span></div>
                                
                                <div className={styles.editGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Logo</label>
                                        <div className={styles.uploadBoxModern}>
                                            <label className={styles.uploadLabelModern}>
                                                <span className={styles.uploadIconModern}>🖼️</span>
                                                {addBusinessLogoPreview ? 'Change Logo' : 'Upload Logo'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleAddVendorFileChange(e, setAddBusinessLogo, setAddBusinessLogoPreview)}
                                                    className={styles.uploadInput}
                                                />
                                            </label>
                                            {addBusinessLogoPreview && (
                                                <div className={styles.previewContainerModern}>
                                                    <img src={addBusinessLogoPreview} alt="Business Logo" className={styles.previewImageModern} />
                                                    <button type="button" className={styles.removeBtnModern} onClick={() => removeAddVendorFile(setAddBusinessLogo, setAddBusinessLogoPreview)}>
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Cover Image</label>
                                        <div className={styles.uploadBoxModern}>
                                            <label className={styles.uploadLabelModern}>
                                                <span className={styles.uploadIconModern}>🖼️</span>
                                                {addCoverImagePreview ? 'Change Cover' : 'Upload Cover'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleAddVendorFileChange(e, setAddCoverImage, setAddCoverImagePreview)}
                                                    className={styles.uploadInput}
                                                />
                                            </label>
                                            {addCoverImagePreview && (
                                                <div className={styles.previewContainerModern}>
                                                    <img src={addCoverImagePreview} alt="Cover Image" className={styles.previewImageModern} />
                                                    <button type="button" className={styles.removeBtnModern} onClick={() => removeAddVendorFile(setAddCoverImage, setAddCoverImagePreview)}>
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Gallery Images</label>
                                    <div className={styles.uploadBoxModern}>
                                        <label className={styles.uploadLabelModern}>
                                            <span className={styles.uploadIconModern}>🖼️</span>
                                            Upload Gallery Images
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => {
                                                    const files = e.target.files;
                                                    if (files) {
                                                        const fileArray = Array.from(files);
                                                        setAddGalleryImages(prev => [...prev, ...fileArray]);
                                                        const previews = fileArray.map(file => URL.createObjectURL(file));
                                                        setAddGalleryPreviews(prev => [...prev, ...previews]);
                                                    }
                                                }}
                                                className={styles.uploadInput}
                                            />
                                        </label>

                                        {addGalleryPreviews.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                                {addGalleryPreviews.map((preview, idx) => (
                                                    <div key={`add-gallery-${idx}`} style={{ position: 'relative', width: '80px', height: '80px', border: '2px solid #4a6cf7', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <img src={preview} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setAddGalleryImages(prev => prev.filter((_, i) => i !== idx));
                                                                setAddGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
                                                            }} 
                                                            style={{ position: 'absolute', top: '2px', right: '2px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

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

                    {vendorDetailTab === 'business' && (
                        <div className={styles.detailTabContent}>
                            <div className={styles.detailTwoColumn}>
                                <div className={styles.detailColumn}>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business Name</label>
                                        <p className={styles.detailValue}>{selectedVendor.shopName}</p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business Type</label>
                                        <p className={styles.detailValue}>
                                            {selectedVendor.businessType ? (
                                                <span className={styles.businessTypeBadge}>
                                                    {selectedVendor.businessType.charAt(0).toUpperCase() + selectedVendor.businessType.slice(1)}
                                                </span>
                                            ) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label className={styles.detailLabel}>Business NTN</label>
                                        <p className={styles.detailValue}>{selectedVendor.businessNtn || selectedVendor.ntnNumber || 'N/A'}</p>
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
                                    <span>📄 Business License</span>
                                </div>
                                <div className={styles.detailDocumentsGrid} style={{ gridTemplateColumns: '1fr' }}>
                                    <div className={styles.detailDocBox}>
                                        <label className={styles.detailDocLabel}>Business License Document</label>
                                        <div className={styles.detailDocWrapper}>
                                            {businessLicenseUrl ? (
                                                <>
                                                    <img src={businessLicenseUrl} alt="Business License" className={styles.detailDocImage} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                    <a href={businessLicenseUrl} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View Full License</a>
                                                </>
                                            ) : (
                                                <div className={styles.detailDocEmpty}>
                                                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📄</span>
                                                    No business license uploaded
                                                </div>
                                            )}
                                        </div>
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

    const renderEditModal = useCallback(() => {
        if (!showEditModal || !editingVendor) return null;

        const displayCnicFront = editCnicFrontPreview || (existingCnicFront ? getImageUrl(existingCnicFront) : '');
        const displayCnicBack = editCnicBackPreview || (existingCnicBack ? getImageUrl(existingCnicBack) : '');
        const displayBusinessLicense = editBusinessLicensePreview || (existingBusinessLicense ? getImageUrl(existingBusinessLicense) : '');
        const displayBusinessLogo = editBusinessLogoPreview || (existingBusinessLogo ? getImageUrl(existingBusinessLogo) : '');
        const displayCoverImage = editCoverImagePreview || (existingCoverImage ? getImageUrl(existingCoverImage) : '');

        return (
            <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>✏️ Edit Vendor</h3>
                        <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>×</button>
                    </div>

                    <div className={styles.detailTabs}>
                        <button 
                            className={`${styles.detailTab} ${editTab === 'personal' ? styles.detailTabActive : ''}`}
                            onClick={() => setEditTab('personal')}
                        >
                            👤 Personal Info
                        </button>
                        <button 
                            className={`${styles.detailTab} ${editTab === 'business' ? styles.detailTabActive : ''}`}
                            onClick={() => setEditTab('business')}
                        >
                            🏪 Business Info
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit}>
                        {editTab === 'personal' && (
                            <div className={styles.detailTabContent}>
                                <div className={styles.editDivider}><span>👤 Personal Information</span></div>
                                <div className={styles.editGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Full Name *</label>
                                        <input type="text" className={styles.formInput} value={editForm.ownerName} onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Email *</label>
                                        <input type="email" className={styles.formInput} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Phone *</label>
                                        <input type="text" className={styles.formInput} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>WhatsApp Number</label>
                                        <input type="text" className={styles.formInput} value={editForm.whatsapp} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Street Address</label>
                                        <input type="text" className={styles.formInput} value={editForm.streetAddress} onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>City</label>
                                        <input type="text" className={styles.formInput} value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Country</label>
                                        <input type="text" className={styles.formInput} value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>CNIC Number</label>
                                        <input type="text" className={styles.formInput} value={editForm.ntnNumber} onChange={(e) => setEditForm({ ...editForm, ntnNumber: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Shop Address</label>
                                        <input type="text" className={styles.formInput} value={editForm.shopAddress} onChange={(e) => setEditForm({ ...editForm, shopAddress: e.target.value })} />
                                    </div>
                                </div>

                                <div className={styles.editDivider}><span>📄 Documents</span></div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Business License <span className={styles.optionalLabel}>(Optional)</span></label>
                                    <div className={styles.uploadBoxModern}>
                                        <label className={styles.uploadLabelModern}>
                                            <span className={styles.uploadIconModern}>📄</span>
                                            {displayBusinessLicense ? 'Change Business License' : 'Upload Business License'}
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => handleEditFileChange(e, setEditBusinessLicense, setEditBusinessLicensePreview)}
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
                                                    onChange={(e) => handleEditFileChange(e, setEditCnicFront, setEditCnicFrontPreview)}
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
                                                    onChange={(e) => handleEditFileChange(e, setEditCnicBack, setEditCnicBackPreview)}
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
                            </div>
                        )}

                        {editTab === 'business' && (
                            <div className={styles.detailTabContent}>
                                <div className={styles.editDivider}><span>🏪 Business Information</span></div>
                                <div className={styles.editGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Shop Name *</label>
                                        <input type="text" className={styles.formInput} value={editForm.shopName} onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })} required />
                                    </div>

                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Business Type</label>
                                        <select
                                            className={styles.formSelect}
                                            value={editForm.businessType}
                                            onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
                                        >
                                            <option value="">Select Business Type</option>
                                            <option value="retail">🛍️ Retail</option>
                                            <option value="wholesale">📦 Wholesale</option>
                                            <option value="manufacturing">🏭 Manufacturing</option>
                                            <option value="services">💼 Services</option>
                                            <option value="ecommerce">🖥️ E-Commerce</option>
                                            <option value="restaurant">🍽️ Restaurant</option>
                                            <option value="other">📌 Other</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business NTN</label>
                                        <input type="text" className={styles.formInput} value={editForm.businessNtn} onChange={(e) => setEditForm({ ...editForm, businessNtn: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Phone</label>
                                        <input type="text" className={styles.formInput} value={editForm.businessPhone} onChange={(e) => setEditForm({ ...editForm, businessPhone: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business WhatsApp</label>
                                        <input type="text" className={styles.formInput} value={editForm.businessWhatsapp} onChange={(e) => setEditForm({ ...editForm, businessWhatsapp: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Landline</label>
                                        <input type="text" className={styles.formInput} value={editForm.businessLandline} onChange={(e) => setEditForm({ ...editForm, businessLandline: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Email</label>
                                        <input type="email" className={styles.formInput} value={editForm.businessEmail} onChange={(e) => setEditForm({ ...editForm, businessEmail: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business City</label>
                                        <input type="text" className={styles.formInput} value={editForm.businessCity} onChange={(e) => setEditForm({ ...editForm, businessCity: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Country</label>
                                        <input type="text" className={styles.formInput} value={editForm.businessCountry} onChange={(e) => setEditForm({ ...editForm, businessCountry: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Business Website</label>
                                        <input type="text" className={styles.formInput} value={editForm.businessWebsite} onChange={(e) => setEditForm({ ...editForm, businessWebsite: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Social Link</label>
                                        <input type="text" className={styles.formInput} value={editForm.socialLink} onChange={(e) => setEditForm({ ...editForm, socialLink: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Map Location</label>
                                        <input type="text" className={styles.formInput} value={editForm.mapLocation} onChange={(e) => setEditForm({ ...editForm, mapLocation: e.target.value })} />
                                    </div>
                                </div>

                                <div className={styles.editDivider}><span>🕐 Business Timings</span></div>
                                <div className={styles.formGroup}>
                                    <input type="text" className={styles.formInput} placeholder="e.g., Mon-Fri: 9AM-6PM" value={editForm.businessTimings} onChange={(e) => setEditForm({ ...editForm, businessTimings: e.target.value })} />
                                </div>

                                <div className={styles.editDivider}><span>🖼️ Business Media</span></div>
                                
                                <div className={styles.editGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Business Logo</label>
                                        <div className={styles.uploadBoxModern}>
                                            <label className={styles.uploadLabelModern}>
                                                <span className={styles.uploadIconModern}>🖼️</span>
                                                {displayBusinessLogo ? 'Change Logo' : 'Upload Logo'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleEditFileChange(e, setEditBusinessLogo, setEditBusinessLogoPreview)}
                                                    className={styles.uploadInput}
                                                />
                                            </label>
                                            {displayBusinessLogo && (
                                                <div className={styles.previewContainerModern}>
                                                    <img src={displayBusinessLogo} alt="Business Logo" className={styles.previewImageModern} />
                                                    <button type="button" onClick={() => { setEditBusinessLogo(null); setEditBusinessLogoPreview(''); setExistingBusinessLogo(''); }} className={styles.removeBtnModern}>✕</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Cover Image</label>
                                        <div className={styles.uploadBoxModern}>
                                            <label className={styles.uploadLabelModern}>
                                                <span className={styles.uploadIconModern}>🖼️</span>
                                                {displayCoverImage ? 'Change Cover' : 'Upload Cover'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleEditFileChange(e, setEditCoverImage, setEditCoverImagePreview)}
                                                    className={styles.uploadInput}
                                                />
                                            </label>
                                            {displayCoverImage && (
                                                <div className={styles.previewContainerModern}>
                                                    <img src={displayCoverImage} alt="Cover Image" className={styles.previewImageModern} />
                                                    <button type="button" onClick={() => { setEditCoverImage(null); setEditCoverImagePreview(''); setExistingCoverImage(''); }} className={styles.removeBtnModern}>✕</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Gallery Images</label>
                                    <div className={styles.uploadBoxModern}>
                                        <label className={styles.uploadLabelModern}>
                                            <span className={styles.uploadIconModern}>🖼️</span>
                                            Upload Gallery Images
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleEditGalleryChange}
                                                className={styles.uploadInput}
                                            />
                                        </label>
                                        
                                        {existingGalleryImages.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                                {existingGalleryImages.map((img, idx) => (
                                                    <div key={`existing-${idx}`} style={{ position: 'relative', width: '80px', height: '80px', border: '2px solid #e4e9f2', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <img src={getImageUrl(img)} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {editGalleryPreviews.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                                {editGalleryPreviews.map((preview, idx) => (
                                                    <div key={`new-${idx}`} style={{ position: 'relative', width: '80px', height: '80px', border: '2px solid #4a6cf7', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <img src={preview} alt={`New Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button type="button" onClick={() => removeEditGalleryImage(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.editActions}>
                            <button type="submit" className={styles.saveBtn}>💾 Save Changes</button>
                            <button type="button" className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }, [showEditModal, editingVendor, editForm, editTab, 
        existingCnicFront, existingCnicBack, existingBusinessLicense, existingBusinessLogo, existingCoverImage, existingGalleryImages,
        editCnicFrontPreview, editCnicBackPreview, editBusinessLicensePreview, editBusinessLogoPreview, editCoverImagePreview, editGalleryPreviews,
        handleEditSubmit]);

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
                            {totalPages > 5 && currentPage > 3 && (
                                <>
                                    <button className={styles.pageNumBtn} onClick={() => setCurrentPage(1)}>1</button>
                                    <span className={styles.pageDots}>…</span>
                                </>
                            )}

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

                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <>
                                    <span className={styles.pageDots}>…</span>
                                    <button className={styles.pageNumBtn} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
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

    const renderDashboard = () => (
        <>
            <div className={styles.statsGrid}>
                <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('vendors')}>
                    <h3>🏪 Vendors</h3>
                    <p className={styles.statValue}>{totalVendors}</p>
                    <div className={styles.statDetails}>
                        <span 
                            className={styles.statActive} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('vendors', 'all'); }}
                            title="Click to view all vendors"
                        >
                            📊 Total: {totalVendors}
                        </span>
                        <span 
                            className={styles.statActive} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('vendors', 'active'); }}
                            title="Click to view active vendors"
                        >
                            ✅ Active: {activeVendors}
                        </span>
                        <span 
                            className={styles.statPending} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('vendors', 'pending'); }}
                            title="Click to view pending vendors"
                        >
                            ⏳ Pending: {pendingVendors}
                        </span>
                        <span 
                            className={styles.statRejected} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('vendors', 'blocklist'); }}
                            title="Click to view blocked vendors"
                        >
                            🚫 Blocklist: {rejectedVendors}
                        </span>
                    </div>
                </div>

                <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('customers')}>
                    <h3>👥 Customers</h3>
                    <p className={styles.statValue}>{totalCustomers}</p>
                    <div className={styles.statDetails}>
                        <span 
                            className={styles.statActive} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('customers', 'all'); }}
                            title="Click to view all customers"
                        >
                            📊 Total: {totalCustomers}
                        </span>
                        <span 
                            className={styles.statActive} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('customers', 'active'); }}
                            title="Click to view active customers"
                        >
                            ✅ Active: {activeCustomers}
                        </span>
                        <span 
                            className={styles.statPending} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('customers', 'pending'); }}
                            title="Click to view pending customers"
                        >
                            ⏳ Pending: {pendingCustomers}
                        </span>
                        <span 
                            className={styles.statRejected} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('customers', 'blocklist'); }}
                            title="Click to view blocked customers"
                        >
                            🚫 Blocklist: {rejectedCustomers}
                        </span>
                    </div>
                </div>

                <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('riders')}>
                    <h3>🛵 Riders</h3>
                    <p className={styles.statValue}>{totalRiders}</p>
                    <div className={styles.statDetails}>
                        <span 
                            className={styles.statActive} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('riders', 'all'); }}
                            title="Click to view all riders"
                        >
                            📊 Total: {totalRiders}
                        </span>
                        <span 
                            className={styles.statActive} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('riders', 'active'); }}
                            title="Click to view active riders"
                        >
                            ✅ Active: {activeRiders}
                        </span>
                        <span 
                            className={styles.statPending} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('riders', 'pending'); }}
                            title="Click to view pending riders"
                        >
                            ⏳ Pending: {pendingRiders}
                        </span>
                        <span 
                            className={styles.statRejected} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('riders', 'blocklist'); }}
                            title="Click to view blocked riders"
                        >
                            🚫 Blocklist: {rejectedRiders}
                        </span>
                    </div>
                </div>

                <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('employees')}>
                    <h3>👔 Employees</h3>
                    <p className={styles.statValue}>{totalEmployees}</p>
                    <div className={styles.statDetails}>
                        <span 
                            className={styles.statActive} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('employees', 'all'); }}
                            title="Click to view all employees"
                        >
                            📊 Total: {totalEmployees}
                        </span>
                        <span 
                            className={styles.statActive} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('employees', 'active'); }}
                            title="Click to view active employees"
                        >
                            ✅ Active: {activeEmployees}
                        </span>
                        <span 
                            className={styles.statPending} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('employees', 'pending'); }}
                            title="Click to view pending employees"
                        >
                            ⏳ Pending: {pendingEmployees}
                        </span>
                        <span 
                            className={styles.statRejected} 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleStatClick('employees', 'blocklist'); }}
                            title="Click to view blocked employees"
                        >
                            🚫 Blocklist: {rejectedEmployees}
                        </span>
                    </div>
                </div>
            </div>

            {showFilteredData && dashboardFilter.type && dashboardFilter.status && (
                <div className={styles.section} style={{ marginBottom: '20px' }}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            📋 {dashboardFilter.type.charAt(0).toUpperCase() + dashboardFilter.type.slice(1)} 
                            {' '}- {dashboardFilter.status.charAt(0).toUpperCase() + dashboardFilter.status.slice(1)}
                            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6c757d', marginLeft: '10px' }}>
                                ({filteredDashboardData.length} records)
                            </span>
                        </h2>
                        <button 
                            className={styles.secondaryBtn} 
                            onClick={clearDashboardFilter}
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                        >
                            ✕ Close
                        </button>
                    </div>
                    
                    {filteredDashboardData.length === 0 ? (
                        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
                            No {dashboardFilter.status} {dashboardFilter.type} found.
                        </p>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        {dashboardFilter.type === 'vendors' ? (
                                            <>
                                                <th>Vendor ID</th>
                                                <th>Shop Name</th>
                                                <th>Owner</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Registration Date</th>
                                                <th>Status</th>
                                            </>
                                        ) : (
                                            <>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Status</th>
                                                <th>Type</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDashboardData.slice(0, 20).map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td>{index + 1}</td>
                                            {dashboardFilter.type === 'vendors' ? (
                                                <>
                                                    <td><span className={styles.vendorIdBadge}>{item.vendorId || 'N/A'}</span></td>
                                                    <td>{item.shopName || 'N/A'}</td>
                                                    <td>{item.ownerName || item.name || 'N/A'}</td>
                                                    <td>{item.email || 'N/A'}</td>
                                                    <td>{item.phone || 'N/A'}</td>
                                                    <td>{item.date || 'N/A'}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${
                                                            item.status === 'approved' ? styles.statusApproved :
                                                            item.status === 'pending' ? styles.statusPending :
                                                            styles.statusRejected
                                                        }`}>
                                                            {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'N/A'}
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>{item.name || item.shopName || 'N/A'}</td>
                                                    <td>{item.email || 'N/A'}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${
                                                            item.status === 'approved' || item.status === 'active' ? styles.statusApproved :
                                                            item.status === 'pending' ? styles.statusPending :
                                                            styles.statusRejected
                                                        }`}>
                                                            {(item.status || item.approvalStatus || 'active').charAt(0).toUpperCase() + 
                                                             (item.status || item.approvalStatus || 'active').slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>{dashboardFilter.type}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredDashboardData.length > 20 && (
                                        <tr>
                                            <td colSpan={dashboardFilter.type === 'vendors' ? 8 : 5} style={{ textAlign: 'center', padding: '10px', color: '#6c757d' }}>
                                                Showing first 20 records. View full list in the {dashboardFilter.type} tab.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className={styles.announcementSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>📢 Announcements</h2>
                    <button className={styles.primaryBtn} onClick={() => setActiveTab('announcements')}>
                        View All
                    </button>
                </div>
                
                {announcements.length === 0 ? (
                    <div className={styles.announcementEmpty}>
                        No announcements yet.
                        <button className={styles.createBtn} onClick={() => setActiveTab('announcements')}>
                            Create One
                        </button>
                    </div>
                ) : (
                    <div className={styles.announcementListCompact}>
                        {announcements.slice(0, 3).map((an) => (
                            <div key={an.id} className={styles.announcementItemCompact}>
                                <div className={styles.announcementHeader}>
                                    <span className={styles.announcementTitle} title={an.title}>
                                        {an.title}
                                    </span>
                                    <span className={styles.announcementBadge}>
                                        📢 {an.audience}
                                    </span>
                                </div>
                                <p className={styles.announcementContent}>
                                    {an.content}
                                </p>
                                <div className={styles.announcementFooter}>
                                    <span className={styles.announcementDate}>
                                        {an.date}
                                    </span>
                                    <div className={styles.announcementActions}>
                                        <button 
                                            className={styles.deleteBtnSmall}
                                            onClick={() => handleDeleteAnnouncement(an.id)}
                                            title="Delete announcement"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {announcements.length > 3 && (
                    <div style={{ textAlign: 'center', marginTop: '14px' }}>
                        <button 
                            className={styles.secondaryBtn} 
                            onClick={() => setActiveTab('announcements')}
                            style={{ padding: '6px 20px', fontSize: '13px' }}
                        >
                            View All {announcements.length} Announcements →
                        </button>
                    </div>
                )}
            </div>
        </>
    );

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

    // ✅ ONLY Business Subscription Requests (Global subscriptions removed from UI)
    const renderSubscriptionRequests = () => {
        const pendingRequests = subscriptionRequests.filter((s: any) => s.status === 'pending');
        const approvedRequests = subscriptionRequests.filter((s: any) => s.status === 'approved');
        const rejectedRequests = subscriptionRequests.filter((s: any) => s.status === 'rejected');

        console.log('📋 [ADMIN] Rendering subscription requests:', {
            total: subscriptionRequests.length,
            pending: pendingRequests.length,
            approved: approvedRequests.length,
            rejected: rejectedRequests.length
        });

        return (
            <div className={styles.subscriptionSection}>
                <div className={styles.subscriptionHeader}>
                    <div className={styles.subscriptionHeaderLeft}>
                        <h2 className={styles.subscriptionTitle}>📋 Business Subscription Requests</h2>
                        <span className={styles.subscriptionBadge}>
                            Total: {subscriptionRequests.length}
                        </span>
                    </div>
                    <button 
                        className={styles.subscriptionRefreshBtn}
                        onClick={fetchSubscriptions}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {subscriptionRequests.length === 0 ? (
                    <div className={styles.subscriptionEmptyState}>
                        <span className={styles.emptyIcon}>📋</span>
                        <h4 className={styles.emptyTitle}>No Business Subscription Requests</h4>
                        <p className={styles.emptySubtitle}>All business subscription requests will appear here once vendors submit them.</p>
                    </div>
                ) : (
                    <>
                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <>
                                <div className={styles.subscriptionTypeHeader}>
                                    <span className={styles.subscriptionTypeIcon}>⏳</span>
                                    <h3 className={styles.subscriptionTypeTitle}>Pending Requests</h3>
                                    <span className={styles.subscriptionTypeCount}>{pendingRequests.length}</span>
                                </div>

                                <div className={styles.subscriptionCardGrid}>
                                    {pendingRequests.map((s: any) => (
                                        <div key={s.id} className={styles.subscriptionCard}>
                                            <div className={styles.subscriptionCardStatus}>
                                                <span className={`${styles.subscriptionStatusBadge} ${styles.subscriptionStatusPending}`}>
                                                    ⏳ Pending
                                                </span>
                                                <span className={styles.subscriptionPlanBadge}>
                                                    {s.plan === 'yearly' || s.planType === 'yearly' ? '📅 Yearly' : '📆 Monthly'}
                                                </span>
                                            </div>

                                            <div className={styles.subscriptionCardBody}>
                                                <div className={styles.subscriptionBusinessInfo}>
                                                    <span className={styles.subscriptionBusinessIcon}>🏢</span>
                                                    <div>
                                                        <h4 className={styles.subscriptionBusinessName}>{s.businessName || 'N/A'}</h4>
                                                        <p className={styles.subscriptionBusinessEmail}>{s.businessEmail || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.subscriptionVendorInfo}>
                                                    <span className={styles.subscriptionVendorIcon}>👤</span>
                                                    <div>
                                                        <p className={styles.subscriptionVendorName}>{s.vendorName || 'N/A'}</p>
                                                        <p className={styles.subscriptionVendorEmail}>{s.vendorEmail || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.subscriptionDetailsGrid}>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>💰 Amount</span>
                                                        <span className={styles.subscriptionDetailValue}>PKR {s.amount ? Number(s.amount).toLocaleString() : '0'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>💳 Payment Method</span>
                                                        <span className={styles.subscriptionDetailValue}>{s.paymentMethod || 'N/A'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>📅 Requested</span>
                                                        <span className={styles.subscriptionDetailValue}>{s.createdAt || s.requestedAt || 'N/A'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>📱 Account</span>
                                                        <span className={styles.subscriptionDetailValue}>
                                                            {s.accountNumber ? s.accountNumber : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={styles.subscriptionCardActions}>
                                                    <button 
                                                        className={styles.subscriptionApproveBtn}
                                                        onClick={() => handleBusinessSubscriptionStatus(s.id, 'approved')}
                                                    >
                                                        ✅ Approve
                                                    </button>
                                                    <button 
                                                        className={styles.subscriptionRejectBtn}
                                                        onClick={() => handleBusinessSubscriptionStatus(s.id, 'rejected')}
                                                    >
                                                        ❌ Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Approved Requests */}
                        {approvedRequests.length > 0 && (
                            <>
                                <div className={styles.subscriptionTypeHeader} style={{ borderLeftColor: '#28a745' }}>
                                    <span className={styles.subscriptionTypeIcon}>✅</span>
                                    <h3 className={styles.subscriptionTypeTitle}>Approved Requests</h3>
                                    <span className={styles.subscriptionTypeCount} style={{ background: '#28a745' }}>{approvedRequests.length}</span>
                                </div>

                                <div className={styles.subscriptionCardGrid}>
                                    {approvedRequests.map((s: any) => (
                                        <div key={s.id} className={styles.subscriptionCard} style={{ borderColor: '#28a745', background: '#f0fff4' }}>
                                            <div className={styles.subscriptionCardStatus}>
                                                <span className={`${styles.subscriptionStatusBadge} ${styles.subscriptionStatusApproved}`}>
                                                    ✅ Approved
                                                </span>
                                                <span className={styles.subscriptionPlanBadge}>
                                                    {s.plan === 'yearly' || s.planType === 'yearly' ? '📅 Yearly' : '📆 Monthly'}
                                                </span>
                                            </div>

                                            <div className={styles.subscriptionCardBody}>
                                                <div className={styles.subscriptionBusinessInfo}>
                                                    <span className={styles.subscriptionBusinessIcon}>🏢</span>
                                                    <div>
                                                        <h4 className={styles.subscriptionBusinessName}>{s.businessName || 'N/A'}</h4>
                                                        <p className={styles.subscriptionBusinessEmail}>{s.businessEmail || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.subscriptionVendorInfo}>
                                                    <span className={styles.subscriptionVendorIcon}>👤</span>
                                                    <div>
                                                        <p className={styles.subscriptionVendorName}>{s.vendorName || 'N/A'}</p>
                                                        <p className={styles.subscriptionVendorEmail}>{s.vendorEmail || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.subscriptionDetailsGrid}>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>💰 Amount</span>
                                                        <span className={styles.subscriptionDetailValue}>PKR {s.amount ? Number(s.amount).toLocaleString() : '0'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>💳 Payment Method</span>
                                                        <span className={styles.subscriptionDetailValue}>{s.paymentMethod || 'N/A'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>📅 Requested</span>
                                                        <span className={styles.subscriptionDetailValue}>{s.createdAt || s.requestedAt || 'N/A'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>📱 Account</span>
                                                        <span className={styles.subscriptionDetailValue}>
                                                            {s.accountNumber ? s.accountNumber : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ 
                                                    padding: '8px 12px', 
                                                    background: '#d4edda', 
                                                    borderRadius: '8px',
                                                    textAlign: 'center',
                                                    fontSize: '13px',
                                                    color: '#155724'
                                                }}>
                                                    ✅ Approved on {s.approvedAt || s.createdAt || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Rejected Requests */}
                        {rejectedRequests.length > 0 && (
                            <>
                                <div className={styles.subscriptionTypeHeader} style={{ borderLeftColor: '#dc3545' }}>
                                    <span className={styles.subscriptionTypeIcon}>❌</span>
                                    <h3 className={styles.subscriptionTypeTitle}>Rejected Requests</h3>
                                    <span className={styles.subscriptionTypeCount} style={{ background: '#dc3545' }}>{rejectedRequests.length}</span>
                                </div>

                                <div className={styles.subscriptionCardGrid}>
                                    {rejectedRequests.map((s: any) => (
                                        <div key={s.id} className={styles.subscriptionCard} style={{ borderColor: '#dc3545', background: '#fff5f5' }}>
                                            <div className={styles.subscriptionCardStatus}>
                                                <span className={`${styles.subscriptionStatusBadge} ${styles.subscriptionStatusRejected}`}>
                                                    ❌ Rejected
                                                </span>
                                                <span className={styles.subscriptionPlanBadge}>
                                                    {s.plan === 'yearly' || s.planType === 'yearly' ? '📅 Yearly' : '📆 Monthly'}
                                                </span>
                                            </div>

                                            <div className={styles.subscriptionCardBody}>
                                                <div className={styles.subscriptionBusinessInfo}>
                                                    <span className={styles.subscriptionBusinessIcon}>🏢</span>
                                                    <div>
                                                        <h4 className={styles.subscriptionBusinessName}>{s.businessName || 'N/A'}</h4>
                                                        <p className={styles.subscriptionBusinessEmail}>{s.businessEmail || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.subscriptionVendorInfo}>
                                                    <span className={styles.subscriptionVendorIcon}>👤</span>
                                                    <div>
                                                        <p className={styles.subscriptionVendorName}>{s.vendorName || 'N/A'}</p>
                                                        <p className={styles.subscriptionVendorEmail}>{s.vendorEmail || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.subscriptionDetailsGrid}>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>💰 Amount</span>
                                                        <span className={styles.subscriptionDetailValue}>PKR {s.amount ? Number(s.amount).toLocaleString() : '0'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>💳 Payment Method</span>
                                                        <span className={styles.subscriptionDetailValue}>{s.paymentMethod || 'N/A'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>📅 Requested</span>
                                                        <span className={styles.subscriptionDetailValue}>{s.createdAt || s.requestedAt || 'N/A'}</span>
                                                    </div>
                                                    <div className={styles.subscriptionDetailItem}>
                                                        <span className={styles.subscriptionDetailLabel}>📱 Account</span>
                                                        <span className={styles.subscriptionDetailValue}>
                                                            {s.accountNumber ? s.accountNumber : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ 
                                                    padding: '8px 12px', 
                                                    background: '#f8d7da', 
                                                    borderRadius: '8px',
                                                    textAlign: 'center',
                                                    fontSize: '13px',
                                                    color: '#721c24'
                                                }}>
                                                    ❌ Rejected on {s.approvedAt || s.createdAt || 'N/A'}
                                                    {s.rejectedReason && <div style={{ fontSize: '12px', marginTop: '4px' }}>Reason: {s.rejectedReason}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        );
    };

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

    const getTabTitle = () => {
        switch(activeTab) {
            case 'dashboard': return 'Admin Dashboard';
            case 'vendors': return '🏪 Vendor Management';
            case 'customers': return '👥 Customers';
            case 'riders': return '🛵 Riders';
            case 'employees': return '👔 Employees';
            case 'commission': return '💰 Commission Rules';
            case 'coupons': return '🎟️ Coupons';
            case 'announcements': return '📢 Announcements';
            case 'withdrawals': return '💳 Withdrawals';
            case 'subscriptions': return '📋 Business Subscriptions';
            default: return 'Admin Dashboard';
        }
    };

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
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div>
                            <h2>{getTabTitle()}</h2>
                            <p>Welcome back, Admin!</p>
                        </div>
                        <div className={styles.headerRightControls}>
                            <button className={styles.addVendorBtn} onClick={() => setShowAddVendorModal(true)}>
                                ➕ Add Vendor
                            </button>
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