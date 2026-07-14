// app/dashboard/admin/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    streetAddress?: string;
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

interface Business {
    _id: string;
    businessName: string;
    businessNtn?: string;
    businessEmail: string;
    phone: string;
    whatsapp?: string;
    landline?: string;
    addressCity: string;
    addressCountry: string;
    mapLocation?: string;
    open24_7?: boolean;
    businessTiming?: any;
    socialLinks?: string[];
    businessLogo?: string;
    coverImage?: string;
    galleryImages?: string[];
    status: 'pending' | 'approved' | 'rejected';
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    businessTypeId?: { _id: string; name: string };
    subtypes?: { _id: string; name: string }[];
    businessLicense?: string;
    businessTimings?: string;
}

// ============================================
// SUBSCRIPTION PLANS DATA
// ============================================
const SUBSCRIPTION_PLANS = [
    { 
        id: 'free', 
        name: 'Free', 
        price: 'PKR 0', 
        period: 'Forever',
        features: ['Basic Listing', '5 Products', 'Basic Support'],
        color: '#6c757d'
    },
    { 
        id: 'monthly', 
        name: 'Monthly', 
        price: 'PKR 5,000', 
        period: 'Per Month',
        features: ['Featured Listing', '50 Products', 'Priority Support', 'Analytics Dashboard'],
        color: '#4a6cf7'
    },
    { 
        id: 'yearly', 
        name: 'Yearly', 
        price: 'PKR 50,000', 
        period: 'Per Year',
        features: ['Premium Listing', 'Unlimited Products', '24/7 Support', 'Advanced Analytics', 'Marketing Tools', 'Dedicated Manager'],
        color: '#28a745'
    }
];

export default function AdminDashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // ✅ Vendor Detail View State
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [selectedVendorBusinesses, setSelectedVendorBusinesses] = useState<Business[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [viewingVendor, setViewingVendor] = useState(false);
    
    // ✅ Edit Mode States - Inline Edit
    const [editProfileMode, setEditProfileMode] = useState(false);
    const [editBusinessMode, setEditBusinessMode] = useState(false);
    const [editTab, setEditTab] = useState<'personal' | 'business'>('personal');
    
    // ✅ Edit Form Data
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
    
    // ✅ Edit File States
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
    
    // ✅ Edit Business Types States
    const [editBusinessTypes, setEditBusinessTypes] = useState<BusinessType[]>([]);
    const [editBusinessSubtypes, setEditBusinessSubtypes] = useState<BusinessSubtype[]>([]);
    const [editSelectedSubtypeIds, setEditSelectedSubtypeIds] = useState<string[]>([]);
    const [editShowOtherSubtype, setEditShowOtherSubtype] = useState(false);
    const [editOtherSubtypeName, setEditOtherSubtypeName] = useState('');
    
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

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // ============================================
    // ✅ SUBSCRIPTION STATES
    // ============================================
    const [subActiveTab, setSubActiveTab] = useState<'requests' | 'plans'>('requests');
    const [subSearchTerm, setSubSearchTerm] = useState('');
    const [subFilterStatus, setSubFilterStatus] = useState('all');
    const [subCurrentPage, setSubCurrentPage] = useState(1);
    const [subItemsPerPage, setSubItemsPerPage] = useState(10);
    const subPageSizeOptions = [10, 20, 50, 100];

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
    const [couponForm, setCouponForm] = useState<{ code: string; type: 'percentage' | 'fixed'; discount: string; expiry: string }>({ code: '', type: 'percentage', discount: '', expiry: '' });
    const [announcementForm, setAnnouncementForm] = useState<{ title: string; content: string; audience: 'all' | 'vendors' | 'customers' | 'riders' }>({ title: '', content: '', audience: 'all' });
    const [commissionForm, setCommissionForm] = useState<{ name: string; type: 'percentage' | 'fixed'; value: string; description: string }>({ name: '', type: 'percentage', value: '', description: '' });

    const API_URL = 'http://localhost:5002';

    // ============================================
    // ✅ EFFECTS
    // ============================================
    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab) {
            const validTabs = ['vendors', 'customers', 'riders', 'employees', 'commission', 'coupons', 'announcements', 'withdrawals', 'subscriptions'];
            if (validTabs.includes(tab)) {
                setActiveTab(tab);
            }
        }
    }, [searchParams]);

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

    useEffect(() => {
        setSubCurrentPage(1);
    }, [subSearchTerm, subFilterStatus, subItemsPerPage]);

    // ============================================
    // ✅ HELPER FUNCTIONS
    // ============================================
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

    // ✅ Fetch Edit Business Types
    const fetchEditBusinessTypes = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await axios.get(`${API_URL}/api/auth/business/types`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setEditBusinessTypes(response.data.data || []);
            }
        } catch (error: any) {
            console.error('❌ Error fetching edit business types:', error.message);
        }
    }, [API_URL]);

    const fetchEditSubtypesByType = useCallback(async (typeId: string) => {
        if (!typeId) {
            setEditBusinessSubtypes([]);
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await axios.get(`${API_URL}/api/auth/business/subtypes/${typeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setEditBusinessSubtypes(response.data.data || []);
            }
        } catch (error: any) {
            console.error('❌ Error fetching edit subtypes:', error.message);
        }
    }, [API_URL]);

    // ============================================
    // ✅ ADD VENDOR FUNCTIONS
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

    // ============================================
    // ✅ FETCH FUNCTIONS
    // ============================================
    const filteredSubscriptions = useMemo(() => {
    let filtered = [...subscriptionRequests];

    if (subFilterStatus !== 'all') {
        filtered = filtered.filter(s => s.status === subFilterStatus);
    }

    if (subSearchTerm.trim()) {
        const term = subSearchTerm.toLowerCase().trim();
        filtered = filtered.filter(s => {
            return (
                // ✅ Business Name
                (s.businessName?.toLowerCase().includes(term) || false) ||
                // ✅ Business Email
                (s.businessEmail?.toLowerCase().includes(term) || false) ||
                // ✅ Vendor Name
                (s.vendorName?.toLowerCase().includes(term) || false) ||
                // ✅ Vendor Email
                (s.vendorEmail?.toLowerCase().includes(term) || false) ||
                // ✅ Vendor ID
                (s.vendorId?.toLowerCase().includes(term) || false) ||
                // ✅ Request ID
                (s.id?.toLowerCase().includes(term) || false) ||
                // ✅ Shop Name
                (s.shopName?.toLowerCase().includes(term) || false) ||
                // ✅ Plan Type (Monthly/Yearly)
                (s.plan?.toLowerCase().includes(term) || false) ||
                (s.planType?.toLowerCase().includes(term) || false) ||
                // ✅ Payment Method
                (s.paymentMethod?.toLowerCase().includes(term) || false) ||
                // ✅ Account Number
                (s.accountNumber?.toLowerCase().includes(term) || false) ||
                // ✅ Account Holder Name
                (s.accountHolderName?.toLowerCase().includes(term) || false) ||
                // ✅ Bank Name
                (s.bankName?.toLowerCase().includes(term) || false) ||
                // ✅ Phone Number
                (s.phoneNumber?.toLowerCase().includes(term) || false) ||
                // ✅ Notes
                (s.notes?.toLowerCase().includes(term) || false) ||
                // ✅ Status (Pending/Approved/Rejected)
                (s.status?.toLowerCase().includes(term) || false) ||
                // ✅ Amount (as string)
                (s.amount && s.amount.toString().includes(term)) ||
                // ✅ Requested Date
                (s.requestedAt && s.requestedAt.includes(term)) ||
                (s.createdAt && s.createdAt.includes(term)) ||
                // ✅ Business ID
                (s.businessId?.toLowerCase().includes(term) || false) ||
                // ✅ Search by number in any field
                (s.id && s.id.toString().includes(term)) ||
                (s.vendorId && s.vendorId.toString().includes(term))
            );
        });
    }

    // Sort by newest first
    filtered.sort((a, b) => {
        return new Date(b.createdAt || b.requestedAt || 0).getTime() - 
               new Date(a.createdAt || a.requestedAt || 0).getTime();
    });

    return filtered;
}, [subscriptionRequests, subSearchTerm, subFilterStatus]);

    const subTotalItems = filteredSubscriptions.length;
    const subTotalPages = Math.ceil(subTotalItems / subItemsPerPage);

    const paginatedSubscriptions = useMemo(() => {
        const startIndex = (subCurrentPage - 1) * subItemsPerPage;
        const endIndex = startIndex + subItemsPerPage;
        return filteredSubscriptions.slice(startIndex, endIndex);
    }, [filteredSubscriptions, subCurrentPage, subItemsPerPage]);

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
            await fetchEditBusinessTypes();

        } catch (error: any) {
            console.error("Error loading dashboard data:", error.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL, router, fetchWithdrawals, fetchSubscriptions, fetchBusinessTypes, fetchEditBusinessTypes]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            setLoading(false);
            return;
        }
        loadAllDashboardData();
    }, [router, loadAllDashboardData]);

    // ✅ Fetch Vendor Businesses for Detail View
    const fetchVendorBusinesses = useCallback(async (vendorId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(
                `${API_URL}/api/auth/vendor/${vendorId}/businesses`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const data = response.data.data || [];
                setSelectedVendorBusinesses(data);
                if (data.length > 0) {
                    setSelectedBusinessId(data[0]._id);
                    setSelectedBusiness(data[0]);
                } else {
                    setSelectedBusinessId('');
                    setSelectedBusiness(null);
                }
            }
        } catch (error: any) {
            console.error('Error fetching businesses:', error);
        }
    }, [API_URL]);

    // ✅ Fetch Single Business Details
    const fetchBusinessDetails = useCallback(async (businessId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(
                `${API_URL}/api/auth/business/${businessId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSelectedBusiness(response.data.data);
            }
        } catch (error: any) {
            console.error('Error fetching business details:', error);
        }
    }, [API_URL]);

    // ✅ Handle Business Selection Change
    const handleBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const businessId = e.target.value;
        setSelectedBusinessId(businessId);
        const business = selectedVendorBusinesses.find(b => b._id === businessId);
        if (business) {
            setSelectedBusiness(business);
            fetchBusinessDetails(businessId);
        }
    };

    // ✅ Handle View Vendor - Opens Detail View Inside Page
    const handleViewVendor = useCallback(async (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setViewingVendor(true);
        await fetchVendorBusinesses(vendor.id);
    }, [fetchVendorBusinesses]);

    // ✅ Handle Back to Vendor List
    const handleBackToVendorList = () => {
        setSelectedVendor(null);
        setSelectedVendorBusinesses([]);
        setSelectedBusiness(null);
        setSelectedBusinessId('');
        setViewingVendor(false);
        setEditProfileMode(false);
        setEditBusinessMode(false);
    };

    // ✅ Update Vendor Status
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
                loadAllDashboardData();
                if (selectedVendor) {
                    setSelectedVendor({ ...selectedVendor, status });
                }
            }
        } catch (error: any) {
            alert(`❌ Error updating vendor status: ${error.response?.data?.message || error.message}`);
        }
    }, [API_URL, loadAllDashboardData, selectedVendor]);

    // ✅ Delete Vendor
    const handleDeleteVendor = useCallback(async (vendorId: string) => {
        if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_URL}/api/auth/vendor/${vendorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                alert('✅ Vendor deleted successfully!');
                loadAllDashboardData();
                if (selectedVendor && selectedVendor.id === vendorId) {
                    handleBackToVendorList();
                }
            }
        } catch (error: any) {
            alert(`❌ Error deleting vendor: ${error.response?.data?.message || error.message}`);
        }
    }, [API_URL, loadAllDashboardData, selectedVendor]);

    // ============================================
    // ✅ EDIT FUNCTIONS - INLINE EDIT
    // ============================================
    
    // ✅ Edit Profile - Open Inline
    const handleEditProfile = useCallback((vendor: Vendor) => {
        setEditProfileMode(true);
        setEditBusinessMode(false);
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
    }, []);

    // ✅ Edit Business - Open Inline
    const handleEditBusinessInline = useCallback(() => {
        if (!selectedVendor) return;
        
        let businessToEdit = selectedBusiness;
        if (!businessToEdit && selectedVendorBusinesses.length > 0) {
            businessToEdit = selectedVendorBusinesses[0];
        }
        
        if (!businessToEdit) {
            alert('No business found to edit.');
            return;
        }
        
        setEditBusinessMode(true);
        setEditProfileMode(false);
        setEditTab('business');
        
        // Load business data into edit form
        setEditForm({
            ...editForm,
            shopName: businessToEdit.businessName || '',
            businessPhone: businessToEdit.phone || '',
            businessWhatsapp: businessToEdit.whatsapp || '',
            businessLandline: businessToEdit.landline || '',
            businessEmail: businessToEdit.businessEmail || '',
            businessCity: businessToEdit.addressCity || '',
            businessCountry: businessToEdit.addressCountry || '',
            businessNtn: businessToEdit.businessNtn || '',
            mapLocation: businessToEdit.mapLocation || '',
            businessTimings: businessToEdit.businessTimings || '',
            businessType: businessToEdit.businessTypeId?._id || '',
        });
        
        setExistingBusinessLicense(businessToEdit.businessLicense || '');
        setExistingBusinessLogo(businessToEdit.businessLogo || '');
        setExistingCoverImage(businessToEdit.coverImage || '');
        setExistingGalleryImages(businessToEdit.galleryImages || []);
        
        // Set subtypes
        if (businessToEdit.subtypes) {
            const subtypeIds = businessToEdit.subtypes.map((s: any) => s._id);
            setEditSelectedSubtypeIds(subtypeIds);
        } else {
            setEditSelectedSubtypeIds([]);
        }
        
        // Fetch subtypes for the selected type
        if (businessToEdit.businessTypeId?._id) {
            fetchEditSubtypesByType(businessToEdit.businessTypeId._id);
        }
    }, [selectedVendor, selectedBusiness, selectedVendorBusinesses, editForm, fetchEditSubtypesByType]);

    // ✅ Handle Edit File Change
    const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void, setPreview: (preview: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // ✅ Handle Edit Gallery Change
    const handleEditGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setEditGalleryImages(prev => [...prev, ...fileArray]);
            const previews = fileArray.map(file => URL.createObjectURL(file));
            setEditGalleryPreviews(prev => [...prev, ...previews]);
        }
    };

    // ✅ Remove Edit Gallery Image
    const removeEditGalleryImage = (index: number) => {
        setEditGalleryImages(prev => prev.filter((_, i) => i !== index));
        setEditGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // ✅ Handle Edit Profile Submit - FIXED (Complete updated function)
    const handleEditProfileSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendor) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Session expired. Please login again.');
                return;
            }
            
            const formData = new FormData();
            
            // ✅ Personal Info - ALL FIELDS (including WhatsApp, City, Country, StreetAddress)
            formData.append('ownerName', editForm.ownerName || '');
            formData.append('email', editForm.email || '');
            formData.append('phone', editForm.phone || '');
            formData.append('whatsapp', editForm.whatsapp || '');
            formData.append('ntnNumber', editForm.ntnNumber || '');
            formData.append('streetAddress', editForm.streetAddress || '');
            formData.append('city', editForm.city || '');
            formData.append('country', editForm.country || '');
            formData.append('shopName', editForm.shopName || '');
            formData.append('shopAddress', editForm.shopAddress || '');
            
            // ✅ Business Info - ye fields bhi send ho rahi hain
            formData.append('businessPhone', editForm.businessPhone || '');
            formData.append('businessWhatsapp', editForm.businessWhatsapp || '');
            formData.append('businessLandline', editForm.businessLandline || '');
            formData.append('businessEmail', editForm.businessEmail || '');
            formData.append('businessCity', editForm.businessCity || '');
            formData.append('businessCountry', editForm.businessCountry || '');
            formData.append('businessNtn', editForm.businessNtn || '');
            formData.append('businessWebsite', editForm.businessWebsite || '');
            formData.append('socialLink', editForm.socialLink || '');
            formData.append('mapLocation', editForm.mapLocation || '');
            formData.append('businessTimings', editForm.businessTimings || '');
            formData.append('businessType', editForm.businessType || '');
            
            // ✅ Files - only if changed
            if (editCnicFront) formData.append('cnicFront', editCnicFront);
            if (editCnicBack) formData.append('cnicBack', editCnicBack);

            console.log('📤 Sending update to:', `${API_URL}/api/auth/vendor/${selectedVendor.id}`);
            console.log('📤 Form data fields:');
            for (let pair of formData.entries()) {
                if (pair[1] instanceof File) {
                    console.log(`   ${pair[0]}: [File: ${pair[1].name}]`);
                } else {
                    console.log(`   ${pair[0]}: ${pair[1]}`);
                }
            }
            
            const response = await axios.put(
                `${API_URL}/api/auth/vendor/${selectedVendor.id}`,
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );
            
            console.log('📤 Response:', response.data);
            
            if (response.data.success) {
                alert('✅ Profile updated successfully!');
                
                setEditProfileMode(false);
                setEditBusinessMode(false);
                
                // ✅ STEP 1: Direct API se updated vendor fetch karein
                try {
                    const vendorResponse = await axios.get(
                        `${API_URL}/api/auth/vendor/${selectedVendor.id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (vendorResponse.data.success) {
                        const updatedVendor = vendorResponse.data.vendor || vendorResponse.data.data;
                        console.log('📤 Updated vendor data:', updatedVendor);
                        // ✅ STEP 2: Selected vendor IMMEDIATELY update karein
                        setSelectedVendor(updatedVendor);
                        // ✅ STEP 3: Businesses bhi refresh karein
                        await fetchVendorBusinesses(updatedVendor.id);
                    }
                } catch (fetchErr) {
                    console.error('Error fetching updated vendor:', fetchErr);
                    // Fallback: vendors list se try karein
                    await loadAllDashboardData();
                    const updatedVendor = vendors.find(v => v.id === selectedVendor.id);
                    if (updatedVendor) {
                        setSelectedVendor(updatedVendor);
                        await fetchVendorBusinesses(updatedVendor.id);
                    }
                }
                
                // Reset files
                setEditCnicFront(null);
                setEditCnicBack(null);
                setEditCnicFrontPreview('');
                setEditCnicBackPreview('');
                
            } else {
                alert('❌ ' + (response.data.message || 'Failed to update profile'));
            }
        } catch (error: any) {
            console.error('❌ Error:', error);
            alert(`❌ Error updating profile: ${error.response?.data?.message || error.message}`);
        }
    }, [selectedVendor, editForm, editCnicFront, editCnicBack, API_URL, loadAllDashboardData, vendors, fetchVendorBusinesses]);

    // ✅ Handle Edit Business Submit
    const handleEditBusinessSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendor || !selectedBusinessId) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            formData.append('businessName', editForm.shopName);
            formData.append('businessNtn', editForm.businessNtn);
            formData.append('businessEmail', editForm.businessEmail);
            formData.append('phone', editForm.businessPhone);
            formData.append('whatsapp', editForm.businessWhatsapp);
            formData.append('landline', editForm.businessLandline);
            formData.append('addressCity', editForm.businessCity);
            formData.append('addressCountry', editForm.businessCountry);
            formData.append('mapLocation', editForm.mapLocation);
            formData.append('businessTypeId', editForm.businessType);
            formData.append('businessTimings', editForm.businessTimings);
            formData.append('subtypes', JSON.stringify(editSelectedSubtypeIds));
            if (editShowOtherSubtype && editOtherSubtypeName) {
                formData.append('otherSubtype', editOtherSubtypeName);
            }
            
            // ✅ 4 Images Upload
            if (editBusinessLicense) formData.append('businessLicense', editBusinessLicense);
            if (editBusinessLogo) formData.append('businessLogo', editBusinessLogo);
            if (editCoverImage) formData.append('coverImage', editCoverImage);
            editGalleryImages.forEach(file => formData.append('galleryImages', file));

            const response = await axios.put(
                `${API_URL}/api/auth/business/${selectedBusinessId}`,
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );
            
            if (response.data.success) {
                alert('✅ Business updated successfully!');
                setEditBusinessMode(false);
                setEditProfileMode(false);
                loadAllDashboardData();
                // Refresh businesses
                await fetchVendorBusinesses(selectedVendor.id);
            }
        } catch (error: any) {
            alert(`❌ Error updating business: ${error.response?.data?.message || error.message}`);
        }
    }, [selectedVendor, selectedBusinessId, editForm, editBusinessLicense, editBusinessLogo, editCoverImage, editGalleryImages, editSelectedSubtypeIds, editShowOtherSubtype, editOtherSubtypeName, API_URL, loadAllDashboardData, fetchVendorBusinesses]);

    // ✅ Cancel Edit
    const cancelEdit = useCallback(() => {
        setEditProfileMode(false);
        setEditBusinessMode(false);
        // Reset file states
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
        setEditSelectedSubtypeIds([]);
        setEditShowOtherSubtype(false);
        setEditOtherSubtypeName('');
    }, []);

    // ============================================
    // ✅ WITHDRAWAL FUNCTIONS
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
    // ✅ BUSINESS SUBSCRIPTION FUNCTIONS
    // ============================================
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
            
            const endpoint = status === 'approved' ? 'approve' : 'reject';
            const payload = status === 'rejected' ? { reason } : {};
            
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

            if (response.data.success) {
                alert(`✅ Business subscription ${status} successfully!`);
                fetchSubscriptions();
                loadAllDashboardData();
            } else {
                alert(`❌ Error: ${response.data.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('❌ Error updating business subscription:', error);
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

    const handleDeleteSubscription = useCallback(async (subscriptionId: string) => {
        if (!confirm('Are you sure you want to delete this subscription request?')) return;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Session expired. Please login again.');
                return;
            }
            
            const response = await axios.delete(
                `${API_URL}/api/auth/business-subscription/${subscriptionId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.success) {
                alert('✅ Subscription deleted successfully!');
                fetchSubscriptions();
            } else {
                alert(`❌ Error: ${response.data.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('❌ Error deleting subscription:', error);
            alert(`❌ Error: ${error.response?.data?.message || error.message}`);
        }
    }, [API_URL, fetchSubscriptions]);

    // ============================================
    // ✅ ADMIN EMPLOYEE FUNCTIONS
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
    // ✅ COUPON FUNCTIONS
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
    // ✅ COMMISSION FUNCTIONS
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
    // ✅ ANNOUNCEMENT FUNCTIONS
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
    // ✅ RENDER VENDOR DETAIL VIEW - COMPLETE UPDATED
    // ============================================
    const renderVendorDetail = () => {
        if (!selectedVendor) return null;

        const vendor = selectedVendor;
        const isPending = vendor.status === 'pending';
        const cnicFrontUrl = getImageUrl(vendor.cnicFront);
        const cnicBackUrl = getImageUrl(vendor.cnicBack);
        const businessLicenseUrl = getImageUrl(vendor.businessLicense);
        const businessLogoUrl = getImageUrl(vendor.businessLogo);
        const coverImageUrl = getImageUrl(vendor.coverImage);

        // Display previews for edit forms
        const displayCnicFront = editCnicFrontPreview || (existingCnicFront ? getImageUrl(existingCnicFront) : '');
        const displayCnicBack = editCnicBackPreview || (existingCnicBack ? getImageUrl(existingCnicBack) : '');
        const displayBusinessLicense = editBusinessLicensePreview || (existingBusinessLicense ? getImageUrl(existingBusinessLicense) : '');
        const displayBusinessLogo = editBusinessLogoPreview || (existingBusinessLogo ? getImageUrl(existingBusinessLogo) : '');
        const displayCoverImage = editCoverImagePreview || (existingCoverImage ? getImageUrl(existingCoverImage) : '');

        return (
            <div className={styles.section}>
                {/* Header with Back Button */}
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>
                            {editProfileMode ? '✏️ Edit Profile' : editBusinessMode ? '✏️ Edit Business' : '📋 Vendor Details'}
                            <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 'normal', color: '#6c757d' }}>
                                {vendor.vendorId || 'N/A'} • {vendor.shopName}
                            </span>
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {!editProfileMode && !editBusinessMode && (
                            <>
                                <button 
                                    className={styles.secondaryBtn} 
                                    onClick={handleBackToVendorList}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    ← Back to Vendors
                                </button>
                                
                                <button 
                                    className={styles.primaryBtn} 
                                    onClick={() => handleEditProfile(vendor)}
                                    style={{ 
                                        background: 'linear-gradient(135deg, #17a2b8, #0dcaf0)',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    ✏️ Edit Profile
                                </button>
                                
                                <button 
                                    className={styles.primaryBtn} 
                                    onClick={handleEditBusinessInline}
                                    style={{ 
                                        background: 'linear-gradient(135deg, #6f42c1, #7b4fc7)',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    🏪 Edit Business
                                </button>
                                
                                {isPending && (
                                    <>
                                        <button className={styles.successBtn} onClick={() => updateVendorStatus(vendor.id, 'approved')}>
                                            ✅ Approve
                                        </button>
                                        <button className={styles.dangerBtn} onClick={() => updateVendorStatus(vendor.id, 'rejected')}>
                                            ❌ Reject
                                        </button>
                                    </>
                                )}
                                <button className={styles.dangerBtn} onClick={() => handleDeleteVendor(vendor.id)}>
                                    🗑️ Delete
                                </button>
                            </>
                        )}
                        {(editProfileMode || editBusinessMode) && (
                            <button 
                                className={styles.secondaryBtn} 
                                onClick={cancelEdit}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                ✕ Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Badge */}
                {!editProfileMode && !editBusinessMode && (
                    <div style={{ marginBottom: '16px' }}>
                        <span className={`${styles.statusBadge} ${
                            vendor.status === 'approved' ? styles.statusApproved :
                            vendor.status === 'rejected' ? styles.statusRejected :
                            styles.statusPending
                        }`} style={{ fontSize: '14px', padding: '6px 18px' }}>
                            {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                        </span>
                        <span style={{ marginLeft: '12px', color: '#6c757d', fontSize: '14px' }}>
                            Registered: {vendor.date}
                        </span>
                    </div>
                )}

                {/* Edit Profile Form - Inline */}
                {editProfileMode && (
                    <div className={styles.detailTabContent}>
                        <form onSubmit={handleEditProfileSubmit}>
                            <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e8ecf1' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 16px 0', paddingBottom: '10px', borderBottom: '2px solid #e8ecf1' }}>
                                    👤 Personal Information
                                </h3>
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
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>CNIC Number</label>
                                        <input type="text" className={styles.formInput} value={editForm.ntnNumber} onChange={(e) => setEditForm({ ...editForm, ntnNumber: e.target.value })} />
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
                                </div>

                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '24px 0 16px 0', paddingBottom: '10px', borderBottom: '2px solid #e8ecf1' }}>
                                    📄 Personal Documents
                                </h3>

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

                                <div className={styles.editActions}>
                                    <button type="submit" className={styles.saveBtn}>💾 Save Profile</button>
                                    <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* EDIT BUSINESS FORM - INLINE */}
                {editBusinessMode && (
                    <div className={styles.detailTabContent}>
                        <form onSubmit={handleEditBusinessSubmit}>
                            <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e8ecf1' }}>
                                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8faff', borderRadius: '8px', border: '1px solid #e8ecf1' }}>
                                    <span style={{ fontSize: '14px', color: '#6c757d' }}>
                                        📌 Editing Business: <strong style={{ color: '#1a1a2e' }}>{editForm.shopName || 'Unnamed'}</strong>
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 16px 0', paddingBottom: '10px', borderBottom: '2px solid #e8ecf1' }}>
                                    🏪 Business Information
                                </h3>
                                <div className={styles.editGrid}>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Business Name *</label>
                                        <input type="text" className={styles.formInput} value={editForm.shopName} onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })} required />
                                    </div>

                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label className={styles.formLabel}>Business Category</label>
                                        <select
                                            className={styles.formSelect}
                                            value={editForm.businessType}
                                            onChange={(e) => {
                                                const typeId = e.target.value;
                                                setEditForm({ ...editForm, businessType: typeId });
                                                setEditSelectedSubtypeIds([]);
                                                if (typeId) {
                                                    fetchEditSubtypesByType(typeId);
                                                } else {
                                                    setEditBusinessSubtypes([]);
                                                }
                                            }}
                                        >
                                            <option value="">Select Business Category</option>
                                            {editBusinessTypes.map((type) => (
                                                <option key={type._id} value={type._id}>
                                                    {type.icon || '📌'} {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {editBusinessSubtypes.length > 0 && (
                                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                            <label className={styles.formLabel}>Sub Categories (Select multiple)</label>
                                            <div className={styles.subtypeGrid}>
                                                {editBusinessSubtypes.map((sub) => (
                                                    <div key={sub._id} className={styles.subtypeOption}>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={editSelectedSubtypeIds.includes(sub._id)}
                                                                onChange={() => {
                                                                    setEditSelectedSubtypeIds(prev =>
                                                                        prev.includes(sub._id)
                                                                            ? prev.filter(id => id !== sub._id)
                                                                            : [...prev, sub._id]
                                                                    );
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
                                                            checked={editShowOtherSubtype}
                                                            onChange={() => {
                                                                setEditShowOtherSubtype(!editShowOtherSubtype);
                                                                if (!editShowOtherSubtype) {
                                                                    setEditSelectedSubtypeIds(prev => [...prev, 'other']);
                                                                } else {
                                                                    setEditSelectedSubtypeIds(prev => prev.filter(id => id !== 'other'));
                                                                    setEditOtherSubtypeName('');
                                                                }
                                                            }}
                                                        />
                                                        Other
                                                    </label>
                                                </div>
                                            </div>
                                            {editShowOtherSubtype && (
                                                <input
                                                    type="text"
                                                    className={styles.formInput}
                                                    placeholder="Specify other category"
                                                    value={editOtherSubtypeName}
                                                    onChange={(e) => setEditOtherSubtypeName(e.target.value)}
                                                    style={{ marginTop: '10px' }}
                                                />
                                            )}
                                            {editSelectedSubtypeIds.length > 0 && (
                                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#4a6cf7' }}>
                                                    ✅ {editSelectedSubtypeIds.filter(id => id !== 'other').length} sub-categorie(s) selected
                                                </div>
                                            )}
                                        </div>
                                    )}

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

                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '24px 0 16px 0', paddingBottom: '10px', borderBottom: '2px solid #e8ecf1' }}>
                                    🕐 Business Timings
                                </h3>
                                <div className={styles.formGroup}>
                                    <input type="text" className={styles.formInput} placeholder="e.g., Mon-Fri: 9AM-6PM" value={editForm.businessTimings} onChange={(e) => setEditForm({ ...editForm, businessTimings: e.target.value })} />
                                </div>

                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '24px 0 16px 0', paddingBottom: '10px', borderBottom: '2px solid #e8ecf1' }}>
                                    📄 Business Documents
                                </h3>

                                {/* Business License */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Business License</label>
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

                                {/* Business Logo */}
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

                                {/* Cover Image */}
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

                                {/* Gallery Images */}
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

                                <div className={styles.editActions}>
                                    <button type="submit" className={styles.saveBtn}>💾 Save Business</button>
                                    <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* NORMAL DETAIL VIEW - When not in edit mode */}
                {!editProfileMode && !editBusinessMode && (
                    <>
                        {/* Tabs */}
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

                        {/* PERSONAL INFO TAB */}
                        {editTab === 'personal' && (
                            <div className={styles.detailTabContent}>
                                <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e8ecf1' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 16px 0', paddingBottom: '10px', borderBottom: '2px solid #e8ecf1' }}>
                                        👤 Personal Information
                                    </h3>
                                    <div className={styles.detailTwoColumn}>
                                        <div className={styles.detailColumn}>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>Full Name</label>
                                                <p className={styles.detailValue}>{vendor.ownerName || 'N/A'}</p>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>Email</label>
                                                <p className={styles.detailValue}>{vendor.email || 'N/A'}</p>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>Phone Number</label>
                                                <p className={styles.detailValue}>{vendor.phone || 'N/A'}</p>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>WhatsApp Number</label>
                                                <p className={styles.detailValue}>{vendor.whatsapp || 'N/A'}</p>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>CNIC Number</label>
                                                <p className={styles.detailValue}>{vendor.ntnNumber || 'N/A'}</p>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>Status</label>
                                                <p className={styles.detailValue}>
                                                    <span className={`${styles.statusBadge} ${
                                                        vendor.status === 'approved' ? styles.statusApproved :
                                                        vendor.status === 'rejected' ? styles.statusRejected :
                                                        styles.statusPending
                                                    }`}>
                                                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className={styles.detailColumn}>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>Street Address</label>
                                                <p className={styles.detailValue}>{vendor.streetAddress || 'N/A'}</p>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>City</label>
                                                <p className={styles.detailValue}>{vendor.city || 'N/A'}</p>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>Country</label>
                                                <p className={styles.detailValue}>{vendor.country || 'N/A'}</p>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <label className={styles.detailLabel}>Registration Date</label>
                                                <p className={styles.detailValue}>{vendor.date || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Documents - CNIC Front and CNIC Back */}
                                <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e8ecf1', marginTop: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 16px 0', paddingBottom: '10px', borderBottom: '2px solid #e8ecf1' }}>
                                        📄 Personal Documents
                                    </h3>
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
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BUSINESS INFO TAB */}
                        {editTab === 'business' && (
                            <div className={styles.detailTabContent}>
                                {/* Business Selector */}
                                <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e8ecf1', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                        <label style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>
                                            🏢 Select Business:
                                        </label>
                                        <select
                                            className={styles.formSelect}
                                            value={selectedBusinessId}
                                            onChange={handleBusinessChange}
                                            style={{ maxWidth: '350px', flex: 1 }}
                                        >
                                            {selectedVendorBusinesses.length === 0 ? (
                                                <option value="">No businesses found</option>
                                            ) : (
                                                selectedVendorBusinesses.map((b) => (
                                                    <option key={b._id} value={b._id}>
                                                        {b.businessName} {b.status === 'approved' ? '✅' : b.status === 'pending' ? '⏳' : '❌'}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {selectedBusiness ? (
                                    <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e8ecf1' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 16px 0', paddingBottom: '10px', borderBottom: '2px solid #e8ecf1' }}>
                                            🏪 Business Information
                                        </h3>
                                        <div className={styles.detailTwoColumn}>
                                            <div className={styles.detailColumn}>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business Name</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.businessName || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business Type</label>
                                                    <p className={styles.detailValue}>
                                                        {selectedBusiness.businessTypeId?.name || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business NTN</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.businessNtn || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business Phone</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.phone || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business WhatsApp</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.whatsapp || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business Landline</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.landline || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business Email</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.businessEmail || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className={styles.detailColumn}>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business City</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.addressCity || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business Country</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.addressCountry || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Business Website</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.socialLinks?.[0] || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Social Link</label>
                                                    <p className={styles.detailValue}>{selectedBusiness.socialLinks?.[0] || 'N/A'}</p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Map Location</label>
                                                    <p className={styles.detailValue}>
                                                        {selectedBusiness.mapLocation ? (
                                                            <a href={selectedBusiness.mapLocation} target="_blank" rel="noopener noreferrer" style={{ color: '#4a6cf7', textDecoration: 'none' }}>
                                                                📍 View on Map
                                                            </a>
                                                        ) : 'N/A'}
                                                    </p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Status</label>
                                                    <p className={styles.detailValue}>
                                                        <span className={`${styles.statusBadge} ${
                                                            selectedBusiness.status === 'approved' ? styles.statusApproved :
                                                            selectedBusiness.status === 'pending' ? styles.statusPending :
                                                            styles.statusRejected
                                                        }`}>
                                                            {selectedBusiness.status ? selectedBusiness.status.charAt(0).toUpperCase() + selectedBusiness.status.slice(1) : 'N/A'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <label className={styles.detailLabel}>Subscription</label>
                                                    <p className={styles.detailValue}>
                                                        {selectedBusiness.subscriptionPlan ? 
                                                            `${selectedBusiness.subscriptionPlan.toUpperCase()} ${selectedBusiness.subscriptionStatus === 'approved' ? '✅' : selectedBusiness.subscriptionStatus === 'pending' ? '⏳' : ''}` 
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Timings */}
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e8ecf1' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px 0' }}>
                                                🕐 Business Timings
                                            </h4>
                                            <p style={{ fontSize: '14px', color: '#333' }}>
                                                {selectedBusiness.businessTimings || 'N/A'}
                                            </p>
                                        </div>

                                        {/* Business Media - 4 Images */}
                                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid #e8ecf1' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 12px 0' }}>
                                                🖼️ Business Media
                                            </h4>
                                            <div className={styles.detailBusinessMediaGrid}>
                                                {/* Business License */}
                                                <div className={styles.detailDocBox}>
                                                    <label className={styles.detailDocLabel}>Business License</label>
                                                    <div className={styles.detailDocWrapper}>
                                                        {getImageUrl(selectedBusiness.businessLicense) ? (
                                                            <>
                                                                <img src={getImageUrl(selectedBusiness.businessLicense)} alt="Business License" className={styles.detailDocImage} />
                                                                <a href={getImageUrl(selectedBusiness.businessLicense)} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View</a>
                                                            </>
                                                        ) : (
                                                            <div className={styles.detailDocEmpty}>No License uploaded</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Business Logo */}
                                                <div className={styles.detailDocBox}>
                                                    <label className={styles.detailDocLabel}>Business Logo</label>
                                                    <div className={styles.detailDocWrapper}>
                                                        {getImageUrl(selectedBusiness.businessLogo) ? (
                                                            <>
                                                                <img src={getImageUrl(selectedBusiness.businessLogo)} alt="Business Logo" className={styles.detailDocImage} />
                                                                <a href={getImageUrl(selectedBusiness.businessLogo)} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View</a>
                                                            </>
                                                        ) : (
                                                            <div className={styles.detailDocEmpty}>No Logo uploaded</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Cover Image */}
                                                <div className={styles.detailDocBox}>
                                                    <label className={styles.detailDocLabel}>Cover Image</label>
                                                    <div className={styles.detailDocWrapper}>
                                                        {getImageUrl(selectedBusiness.coverImage) ? (
                                                            <>
                                                                <img src={getImageUrl(selectedBusiness.coverImage)} alt="Cover Image" className={styles.detailDocImage} />
                                                                <a href={getImageUrl(selectedBusiness.coverImage)} target="_blank" rel="noopener noreferrer" className={styles.detailDocBtn}>🔍 View</a>
                                                            </>
                                                        ) : (
                                                            <div className={styles.detailDocEmpty}>No Cover uploaded</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Gallery Images */}
                                                <div className={styles.detailDocBox}>
                                                    <label className={styles.detailDocLabel}>Gallery Images</label>
                                                    <div className={styles.detailGalleryWrapper}>
                                                        {selectedBusiness.galleryImages && selectedBusiness.galleryImages.length > 0 ? (
                                                            <>
                                                                {selectedBusiness.galleryImages.slice(0, 3).map((img, idx) => (
                                                                    <img key={idx} src={getImageUrl(img)} alt={`Gallery ${idx + 1}`} className={styles.detailGalleryThumb} />
                                                                ))}
                                                                {selectedBusiness.galleryImages.length > 3 && (
                                                                    <span className={styles.detailGalleryMore}>+{selectedBusiness.galleryImages.length - 3}</span>
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
                                ) : (
                                    <div style={{ background: 'white', padding: '30px 20px', borderRadius: '12px', border: '1px solid #e8ecf1', textAlign: 'center' }}>
                                        <p style={{ color: '#6c757d' }}>No business found for this vendor.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    // ============================================
    // ✅ RENDER ADD VENDOR MODAL
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

    // ============================================
    // ✅ RENDER VENDORS
    // ============================================
    const renderVendors = useCallback(() => {
        // If viewing a vendor detail, show detail view
        if (viewingVendor && selectedVendor) {
            return renderVendorDetail();
        }

        // Otherwise show vendor list
        return (
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
                                                <button 
                                                    className={styles.iconBtn} 
                                                    onClick={() => handleViewVendor(vendor)} 
                                                    title="View Details"
                                                >
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
        );
    }, [paginatedVendors, searchTerm, filterStatus, currentPage, itemsPerPage, totalItems, totalPages, handleViewVendor, handleDeleteVendor, viewingVendor, selectedVendor, renderVendorDetail]);

    // ============================================
    // ✅ RENDER DASHBOARD
    // ============================================
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
                                                        <span className={`${styles.statusBadge} ${(
                                                            item.status === 'approved' ? styles.statusApproved :
                                                            item.status === 'pending' ? styles.statusPending :
                                                            styles.statusRejected
                                                        )}`}>
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

    // ============================================
    // ✅ RENDER WITHDRAWAL REQUESTS
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

    // ============================================
    // ✅ RENDER SUBSCRIPTION REQUESTS
    // ============================================
    const renderSubscriptionRequests = () => {
        const subscriptionPlans = SUBSCRIPTION_PLANS;

        const handleViewSubscription = (subscription: any) => {
            alert(`📋 Subscription Details:\n\nBusiness: ${subscription.businessName}\nVendor: ${subscription.vendorName}\nAmount: PKR ${subscription.amount}\nStatus: ${subscription.status}\nPlan: ${subscription.plan || subscription.planType}`);
        };

        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>📋 Business Subscriptions</h2>
                    <div className={styles.headerRight}>
                        <span className={styles.vendorCount}>
                            Total: {subscriptionRequests.length}
                        </span>
                        <button 
                            className={styles.secondaryBtn}
                            onClick={fetchSubscriptions}
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <div className={styles.detailTabs}>
                    <button 
                        className={`${styles.detailTab} ${subActiveTab === 'requests' ? styles.detailTabActive : ''}`}
                        onClick={() => setSubActiveTab('requests')}
                    >
                        📋 Subscription Requests
                        <span style={{ 
                            marginLeft: '8px', 
                            background: '#4a6cf7', 
                            color: 'white', 
                            padding: '1px 10px', 
                            borderRadius: '20px',
                            fontSize: '12px'
                        }}>
                            {subscriptionRequests.length}
                        </span>
                    </button>
                    <button 
                        className={`${styles.detailTab} ${subActiveTab === 'plans' ? styles.detailTabActive : ''}`}
                        onClick={() => setSubActiveTab('plans')}
                    >
                        📊 Subscription Plans
                    </button>
                </div>

                {subActiveTab === 'requests' && (
                    <div className={styles.detailTabContent}>
                        <div className={styles.filterWrapper}>
                            <div className={styles.filterRow}>
                                <div className={styles.searchGroup}>
                                    <span className={styles.searchIcon}>🔍</span>
                                    <input
                                        type="text"
                                        className={styles.searchInput}
                                        placeholder="Search by business, vendor, email, plan, amount, status..."
                                        value={subSearchTerm}
                                        onChange={(e) => setSubSearchTerm(e.target.value)}
                                    />
                                    {subSearchTerm && (
                                        <button className={styles.clearSearchBtn} onClick={() => setSubSearchTerm('')} title="Clear search">✕</button>
                                    )}
                                </div>
                                <div className={styles.filterGroup}>
                                    <select 
                                        className={styles.filterSelect} 
                                        value={subFilterStatus} 
                                        onChange={(e) => setSubFilterStatus(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">⏳ Pending</option>
                                        <option value="approved">✅ Approved</option>
                                        <option value="rejected">❌ Rejected</option>
                                    </select>
                                </div>
                                <div className={styles.filterGroup}>
                                    <button 
                                        className={styles.clearBtn} 
                                        onClick={() => { setSubSearchTerm(''); setSubFilterStatus('all'); }}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.paginationControls}>
                            <div className={styles.perPageWrapper}>
                                <span className={styles.perPageLabel}>Entries</span>
                                <select 
                                    className={styles.perPageSelect}
                                    value={subItemsPerPage}
                                    onChange={(e) => {
                                        setSubItemsPerPage(Number(e.target.value));
                                        setSubCurrentPage(1);
                                    }}
                                >
                                    {subPageSizeOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.paginationInfo}>
                                Showing {subTotalItems === 0 ? 0 : (subCurrentPage - 1) * subItemsPerPage + 1} to {Math.min(subCurrentPage * subItemsPerPage, subTotalItems)} of {subTotalItems} entries
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Business Name</th>
                                        <th>Business Email</th>
                                        <th>Plan</th>
                                        <th>Vendor</th>
                                        <th>Amount</th>
                                        <th>Payment Method</th>
                                        <th>Requested</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSubscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                                                {subscriptionRequests.length === 0 ? 
                                                    'No business subscription requests found.' : 
                                                    'No matching subscriptions found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSubscriptions.map((s: any, index: number) => {
                                            const isPending = s.status === 'pending';
                                            const isApproved = s.status === 'approved';
                                            const isRejected = s.status === 'rejected';
                                            const plan = s.plan || s.planType || 'monthly';

                                            return (
                                                <tr key={s.id}>
                                                    <td>{(subCurrentPage - 1) * subItemsPerPage + index + 1}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                                            {s.businessName || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '13px', color: '#495057' }}>
                                                            {s.businessEmail || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={styles.businessTypeBadge} style={{
                                                            background: plan === 'yearly' ? '#e8f5e9' : '#e3f2fd',
                                                            color: plan === 'yearly' ? '#2e7d32' : '#0d47a1',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            display: 'inline-block'
                                                        }}>
                                                            {plan === 'yearly' ? '📅 Yearly' : '📆 Monthly'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div style={{ fontWeight: 500, fontSize: '14px' }}>
                                                                {s.vendorName || 'N/A'}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                                                {s.vendorEmail || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 600, color: '#1a1a2e' }}>
                                                        PKR {s.amount ? Number(s.amount).toLocaleString() : '0'}
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div style={{ fontSize: '13px' }}>
                                                                {s.paymentMethod || 'N/A'}
                                                            </div>
                                                            {s.accountNumber && s.accountNumber !== 'N/A' && (
                                                                <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                                                    Acc: {s.accountNumber}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize: '13px' }}>
                                                        {s.createdAt || s.requestedAt || 'N/A'}
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${
                                                            isApproved ? styles.statusApproved : 
                                                            isRejected ? styles.statusRejected : 
                                                            styles.statusPending
                                                        }`}>
                                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {isPending ? (
                                                            <div className={styles.actionIcons}>
                                                                <button 
                                                                    className={styles.iconBtn} 
                                                                    onClick={() => handleViewSubscription(s)}
                                                                    title="View Details"
                                                                >
                                                                    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                                        <circle cx="12" cy="12" r="3"/>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className={styles.iconBtn} 
                                                                    onClick={() => handleBusinessSubscriptionStatus(s.id, 'approved')}
                                                                    title="Approve"
                                                                    style={{ color: '#28a745' }}
                                                                >
                                                                    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="20 6 9 17 4 12"/>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className={styles.iconBtn} 
                                                                    onClick={() => handleBusinessSubscriptionStatus(s.id, 'rejected')}
                                                                    title="Reject"
                                                                    style={{ color: '#dc3545' }}
                                                                >
                                                                    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                                                                    onClick={() => handleDeleteSubscription(s.id)}
                                                                    title="Delete"
                                                                >
                                                                    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="3 6 5 6 21 6"/>
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className={styles.actionIcons}>
                                                                <button 
                                                                    className={styles.iconBtn} 
                                                                    onClick={() => handleViewSubscription(s)}
                                                                    title="View Details"
                                                                >
                                                                    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                                        <circle cx="12" cy="12" r="3"/>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                                                                    onClick={() => handleDeleteSubscription(s.id)}
                                                                    title="Delete"
                                                                >
                                                                    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="3 6 5 6 21 6"/>
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {subTotalItems > 0 && (
                            <div className={styles.paginationFooter}>
                                <div className={styles.paginationButtons}>
                                    <button 
                                        className={styles.pageBtn}
                                        disabled={subCurrentPage === 1}
                                        onClick={() => setSubCurrentPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        ◀ Previous
                                    </button>
                                    
                                    <div className={styles.pageNumbers}>
                                        {subTotalPages > 5 && subCurrentPage > 3 && (
                                            <>
                                                <button className={styles.pageNumBtn} onClick={() => setSubCurrentPage(1)}>1</button>
                                                <span className={styles.pageDots}>…</span>
                                            </>
                                        )}

                                        {Array.from({ length: Math.min(subTotalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (subTotalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (subCurrentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (subCurrentPage >= subTotalPages - 2) {
                                                pageNum = subTotalPages - 4 + i;
                                            } else {
                                                pageNum = subCurrentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`${styles.pageNumBtn} ${subCurrentPage === pageNum ? styles.pageNumActive : ''}`}
                                                    onClick={() => setSubCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        {subTotalPages > 5 && subCurrentPage < subTotalPages - 2 && (
                                            <>
                                                <span className={styles.pageDots}>…</span>
                                                <button className={styles.pageNumBtn} onClick={() => setSubCurrentPage(subTotalPages)}>{subTotalPages}</button>
                                            </>
                                        )}
                                    </div>

                                    <button 
                                        className={styles.pageBtn}
                                        disabled={subCurrentPage === subTotalPages || subTotalPages === 0}
                                        onClick={() => setSubCurrentPage(prev => Math.min(prev + 1, subTotalPages))}
                                    >
                                        Next ▶
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={styles.tableFooter}>
                            <span className={styles.vendorCount}>
                                Total: {subTotalItems} 
                                {subscriptionRequests.length > 0 && (
                                    <span style={{ marginLeft: '12px', fontSize: '12px', fontWeight: 'normal', color: '#6c757d' }}>
                                        (Pending: {subscriptionRequests.filter(s => s.status === 'pending').length} | 
                                        Approved: {subscriptionRequests.filter(s => s.status === 'approved').length} | 
                                        Rejected: {subscriptionRequests.filter(s => s.status === 'rejected').length})
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                )}

                {subActiveTab === 'plans' && (
                    <div className={styles.detailTabContent}>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                            gap: '20px',
                            marginTop: '10px'
                        }}>
                            {subscriptionPlans.map((plan) => (
                                <div key={plan.id} style={{
                                    background: 'white',
                                    border: `2px solid ${plan.color}`,
                                    borderRadius: '16px',
                                    padding: '24px 20px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                                }}
                                >
                                    {plan.id === 'yearly' && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '-30px',
                                            background: '#28a745',
                                            color: 'white',
                                            padding: '4px 30px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            transform: 'rotate(45deg)',
                                            letterSpacing: '1px'
                                        }}>
                                            BEST VALUE
                                        </div>
                                    )}
                                    <div style={{
                                        fontSize: '36px',
                                        marginBottom: '12px',
                                        display: 'block'
                                    }}>
                                        {plan.id === 'free' ? '🆓' : plan.id === 'monthly' ? '📆' : '📅'}
                                    </div>
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: '700',
                                        color: '#1a1a2e',
                                        margin: '0 0 6px 0'
                                    }}>
                                        {plan.name}
                                    </h3>
                                    <div style={{
                                        fontSize: '28px',
                                        fontWeight: '700',
                                        color: plan.color,
                                        margin: '8px 0 4px 0'
                                    }}>
                                        {plan.price}
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#6c757d',
                                        marginBottom: '16px'
                                    }}>
                                        {plan.period}
                                    </div>
                                    <div style={{
                                        borderTop: '1px solid #e8ecf1',
                                        paddingTop: '16px',
                                        marginTop: '4px'
                                    }}>
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '6px 0',
                                                fontSize: '14px',
                                                color: '#333',
                                                textAlign: 'left'
                                            }}>
                                                <span style={{ color: plan.color }}>✅</span>
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                    <button style={{
                                        width: '100%',
                                        padding: '12px',
                                        marginTop: '16px',
                                        background: plan.color,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: plan.id === 'free' ? 'default' : 'pointer',
                                        opacity: plan.id === 'free' ? 0.6 : 1,
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (plan.id !== 'free') {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = `0 4px 16px ${plan.color}40`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    >
                                        {plan.id === 'free' ? 'Current Plan' : 'Select Plan'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // ✅ RENDER ADMIN EMPLOYEES
    // ============================================
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

    // ============================================
    // ✅ RENDER COMMISSION TYPES
    // ============================================
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

    // ============================================
    // ✅ RENDER COUPONS
    // ============================================
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

    // ============================================
    // ✅ RENDER ANNOUNCEMENTS
    // ============================================
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

    // ============================================
    // ✅ RENDER CUSTOMERS
    // ============================================
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

    // ============================================
    // ✅ RENDER RIDERS
    // ============================================
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
    // ✅ RENDER ADD EMPLOYEE MODAL
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

    // ============================================
    // ✅ RENDER ADD COUPON MODAL
    // ============================================
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

    // ============================================
    // ✅ RENDER ADD ANNOUNCEMENT MODAL
    // ============================================
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

    // ============================================
    // ✅ RENDER ADD COMMISSION MODAL
    // ============================================
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
    // ✅ GET TAB TITLE
    // ============================================
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

    // ============================================
    // ✅ LOADING STATE
    // ============================================
    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    // ============================================
    // ✅ MAIN RENDER
    // ============================================
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
            {renderAddVendorModal()}
        </div>
    );
}