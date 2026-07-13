// app/dashboard/vendor/page.tsx

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './vendor.module.css';
import { paymentService } from '../../lib/payment.service';

// ============================================
// TYPES
// ============================================
interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface Product {
    id: string;
    name: string;
    price: number | string;
    stock: number;
    status: string;
    image?: string;
    images?: string[];
    colors?: string[];
    sizes?: string[];
    description?: string;
}

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Order {
    id: string;
    customer: string;
    amount: string;
    status: string;
    date: string;
}

interface Business {
    _id: string;
    businessName: string;
    businessTypeId: { _id: string; name: string };
    status: 'pending' | 'approved' | 'rejected';
    isDefault: boolean;
    businessEmail: string;
    phone: string;
    addressCity: string;
    addressCountry: string;
    subscriptionStatus?: 'pending' | 'approved' | 'rejected' | 'none';
}

interface DashboardSummary {
    totalProducts: number;
    totalOrders: number;
    totalEarnings: number;
    pendingOrders: number;
    availableBalance: number;
    pendingWithdrawals: number;
    productsList: Product[];
    employeesList: Employee[];
    businesses: Business[];
    selectedBusinessId?: string;
    subscription: {
        plan: string;
        status: string;
        daysRemaining: number;
        showTrialWarning: boolean;
        hasRequestedExtension: boolean;
        isApproved?: boolean;
        isPendingApproval?: boolean;
        endDate?: string | null;
    };
}

interface WithdrawalFormData {
    amount: string;
    method: 'easypaisa' | 'jazzcash' | 'bank';
    accountNumber: string;
    accountHolderName: string;
}

interface StoreHours {
    [key: string]: { open: string; close: string };
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
}

// ✅ WORK HOURS TYPES
interface DaySlots {
    slots: { from: string; to: string }[];
    type: 'enter_hours' | 'open_all_day' | 'closed_all_day' | 'by_appointment';
}

interface BusinessFormData {
    businessTypeId: string;
    businessName: string;
    businessNtn: string;
    businessEmail: string;
    phone: string;
    whatsapp: string;
    landline: string;
    addressCity: string;
    addressCountry: string;
    mapLocation: string;
    // ✅ WORK HOURS - MULTIPLE SLOTS PER DAY
    workHoursType: 'enter_hours' | 'open_all_day' | 'closed_all_day' | 'by_appointment';
    workHoursSlots: {
        monday: DaySlots;
        tuesday: DaySlots;
        wednesday: DaySlots;
        thursday: DaySlots;
        friday: DaySlots;
        saturday: DaySlots;
        sunday: DaySlots;
    };
    copyScheduleToOtherDays: boolean;
    copyFromDay: string;
    timezone: string;
    vacationReason: string;
    vacationReturnDate: string;
    // ✅ EXISTING FIELDS
    open24_7: boolean;
    isClosed: boolean;
    onVacation: boolean;
    businessTiming: {
        monday: { open: string; close: string };
        tuesday: { open: string; close: string };
        wednesday: { open: string; close: string };
        thursday: { open: string; close: string };
        friday: { open: string; close: string };
        saturday: { open: string; close: string };
        sunday: { open: string; close: string };
    };
    subtypes: string[];
    otherSubtype: string;
    socialLinks: string[];
    subscriptionPlan: 'free' | 'monthly' | 'yearly';
}

const API_BASE = 'http://localhost:5002/api/auth/vendor';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function VendorDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Dashboard Data
    const [summary, setSummary] = useState<DashboardSummary>({
        totalProducts: 0,
        totalOrders: 0,
        totalEarnings: 0,
        pendingOrders: 0,
        availableBalance: 0,
        pendingWithdrawals: 0,
        productsList: [],
        employeesList: [],
        businesses: [],
        selectedBusinessId: '',
        subscription: {
            plan: 'free',
            status: 'active',
            daysRemaining: 0,
            showTrialWarning: false,
            hasRequestedExtension: false
        }
    });

    // ============================================
    // BUSINESS REGISTRATION STATE
    // ============================================
    const [showBusinessRegistration, setShowBusinessRegistration] = useState(false);
    const [businessStep, setBusinessStep] = useState(1);
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [subtypes, setSubtypes] = useState<BusinessSubtype[]>([]);
    const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);
    const [showOtherField, setShowOtherField] = useState(false);
    const [businessLoading, setBusinessLoading] = useState(false);
    
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    const [businessForm, setBusinessForm] = useState<BusinessFormData>({
        businessTypeId: '',
        businessName: '',
        businessNtn: '',
        businessEmail: '',
        phone: '',
        whatsapp: '',
        landline: '',
        addressCity: '',
        addressCountry: '',
        mapLocation: '',
        // ✅ WORK HOURS
        workHoursType: 'enter_hours',
        workHoursSlots: {
            monday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }], type: 'enter_hours' },
            tuesday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }], type: 'enter_hours' },
            wednesday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }], type: 'enter_hours' },
            thursday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }], type: 'enter_hours' },
            friday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }], type: 'enter_hours' },
            saturday: { slots: [{ from: '10:00', to: '16:00' }], type: 'enter_hours' },
            sunday: { slots: [], type: 'closed_all_day' }
        },
        copyScheduleToOtherDays: false,
        copyFromDay: 'monday',
        timezone: 'UTC+5 (Pakistan)',
        vacationReason: '',
        vacationReturnDate: '',
        // ✅ EXISTING FIELDS
        open24_7: false,
        isClosed: false,
        onVacation: false,
        businessTiming: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '17:00' },
            saturday: { open: '10:00', close: '16:00' },
            sunday: { open: '', close: '' }
        },
        subtypes: [],
        otherSubtype: '',
        socialLinks: [],
        subscriptionPlan: 'free'
    });

    // Business Images
    const [businessLogo, setBusinessLogo] = useState<File | null>(null);
    const [businessLogoPreview, setBusinessLogoPreview] = useState<string>('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string>('');
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // ============================================
    // SUBSCRIPTION MODAL STATE
    // ============================================
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState({
        plan: 'monthly' as 'monthly' | 'yearly',
        amount: 1000,
        paymentMethod: 'easypaisa' as 'easypaisa' | 'jazzcash' | 'bank',
        accountNumber: '',
        accountHolderName: '',
        phoneNumber: '',
        bankName: '',
        accountType: 'personal',
        notes: ''
    });
    
    const [products, setProducts] = useState<Product[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [orders, setOrders] = useState<Order[]>([
        { id: '#ORD-001', customer: 'Ali Khan', amount: 'PKR 2,500', status: 'Pending', date: '2024-01-15' },
        { id: '#ORD-002', customer: 'Sara Ahmed', amount: 'PKR 1,800', status: 'Processing', date: '2024-01-14' },
        { id: '#ORD-003', customer: 'Usman Malik', amount: 'PKR 3,200', status: 'Ready for Pickup', date: '2024-01-13' },
        { id: '#ORD-004', customer: 'Fatima Ali', amount: 'PKR 5,000', status: 'Delivered', date: '2024-01-12' }
    ]);

    // Store Hours
    const [storeHours, setStoreHours] = useState<StoreHours>({
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { open: '', close: '' },
    });

    // Product Form
    const [productForm, setProductForm] = useState({
        name: '',
        price: '',
        stock: '',
        description: '',
        colors: [] as string[],
        sizes: [] as string[],
        images: [] as File[],
        imagePreviews: [] as string[]
    });

    // Employee Form
    const [employeeForm, setEmployeeForm] = useState({ 
        name: '', 
        email: '', 
        role: 'Inventory Manager' 
    });

    // Withdrawal Form
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalFormData>({
        amount: '',
        method: 'easypaisa',
        accountNumber: '',
        accountHolderName: ''
    });

    // Modal States
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showTrialWarning, setShowTrialWarning] = useState(false);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ============================================
    // WORK HOURS HELPER FUNCTIONS
    // ============================================
    const getDayType = (day: string): 'enter_hours' | 'open_all_day' | 'closed_all_day' | 'by_appointment' => {
        return businessForm.workHoursSlots[day as keyof typeof businessForm.workHoursSlots]?.type || 'enter_hours';
    };

    const getDaySlots = (day: string): { from: string; to: string }[] => {
        return businessForm.workHoursSlots[day as keyof typeof businessForm.workHoursSlots]?.slots || [];
    };

    const updateDaySlots = (day: string, slots: { from: string; to: string }[]) => {
        setBusinessForm(prev => ({
            ...prev,
            workHoursSlots: {
                ...prev.workHoursSlots,
                [day]: { ...prev.workHoursSlots[day as keyof typeof prev.workHoursSlots], slots }
            }
        }));
    };

    const updateDayType = (day: string, type: 'enter_hours' | 'open_all_day' | 'closed_all_day' | 'by_appointment') => {
        setBusinessForm(prev => ({
            ...prev,
            workHoursSlots: {
                ...prev.workHoursSlots,
                [day]: { 
                    ...prev.workHoursSlots[day as keyof typeof prev.workHoursSlots], 
                    type,
                    slots: type === 'enter_hours' ? prev.workHoursSlots[day as keyof typeof prev.workHoursSlots]?.slots || [{ from: '09:00', to: '18:00' }] : []
                }
            }
        }));
    };

    const addSlot = (day: string) => {
        const currentSlots = getDaySlots(day);
        const lastSlot = currentSlots[currentSlots.length - 1];
        const newFrom = lastSlot?.to || '09:00';
        // Add 2 hours to the last slot's end time
        const [h, m] = newFrom.split(':').map(Number);
        const newH = h + 2;
        const newTo = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        setBusinessForm(prev => ({
            ...prev,
            workHoursSlots: {
                ...prev.workHoursSlots,
                [day]: { 
                    ...prev.workHoursSlots[day as keyof typeof prev.workHoursSlots], 
                    slots: [...currentSlots, { from: newFrom, to: newTo }]
                }
            }
        }));
    };

    const removeSlot = (day: string, index: number) => {
        const currentSlots = getDaySlots(day);
        if (currentSlots.length <= 1) return;
        setBusinessForm(prev => ({
            ...prev,
            workHoursSlots: {
                ...prev.workHoursSlots,
                [day]: { 
                    ...prev.workHoursSlots[day as keyof typeof prev.workHoursSlots], 
                    slots: currentSlots.filter((_, i) => i !== index)
                }
            }
        }));
    };

    const updateSlot = (day: string, index: number, field: 'from' | 'to', value: string) => {
        const currentSlots = getDaySlots(day);
        const updatedSlots = currentSlots.map((slot, i) => 
            i === index ? { ...slot, [field]: value } : slot
        );
        setBusinessForm(prev => ({
            ...prev,
            workHoursSlots: {
                ...prev.workHoursSlots,
                [day]: { 
                    ...prev.workHoursSlots[day as keyof typeof prev.workHoursSlots], 
                    slots: updatedSlots
                }
            }
        }));
    };

    const copyScheduleToAllDays = () => {
        const sourceDay = businessForm.copyFromDay;
        const sourceSlots = getDaySlots(sourceDay);
        const sourceType = getDayType(sourceDay);
        
        DAYS.forEach(day => {
            if (day !== sourceDay) {
                setBusinessForm(prev => ({
                    ...prev,
                    workHoursSlots: {
                        ...prev.workHoursSlots,
                        [day]: { 
                            slots: sourceSlots.map(s => ({ ...s })), 
                            type: sourceType 
                        }
                    }
                }));
            }
        });
        showToast('✅ Schedule copied to all days!', 'success');
    };

    // ============================================
    // TOAST
    // ============================================
    const showToast = (text: string, type: 'success' | 'error') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 5000);
    };

    // ============================================
    // FETCH DASHBOARD
    // ============================================
    const fetchDashboardData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE}/dashboard-summary`, config);

            if (response.data && response.data.success) {
                const data = response.data.data;
                setSummary({
                    ...data,
                    businesses: data.businesses || [],
                    selectedBusinessId: data.selectedBusinessId || ''
                });
                setProducts(data.productsList || []);
                setEmployees(data.employeesList || []);
                
                if (data.subscription?.showTrialWarning) {
                    setShowTrialWarning(true);
                }
            }
        } catch (error: any) {
            console.error('Error fetching dashboard summary:', error);
            if (error.response?.status !== 404) {
                showToast(error.response?.data?.message || 'Failed to fetch dashboard data', 'error');
            }
        }
    }, []);

    // ============================================
    // BUSINESS TYPES
    // ============================================
    const fetchBusinessTypes = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE}/business/types`, config);
            if (response.data.success) {
                setBusinessTypes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching business types:', error);
        }
    };

    const fetchSubtypes = async (typeId: string) => {
        const token = localStorage.getItem('token');
        if (!token || !typeId) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE}/business/subtypes/${typeId}`, config);
            if (response.data.success) {
                setSubtypes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching subtypes:', error);
        }
    };

    // ============================================
    // BUSINESS HANDLERS
    // ============================================
    const handleBusinessTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const typeId = e.target.value;
        setBusinessForm({ ...businessForm, businessTypeId: typeId, subtypes: [] });
        setSelectedSubtypes([]);
        if (typeId) {
            fetchSubtypes(typeId);
        } else {
            setSubtypes([]);
        }
    };

    const handleSubtypeToggle = (subtypeId: string) => {
        setSelectedSubtypes(prev => {
            if (prev.includes(subtypeId)) {
                return prev.filter(id => id !== subtypeId);
            } else {
                return [...prev, subtypeId];
            }
        });
        setBusinessForm(prev => ({
            ...prev,
            subtypes: prev.subtypes.includes(subtypeId) 
                ? prev.subtypes.filter(id => id !== subtypeId)
                : [...prev.subtypes, subtypeId]
        }));
    };

    const addSocialLink = () => {
        setBusinessForm(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, '']
        }));
    };

    const removeSocialLink = (index: number) => {
        setBusinessForm(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter((_, i) => i !== index)
        }));
    };

    const updateSocialLink = (index: number, value: string) => {
        setBusinessForm(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.map((link, i) => i === index ? value : link)
        }));
    };

    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'logo' | 'cover' | 'gallery'
    ) => {
        const files = e.target.files;
        if (!files) return;

        if (type === 'logo' && files[0]) {
            setBusinessLogo(files[0]);
            setBusinessLogoPreview(URL.createObjectURL(files[0]));
        } else if (type === 'cover' && files[0]) {
            setCoverImage(files[0]);
            setCoverImagePreview(URL.createObjectURL(files[0]));
        } else if (type === 'gallery') {
            const fileArray = Array.from(files);
            if (galleryImages.length + fileArray.length > 10) {
                showToast('Maximum 10 gallery images allowed', 'error');
                return;
            }
            setGalleryImages(prev => [...prev, ...fileArray]);
            const previews = fileArray.map(file => URL.createObjectURL(file));
            setGalleryPreviews(prev => [...prev, ...previews]);
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const resetBusinessForm = () => {
        setBusinessForm({
            businessTypeId: '',
            businessName: '',
            businessNtn: '',
            businessEmail: '',
            phone: '',
            whatsapp: '',
            landline: '',
            addressCity: '',
            addressCountry: '',
            mapLocation: '',
            // ✅ RESET WORK HOURS
            workHoursType: 'enter_hours',
            workHoursSlots: {
                monday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }], type: 'enter_hours' },
                tuesday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }], type: 'enter_hours' },
                wednesday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }], type: 'enter_hours' },
                thursday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }], type: 'enter_hours' },
                friday: { slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }], type: 'enter_hours' },
                saturday: { slots: [{ from: '10:00', to: '16:00' }], type: 'enter_hours' },
                sunday: { slots: [], type: 'closed_all_day' }
            },
            copyScheduleToOtherDays: false,
            copyFromDay: 'monday',
            timezone: 'UTC+5 (Pakistan)',
            vacationReason: '',
            vacationReturnDate: '',
            // ✅ EXISTING
            open24_7: false,
            isClosed: false,
            onVacation: false,
            businessTiming: {
                monday: { open: '09:00', close: '18:00' },
                tuesday: { open: '09:00', close: '18:00' },
                wednesday: { open: '09:00', close: '18:00' },
                thursday: { open: '09:00', close: '18:00' },
                friday: { open: '09:00', close: '17:00' },
                saturday: { open: '10:00', close: '16:00' },
                sunday: { open: '', close: '' }
            },
            subtypes: [],
            otherSubtype: '',
            socialLinks: [],
            subscriptionPlan: 'free'
        });
        setSelectedSubtypes([]);
        setSelectedProductIds([]);
        setBusinessLogo(null);
        setBusinessLogoPreview('');
        setCoverImage(null);
        setCoverImagePreview('');
        setGalleryImages([]);
        setGalleryPreviews([]);
        setShowOtherField(false);
        setBusinessStep(1);
    };

    // ============================================
    // SUBMIT BUSINESS
    // ============================================
    const handleBusinessSubmit = async () => {
        setBusinessLoading(true);

        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login again', 'error');
            setBusinessLoading(false);
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('businessTypeId', businessForm.businessTypeId);
        formDataToSend.append('businessName', businessForm.businessName);
        formDataToSend.append('businessNtn', businessForm.businessNtn);
        formDataToSend.append('businessEmail', businessForm.businessEmail);
        formDataToSend.append('phone', businessForm.phone);
        formDataToSend.append('whatsapp', businessForm.whatsapp);
        formDataToSend.append('landline', businessForm.landline);
        formDataToSend.append('addressCity', businessForm.addressCity);
        formDataToSend.append('addressCountry', businessForm.addressCountry);
        formDataToSend.append('mapLocation', businessForm.mapLocation);
        // ✅ WORK HOURS
        formDataToSend.append('workHoursType', businessForm.workHoursType);
        formDataToSend.append('workHoursSlots', JSON.stringify(businessForm.workHoursSlots));
        formDataToSend.append('copyScheduleToOtherDays', String(businessForm.copyScheduleToOtherDays));
        formDataToSend.append('copyFromDay', businessForm.copyFromDay);
        formDataToSend.append('timezone', businessForm.timezone);
        formDataToSend.append('vacationReason', businessForm.vacationReason);
        formDataToSend.append('vacationReturnDate', businessForm.vacationReturnDate);
        // ✅ EXISTING
        formDataToSend.append('open24_7', String(businessForm.open24_7));
        formDataToSend.append('isClosed', String(businessForm.isClosed));
        formDataToSend.append('onVacation', String(businessForm.onVacation));
        formDataToSend.append('businessTiming', JSON.stringify(businessForm.businessTiming));
        formDataToSend.append('subtypes', JSON.stringify(selectedSubtypes));
        formDataToSend.append('otherSubtype', businessForm.otherSubtype);
        formDataToSend.append('socialLinks', JSON.stringify(businessForm.socialLinks));
        formDataToSend.append('productIds', JSON.stringify(selectedProductIds));
        formDataToSend.append('subscriptionPlan', businessForm.subscriptionPlan);

        // ✅ Add subscription payment details if plan is not free
        if (businessForm.subscriptionPlan !== 'free') {
            formDataToSend.append('paymentMethod', subscriptionData.paymentMethod || 'easypaisa');
            formDataToSend.append('accountNumber', subscriptionData.accountNumber || 'N/A');
            formDataToSend.append('accountHolderName', subscriptionData.accountHolderName || user?.name || 'N/A');
            formDataToSend.append('phoneNumber', subscriptionData.phoneNumber || businessForm.phone || '');
            formDataToSend.append('bankName', subscriptionData.bankName || '');
            formDataToSend.append('notes', subscriptionData.notes || '');
        }

        if (businessLogo) formDataToSend.append('businessLogo', businessLogo);
        if (coverImage) formDataToSend.append('coverImage', coverImage);
        galleryImages.forEach(img => formDataToSend.append('galleryImages', img));

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            const response = await axios.post(`${API_BASE}/business/register`, formDataToSend, config);

            if (response.data.success) {
                showToast('✅ Business registered successfully!', 'success');
                setShowBusinessRegistration(false);
                setShowSubscriptionModal(false);
                resetBusinessForm();
                await fetchDashboardData();
            } else {
                showToast(response.data.message || 'Failed to register business', 'error');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            showToast(error.response?.data?.message || 'Failed to register business', 'error');
        } finally {
            setBusinessLoading(false);
        }
    };

    // ============================================
    // BUSINESS SWITCHER
    // ============================================
    const switchBusiness = async (businessId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_BASE}/business/default/${businessId}`, {}, config);
            await fetchDashboardData();
            showToast('✅ Business switched successfully!', 'success');
        } catch (error) {
            console.error('Error switching business:', error);
            showToast('Failed to switch business', 'error');
        }
    };

    // ============================================
    // SUBSCRIPTION REQUEST
    // ============================================
    const handleSubscriptionRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        const businessId = summary.selectedBusinessId;
        if (!businessId) {
            showToast('Please select a business first.', 'error');
            return;
        }

        // ✅ Check if business already has pending request
        const business = summary.businesses.find(b => b._id === businessId);
        if (business?.subscriptionStatus === 'pending') {
            showToast(`⚠️ This business already has a pending subscription request. Please wait for admin approval.`, 'error');
            return;
        }

        if (!subscriptionData.accountNumber) {
            showToast('Please enter account number', 'error');
            return;
        }
        if (!subscriptionData.accountHolderName) {
            showToast('Please enter account holder name', 'error');
            return;
        }
        if (subscriptionData.paymentMethod !== 'bank' && !subscriptionData.phoneNumber) {
            showToast('Please enter phone number', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(
                `${API_BASE}/business/${businessId}/subscription/request`,
                {
                    plan: subscriptionData.plan,
                    amount: subscriptionData.amount,
                    paymentMethod: subscriptionData.paymentMethod,
                    accountNumber: subscriptionData.accountNumber,
                    accountHolderName: subscriptionData.accountHolderName,
                    phoneNumber: subscriptionData.phoneNumber,
                    bankName: subscriptionData.bankName,
                    accountType: subscriptionData.accountType,
                    notes: subscriptionData.notes
                },
                config
            );

            if (response.data.success) {
                showToast('✅ Subscription request sent to admin for approval!', 'success');
                setShowSubscriptionModal(false);
                setSubscriptionData({
                    plan: 'monthly',
                    amount: 1000,
                    paymentMethod: 'easypaisa',
                    accountNumber: '',
                    accountHolderName: '',
                    phoneNumber: '',
                    bankName: '',
                    accountType: 'personal',
                    notes: ''
                });
                await fetchDashboardData();
            } else {
                showToast(response.data.message || 'Failed to send request', 'error');
            }
        } catch (error: any) {
            console.error('❌ Subscription request error:', error);
            showToast(error.response?.data?.message || 'Failed to send request', 'error');
        }
    };

    // ============================================
    // FETCH PRODUCTS
    // ============================================
    const fetchProducts = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE}/products`, config);

            if (response.data && response.data.success) {
                setProducts(response.data.products || []);
            }
        } catch (error: any) {
            console.error('Error fetching products:', error);
        }
    }, []);

    // ============================================
    // FETCH EMPLOYEES
    // ============================================
    const fetchEmployees = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE}/employees`, config);

            if (response.data && response.data.success) {
                setEmployees(response.data.employees || []);
            }
        } catch (error: any) {
            console.error('Error fetching employees:', error);
        }
    }, []);

    // ============================================
    // INITIAL LOAD
    // ============================================
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/auth/login');
            setLoading(false);
            return;
        }

        try {
            const parsedUser = JSON.parse(userData || '{}') as User;
            setUser(parsedUser);
            fetchDashboardData();
            fetchBusinessTypes();
        } catch (error) {
            console.error('Error parsing user data:', error);
        } finally {
            setLoading(false);
        }
    }, [router, fetchDashboardData]);

    // ============================================
    // ADD PRODUCT
    // ============================================
    const handleAddProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        if (!productForm.name || !productForm.price || !productForm.stock || !productForm.description) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (productForm.images.length === 0) {
            showToast('⚠️ Please upload at least 1 product image', 'error');
            return;
        }

        if (productForm.images.length > 5) {
            showToast('Maximum 5 images allowed', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('name', productForm.name.trim());
        formData.append('price', String(productForm.price).trim());
        formData.append('stock', String(productForm.stock).trim());
        formData.append('description', productForm.description.trim());
        
        if (productForm.colors && productForm.colors.length > 0) {
            formData.append('colors', JSON.stringify(productForm.colors));
        }
        
        if (productForm.sizes && productForm.sizes.length > 0) {
            formData.append('sizes', JSON.stringify(productForm.sizes));
        }

        productForm.images.forEach((file) => {
            formData.append('images', file);
        });

        try {
            const config = { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                } 
            };
            const response = await axios.post(`${API_BASE}/products/add`, formData, config);

            if (response.data.success) {
                showToast('✅ Product added successfully!', 'success');
                setShowAddProduct(false);
                setProductForm({ 
                    name: '', 
                    price: '', 
                    stock: '', 
                    description: '',
                    colors: [],
                    sizes: [],
                    images: [],
                    imagePreviews: []
                });
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                await fetchProducts();
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('❌ Add product error:', error);
            showToast(error.response?.data?.message || 'Failed to add product', 'error');
        }
    };

    // ============================================
    // PRODUCT IMAGES
    // ============================================
    const handleProductImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 5) {
            showToast('Maximum 5 images allowed', 'error');
            e.target.value = '';
            return;
        }

        const previews = files.map(file => URL.createObjectURL(file));
        setProductForm(prev => ({
            ...prev,
            images: files,
            imagePreviews: previews
        }));
    };

    // ============================================
    // PRODUCT VARIATIONS
    // ============================================
    const handleColorAdd = (color: string) => {
        if (color.trim() && !productForm.colors.includes(color.trim())) {
            setProductForm(prev => ({
                ...prev,
                colors: [...prev.colors, color.trim()]
            }));
        }
    };

    const handleColorRemove = (color: string) => {
        setProductForm(prev => ({
            ...prev,
            colors: prev.colors.filter(c => c !== color)
        }));
    };

    const handleSizeAdd = (size: string) => {
        if (size.trim() && !productForm.sizes.includes(size.trim())) {
            setProductForm(prev => ({
                ...prev,
                sizes: [...prev.sizes, size.trim()]
            }));
        }
    };

    const handleSizeRemove = (size: string) => {
        setProductForm(prev => ({
            ...prev,
            sizes: prev.sizes.filter(s => s !== size)
        }));
    };

    // ============================================
    // DELETE PRODUCT
    // ============================================
    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.delete(`${API_BASE}/products/${productId}`, config);

            if (response.data.success) {
                showToast('✅ Product deleted successfully!', 'success');
                await fetchProducts();
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Delete product error:', error);
            showToast(error.response?.data?.message || 'Failed to delete product', 'error');
        }
    };

    // ============================================
    // ADD EMPLOYEE
    // ============================================
    const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${API_BASE}/employees/add`, employeeForm, config);

            if (response.data.success) {
                showToast('✅ Employee added successfully!', 'success');
                setShowAddEmployee(false);
                setEmployeeForm({ name: '', email: '', role: 'Inventory Manager' });
                await fetchEmployees();
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Add employee error:', error);
            showToast(error.response?.data?.message || 'Failed to add employee', 'error');
        }
    };

    // ============================================
    // DELETE EMPLOYEE
    // ============================================
    const handleDeleteEmployee = async (employeeId: string) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;

        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.delete(`${API_BASE}/employees/${employeeId}`, config);

            if (response.data.success) {
                showToast('✅ Employee deleted successfully!', 'success');
                await fetchEmployees();
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Delete employee error:', error);
            showToast(error.response?.data?.message || 'Failed to delete employee', 'error');
        }
    };

    // ============================================
    // WITHDRAWAL
    // ============================================
    const handleWithdrawalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        const amount = Number(withdrawalForm.amount);
        
        if (amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        if (amount < 5000) {
            showToast('Minimum withdrawal amount is PKR 5,000', 'error');
            return;
        }

        if (amount > 1000000) {
            showToast('Maximum withdrawal amount is PKR 1,000,000', 'error');
            return;
        }

        if (amount > summary.availableBalance) {
            showToast(`Insufficient balance. Available: PKR ${summary.availableBalance.toLocaleString()}`, 'error');
            return;
        }

        if (!withdrawalForm.accountNumber || withdrawalForm.accountNumber.length < 6) {
            showToast('Please enter a valid account number', 'error');
            return;
        }

        if (!withdrawalForm.accountHolderName || withdrawalForm.accountHolderName.length < 2) {
            showToast('Please enter account holder name', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${API_BASE}/withdrawal/request`, {
                amount: withdrawalForm.amount,
                method: withdrawalForm.method,
                accountNumber: withdrawalForm.accountNumber,
                accountHolderName: withdrawalForm.accountHolderName
            }, config);

            if (response.data.success) {
                showToast('✅ Withdrawal request sent successfully!', 'success');
                setShowWithdrawalModal(false);
                setWithdrawalForm({
                    amount: '',
                    method: 'easypaisa',
                    accountNumber: '',
                    accountHolderName: ''
                });
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Withdrawal error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to submit withdrawal request';
            showToast(errorMessage, 'error');
        }
    };

    // ============================================
    // SUBSCRIPTION HANDLERS
    // ============================================
    const handleStartFreeTrial = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${API_BASE}/subscription/start-trial`, {}, config);

            if (response.data.success) {
                showToast('✅ Free trial started successfully! You have 30 days.', 'success');
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Start trial error:', error);
            showToast(error.response?.data?.message || 'Failed to start trial', 'error');
        }
    };

    const handleCancelSubscriptionRequest = async () => {
        if (!confirm('Are you sure you want to cancel this subscription request?')) return;

        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${API_BASE}/subscription/cancel-request`, {}, config);

            if (response.data.success) {
                showToast('✅ Subscription request cancelled.', 'success');
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Cancel subscription error:', error);
            showToast(error.response?.data?.message || 'Failed to cancel request', 'error');
        }
    };

    const handleSubscribeWithPayment = async (plan: 'monthly' | 'yearly') => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        const amount = plan === 'yearly' ? 10000 : 1000;
        if (!confirm(`Subscribe to ${plan} plan for PKR ${amount.toLocaleString()}?`)) return;

        try {
            const result = await paymentService.subscribe(plan, token);
            if (result.success) {
                showToast(`✅ ${plan} subscription successful!`, 'success');
                await fetchDashboardData();
            } else {
                showToast(result.message || 'Subscription failed', 'error');
            }
        } catch (error: any) {
            console.error('Subscription error:', error);
            showToast(error.message || 'Something went wrong', 'error');
        }
    };

    const handleRequestExtension = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${API_BASE}/subscription/extend-trial`, {}, config);

            if (response.data.success) {
                showToast('✅ Extension request sent for admin approval!', 'success');
                setShowExtensionModal(false);
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Extension request error:', error);
            showToast(error.response?.data?.message || 'Failed to request extension', 'error');
        }
    };

    // ============================================
    // ORDER STATUS
    // ============================================
    const handleOrderStatusChange = (orderId: string, newStatus: string) => {
        setOrders(prev => prev.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
        ));
        showToast(`✅ Order ${orderId} status updated to: ${newStatus}`, 'success');
    };

    // ============================================
    // STORE HOURS
    // ============================================
    const handleStoreHoursChange = (day: string, type: 'open' | 'close', value: string) => {
        setStoreHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [type]: value }
        }));
    };

    const handleSaveStoreHours = () => {
        showToast('✅ Store hours saved successfully!', 'success');
    };

    // ============================================
    // UTILITY
    // ============================================
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token'); 
        localStorage.removeItem('user');
        router.push('/auth/login');
    }, [router]);

    const handleTabChange = useCallback((tab: string) => { 
        setActiveTab(tab);
        if (tab === 'products') fetchProducts();
        if (tab === 'employees') fetchEmployees();
    }, [fetchProducts, fetchEmployees]);

    // ============================================
    // RENDER WORK HOURS SECTION
    // ============================================
    const renderWorkHours = () => {
        return (
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Work Hours (optional)</label>
                
                {/* Day Selection Tabs */}
                <div className={styles.workHoursDays}>
                    {DAYS_SHORT.map((day, index) => (
                        <span key={day} className={styles.workHoursDay}>
                            {day}
                        </span>
                    ))}
                </div>

                {/* Work Hours Type Options - Global */}
                <div className={styles.workHoursOptions}>
                    <div className={styles.formCheck}>
                        <input
                            type="radio"
                            id="enterHours"
                            name="workHoursType"
                            value="enter_hours"
                            checked={businessForm.workHoursType === 'enter_hours'}
                            onChange={() => setBusinessForm(prev => ({ ...prev, workHoursType: 'enter_hours' }))}
                        />
                        <label htmlFor="enterHours">✏️ Enter hours</label>
                    </div>
                    
                    <div className={styles.formCheck}>
                        <input
                            type="radio"
                            id="openAllDay"
                            name="workHoursType"
                            value="open_all_day"
                            checked={businessForm.workHoursType === 'open_all_day'}
                            onChange={() => setBusinessForm(prev => ({ ...prev, workHoursType: 'open_all_day' }))}
                        />
                        <label htmlFor="openAllDay">🕐 Open all day</label>
                    </div>
                    
                    <div className={styles.formCheck}>
                        <input
                            type="radio"
                            id="closedAllDay"
                            name="workHoursType"
                            value="closed_all_day"
                            checked={businessForm.workHoursType === 'closed_all_day'}
                            onChange={() => setBusinessForm(prev => ({ ...prev, workHoursType: 'closed_all_day' }))}
                        />
                        <label htmlFor="closedAllDay">🚫 Closed all day</label>
                    </div>
                    
                    <div className={styles.formCheck}>
                        <input
                            type="radio"
                            id="byAppointment"
                            name="workHoursType"
                            value="by_appointment"
                            checked={businessForm.workHoursType === 'by_appointment'}
                            onChange={() => setBusinessForm(prev => ({ ...prev, workHoursType: 'by_appointment' }))}
                        />
                        <label htmlFor="byAppointment">📅 By appointment only</label>
                    </div>
                </div>

                {/* Vacation Option */}
                {(businessForm.workHoursType === 'enter_hours' || 
                  businessForm.workHoursType === 'open_all_day' || 
                  businessForm.workHoursType === 'by_appointment') && (
                    <div className={styles.vacationSection}>
                        <div className={styles.formCheck}>
                            <input
                                type="checkbox"
                                id="onVacation"
                                checked={businessForm.onVacation}
                                onChange={(e) => setBusinessForm(prev => ({ ...prev, onVacation: e.target.checked }))}
                            />
                            <label htmlFor="onVacation">🏖️ On Vacation</label>
                        </div>
                        
                        {businessForm.onVacation && (
                            <div className={styles.vacationDetails}>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Reason</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="e.g., Eid Holidays, Annual Leave"
                                            value={businessForm.vacationReason}
                                            onChange={(e) => setBusinessForm(prev => ({ ...prev, vacationReason: e.target.value }))}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Return Date</label>
                                        <input
                                            type="date"
                                            className={styles.formInput}
                                            value={businessForm.vacationReturnDate}
                                            onChange={(e) => setBusinessForm(prev => ({ ...prev, vacationReturnDate: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                {businessForm.vacationReason && (
                                    <div className={styles.vacationMessage}>
                                        <p className={styles.vacationStatus}>
                                            🏖️ On vacation: <strong>{businessForm.vacationReason}</strong>
                                            {businessForm.vacationReturnDate && (
                                                <span> • Returns: <strong>{new Date(businessForm.vacationReturnDate).toLocaleDateString()}</strong></span>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Per-Day Work Hours */}
                <div className={styles.perDayWorkHours}>
                    {DAYS.map((day, index) => {
                        const daySlots = getDaySlots(day);
                        const dayType = getDayType(day);
                        const dayLabel = DAYS_SHORT[index];
                        
                        return (
                            <div key={day} className={styles.dayWorkHours}>
                                <div className={styles.dayWorkHoursHeader}>
                                    <span className={styles.dayWorkHoursLabel}>{dayLabel}</span>
                                    <div className={styles.dayWorkHoursOptions}>
                                        <button
                                            type="button"
                                            className={`${styles.dayTypeBtn} ${dayType === 'enter_hours' ? styles.dayTypeBtnActive : ''}`}
                                            onClick={() => updateDayType(day, 'enter_hours')}
                                        >
                                            ✏️ Enter
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.dayTypeBtn} ${dayType === 'open_all_day' ? styles.dayTypeBtnActive : ''}`}
                                            onClick={() => updateDayType(day, 'open_all_day')}
                                        >
                                            🕐 Open
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.dayTypeBtn} ${dayType === 'closed_all_day' ? styles.dayTypeBtnActive : ''}`}
                                            onClick={() => updateDayType(day, 'closed_all_day')}
                                        >
                                            🚫 Closed
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.dayTypeBtn} ${dayType === 'by_appointment' ? styles.dayTypeBtnActive : ''}`}
                                            onClick={() => updateDayType(day, 'by_appointment')}
                                        >
                                            📅 Appt
                                        </button>
                                    </div>
                                </div>

                                {dayType === 'enter_hours' && (
                                    <div className={styles.daySlotsContainer}>
                                        {daySlots.map((slot, slotIndex) => (
                                            <div key={slotIndex} className={styles.daySlotRow}>
                                                <input
                                                    type="time"
                                                    className={styles.formInput}
                                                    value={slot.from}
                                                    onChange={(e) => updateSlot(day, slotIndex, 'from', e.target.value)}
                                                />
                                                <span className={styles.slotSeparator}>→</span>
                                                <input
                                                    type="time"
                                                    className={styles.formInput}
                                                    value={slot.to}
                                                    onChange={(e) => updateSlot(day, slotIndex, 'to', e.target.value)}
                                                />
                                                {daySlots.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className={styles.removeSlotBtn}
                                                        onClick={() => removeSlot(day, slotIndex)}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className={styles.addSlotBtn}
                                            onClick={() => addSlot(day)}
                                        >
                                            + Add Time Slot
                                        </button>
                                    </div>
                                )}

                                {dayType === 'open_all_day' && (
                                    <div className={styles.dayStatusMessage} style={{ color: '#28a745' }}>
                                        🕐 Open all day
                                    </div>
                                )}

                                {dayType === 'closed_all_day' && (
                                    <div className={styles.dayStatusMessage} style={{ color: '#dc3545' }}>
                                        🚫 Closed all day
                                    </div>
                                )}

                                {dayType === 'by_appointment' && (
                                    <div className={styles.dayStatusMessage} style={{ color: '#4a6cf7' }}>
                                        📅 By appointment only
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Copy Schedule */}
                <div className={styles.copyScheduleSection}>
                    <div className={styles.copyScheduleRow}>
                        <div className={styles.formCheck}>
                            <input
                                type="checkbox"
                                id="copySchedule"
                                checked={businessForm.copyScheduleToOtherDays}
                                onChange={(e) => setBusinessForm(prev => ({ 
                                    ...prev, 
                                    copyScheduleToOtherDays: e.target.checked 
                                }))}
                            />
                            <label htmlFor="copySchedule">📋 Copy schedule to all days</label>
                        </div>
                        {businessForm.copyScheduleToOtherDays && (
                            <>
                                <select
                                    className={styles.formSelect}
                                    value={businessForm.copyFromDay}
                                    onChange={(e) => setBusinessForm(prev => ({ ...prev, copyFromDay: e.target.value }))}
                                    style={{ width: '150px' }}
                                >
                                    {DAYS.map((day, index) => (
                                        <option key={day} value={day}>
                                            From {DAYS_SHORT[index]}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className={styles.primaryBtn}
                                    onClick={copyScheduleToAllDays}
                                    style={{ padding: '6px 16px', fontSize: '12px' }}
                                >
                                    Copy Now
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Timezone */}
                <div className={styles.formGroup} style={{ marginTop: '10px' }}>
                    <label className={styles.formLabel}>Timezone</label>
                    <select
                        className={styles.formSelect}
                        value={businessForm.timezone}
                        onChange={(e) => setBusinessForm(prev => ({ ...prev, timezone: e.target.value }))}
                    >
                        <option value="UTC+5 (Pakistan)">🕐 UTC+5 (Pakistan)</option>
                        <option value="UTC+0 (GMT)">🕐 UTC+0 (GMT)</option>
                        <option value="UTC+1 (CET)">🕐 UTC+1 (CET)</option>
                        <option value="UTC-5 (EST)">🕐 UTC-5 (EST)</option>
                        <option value="UTC-8 (PST)">🕐 UTC-8 (PST)</option>
                    </select>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER SUBSCRIPTION MODAL
    // ============================================
    const renderSubscriptionModal = () => {
        if (!showSubscriptionModal) return null;

        return (
            <div className={`${styles.modalOverlay} ${styles.subscriptionModalOverlay}`} onClick={() => setShowSubscriptionModal(false)}>
                <div className={`${styles.modal} ${styles.subscriptionModal}`} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>📋 Subscription Request</h3>
                        <button className={styles.modalClose} onClick={() => setShowSubscriptionModal(false)}>×</button>
                    </div>
                    
                    <form onSubmit={handleSubscriptionRequest}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Selected Plan</label>
                            <input 
                                type="text" 
                                className={styles.formInput} 
                                value={`${subscriptionData.plan.toUpperCase()} - PKR ${subscriptionData.amount.toLocaleString()}`} 
                                disabled 
                                style={{ fontWeight: 'bold', color: '#4a6cf7' }}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Payment Method *</label>
                            <select
                                className={styles.formSelect}
                                value={subscriptionData.paymentMethod}
                                onChange={(e) => setSubscriptionData({
                                    ...subscriptionData,
                                    paymentMethod: e.target.value as any
                                })}
                                required
                            >
                                <option value="easypaisa">💳 EasyPaisa</option>
                                <option value="jazzcash">💳 JazzCash</option>
                                <option value="bank">🏦 Bank Transfer</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                {subscriptionData.paymentMethod === 'bank' ? 'Bank Account Number *' : 
                                 subscriptionData.paymentMethod === 'easypaisa' ? 'EasyPaisa Number *' :
                                 'JazzCash Number *'}
                            </label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder={
                                    subscriptionData.paymentMethod === 'bank' ? 'Enter bank account number' :
                                    subscriptionData.paymentMethod === 'easypaisa' ? '03XX-XXXXXXX' :
                                    '03XX-XXXXXXX'
                                }
                                value={subscriptionData.accountNumber}
                                onChange={(e) => setSubscriptionData({
                                    ...subscriptionData,
                                    accountNumber: e.target.value
                                })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Account Holder Name *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Full name as per bank/account"
                                value={subscriptionData.accountHolderName}
                                onChange={(e) => setSubscriptionData({
                                    ...subscriptionData,
                                    accountHolderName: e.target.value
                                })}
                                required
                            />
                        </div>

                        {subscriptionData.paymentMethod !== 'bank' && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Phone Number *</label>
                                <input
                                    type="tel"
                                    className={styles.formInput}
                                    placeholder="03XX-XXXXXXX"
                                    value={subscriptionData.phoneNumber}
                                    onChange={(e) => setSubscriptionData({
                                        ...subscriptionData,
                                        phoneNumber: e.target.value
                                    })}
                                    required
                                />
                            </div>
                        )}

                        {subscriptionData.paymentMethod === 'bank' && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Bank Name</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="e.g., HBL, UBL, MCB"
                                    value={subscriptionData.bankName}
                                    onChange={(e) => setSubscriptionData({
                                        ...subscriptionData,
                                        bankName: e.target.value
                                    })}
                                />
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Notes (Optional)</label>
                            <textarea
                                className={styles.formTextarea}
                                rows={2}
                                placeholder="Any additional information"
                                value={subscriptionData.notes}
                                onChange={(e) => setSubscriptionData({
                                    ...subscriptionData,
                                    notes: e.target.value
                                })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button type="submit" className={styles.primaryBtn} style={{ flex: 1 }}>
                                📤 Send Request
                            </button>
                            <button type="button" className={styles.secondaryBtn} onClick={() => setShowSubscriptionModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER BUSINESS REGISTRATION MODAL
    // ============================================
    const renderBusinessRegistrationModal = () => {
        if (!showBusinessRegistration) return null;

        return (
            <div className={styles.modalOverlay} onClick={() => setShowBusinessRegistration(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>🏪 Register New Business</h3>
                        <button className={styles.modalClose} onClick={() => setShowBusinessRegistration(false)}>×</button>
                    </div>
                    
                    {businessStep === 1 && (
                        <div>
                            <h4 style={{ marginBottom: '15px' }}>Step 1: Business Information</h4>
                            
                            {/* Business Type */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Business Type *</label>
                                <select
                                    className={styles.formSelect}
                                    value={businessForm.businessTypeId}
                                    onChange={handleBusinessTypeChange}
                                    required
                                >
                                    <option value="">Select Business Type</option>
                                    {businessTypes.map(type => (
                                        <option key={type._id} value={type._id}>
                                            {type.icon || '📌'} {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subtypes */}
                            {subtypes.length > 0 && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Categories (Select multiple)</label>
                                    <div className={styles.subtypeGrid}>
                                        {subtypes.map(sub => (
                                            <div key={sub._id} className={styles.subtypeOption}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSubtypes.includes(sub._id)}
                                                        onChange={() => handleSubtypeToggle(sub._id)}
                                                    />
                                                    {sub.name}
                                                </label>
                                            </div>
                                        ))}
                                        <div className={styles.subtypeOption}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={showOtherField}
                                                    onChange={() => {
                                                        setShowOtherField(!showOtherField);
                                                        if (!showOtherField) {
                                                            setSelectedSubtypes(prev => [...prev, 'other']);
                                                        } else {
                                                            setSelectedSubtypes(prev => prev.filter(id => id !== 'other'));
                                                            setBusinessForm(prev => ({ ...prev, otherSubtype: '' }));
                                                        }
                                                    }}
                                                />
                                                Other
                                            </label>
                                        </div>
                                    </div>
                                    {showOtherField && (
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Specify other category"
                                            value={businessForm.otherSubtype}
                                            onChange={(e) => setBusinessForm({ ...businessForm, otherSubtype: e.target.value })}
                                            style={{ marginTop: '10px' }}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Business Name */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Business Name *</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Enter business name"
                                    value={businessForm.businessName}
                                    onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Business NTN (Optional)</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Enter NTN number"
                                        value={businessForm.businessNtn}
                                        onChange={(e) => setBusinessForm({ ...businessForm, businessNtn: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Business Email *</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        placeholder="business@email.com"
                                        value={businessForm.businessEmail}
                                        onChange={(e) => setBusinessForm({ ...businessForm, businessEmail: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone Numbers */}
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Phone *</label>
                                    <input
                                        type="tel"
                                        className={styles.formInput}
                                        placeholder="03XX-XXXXXXX"
                                        value={businessForm.phone}
                                        onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>WhatsApp</label>
                                    <input
                                        type="tel"
                                        className={styles.formInput}
                                        placeholder="03XX-XXXXXXX"
                                        value={businessForm.whatsapp}
                                        onChange={(e) => setBusinessForm({ ...businessForm, whatsapp: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Landline</label>
                                    <input
                                        type="tel"
                                        className={styles.formInput}
                                        placeholder="051-XXXXXXX"
                                        value={businessForm.landline}
                                        onChange={(e) => setBusinessForm({ ...businessForm, landline: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>City *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Enter city"
                                        value={businessForm.addressCity}
                                        onChange={(e) => setBusinessForm({ ...businessForm, addressCity: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Country *</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Enter country"
                                        value={businessForm.addressCountry}
                                        onChange={(e) => setBusinessForm({ ...businessForm, addressCountry: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Map Location */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Map Location</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Google Maps URL or coordinates"
                                    value={businessForm.mapLocation}
                                    onChange={(e) => setBusinessForm({ ...businessForm, mapLocation: e.target.value })}
                                />
                            </div>

                            {/* ✅ WORK HOURS - RENDER */}
                            {renderWorkHours()}

                            {/* Social Links */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Social Links</label>
                                {businessForm.socialLinks.map((link, index) => (
                                    <div key={index} className={styles.socialLinkRow}>
                                        <input
                                            type="url"
                                            className={styles.formInput}
                                            placeholder="https://..."
                                            value={link}
                                            onChange={(e) => updateSocialLink(index, e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className={styles.removeBtn}
                                            onClick={() => removeSocialLink(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className={styles.addBtn} onClick={addSocialLink}>
                                    + Add Social Link
                                </button>
                            </div>

                            {/* Add Existing Products */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>📦 Add Existing Products to Business</label>
                                <p className={styles.uploadHint}>
                                    Select products from your inventory to associate with this business                                </p>
                                
                                {products.length === 0 ? (
                                    <div className={styles.noProductsMsg}>
                                        <p>No products found. Please add products first from Products tab.</p>
                                        <button 
                                            type="button" 
                                            className={styles.primaryBtn}
                                            onClick={() => {
                                                setShowBusinessRegistration(false);
                                                setActiveTab('products');
                                            }}
                                            style={{ marginTop: '10px', fontSize: '13px' }}
                                        >
                                            + Go to Products
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.productSelectGrid}>
                                        {products.map((product) => (
                                            <div 
                                                key={product.id} 
                                                className={`${styles.productSelectItem} ${selectedProductIds.includes(product.id) ? styles.productSelectItemActive : ''}`}
                                                onClick={() => {
                                                    setSelectedProductIds(prev => 
                                                        prev.includes(product.id) 
                                                            ? prev.filter(id => id !== product.id)
                                                            : [...prev, product.id]
                                                    );
                                                }}
                                            >
                                                <div className={styles.productSelectImage}>
                                                    {product.images && product.images.length > 0 ? (
                                                        <img src={product.images[0]} alt={product.name} />
                                                    ) : (
                                                        <div className={styles.productSelectPlaceholder}>📷</div>
                                                    )}
                                                </div>
                                                <div className={styles.productSelectInfo}>
                                                    <span className={styles.productSelectName}>{product.name}</span>
                                                    <span className={styles.productSelectPrice}>PKR {product.price}</span>
                                                </div>
                                                {selectedProductIds.includes(product.id) && (
                                                    <div className={styles.productSelectCheck}>✅</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {selectedProductIds.length > 0 && (
                                    <div className={styles.selectedCount}>
                                        ✅ {selectedProductIds.length} product(s) selected for this business
                                    </div>
                                )}
                            </div>

                            {/* Images */}
                            <div className={styles.sectionTitle}>🖼️ Business Images</div>
                            
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Business Logo *</label>
                                    <div className={styles.uploadBox}>
                                        <label className={styles.uploadLabel}>
                                            <span className={styles.uploadIcon}>📷</span>
                                            Upload Logo
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'logo')}
                                                className={styles.uploadInput}
                                                required
                                            />
                                        </label>
                                        {businessLogoPreview && (
                                            <div className={styles.previewContainer}>
                                                <img 
                                                    src={businessLogoPreview} 
                                                    alt="Logo Preview" 
                                                    className={styles.previewImage} 
                                                />
                                                <button 
                                                    type="button" 
                                                    className={styles.removeBtn}
                                                    onClick={() => {
                                                        setBusinessLogo(null);
                                                        setBusinessLogoPreview('');
                                                        if (logoInputRef.current) logoInputRef.current.value = '';
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Cover Image *</label>
                                    <div className={styles.uploadBox}>
                                        <label className={styles.uploadLabel}>
                                            <span className={styles.uploadIcon}>📷</span>
                                            Upload Cover
                                            <input
                                                ref={coverInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'cover')}
                                                className={styles.uploadInput}
                                                required
                                            />
                                        </label>
                                        {coverImagePreview && (
                                            <div className={styles.previewContainer}>
                                                <img 
                                                    src={coverImagePreview} 
                                                    alt="Cover Preview" 
                                                    className={styles.previewImage} 
                                                />
                                                <button 
                                                    type="button" 
                                                    className={styles.removeBtn}
                                                    onClick={() => {
                                                        setCoverImage(null);
                                                        setCoverImagePreview('');
                                                        if (coverInputRef.current) coverInputRef.current.value = '';
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Gallery Images */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Gallery Images</label>
                                <div className={styles.uploadBox}>
                                    <label className={styles.uploadLabel}>
                                        <span className={styles.uploadIcon}>🖼️</span>
                                        Upload Gallery Images (Max 10)
                                        <input
                                            ref={galleryInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleImageUpload(e, 'gallery')}
                                            className={styles.uploadInput}
                                        />
                                    </label>
                                </div>
                                <div className={styles.galleryGrid}>
                                    {galleryPreviews.map((preview, index) => (
                                        <div key={index} className={styles.galleryItem}>
                                            <img src={preview} alt={`Gallery ${index + 1}`} />
                                            <button
                                                type="button"
                                                className={styles.removeBtn}
                                                onClick={() => removeGalleryImage(index)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.buttonRow}>
                                <button type="button" className={styles.secondaryBtn} onClick={() => setShowBusinessRegistration(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className={styles.primaryBtn} 
                                    onClick={() => setBusinessStep(2)}
                                >
                                    Next: Subscription →
                                </button>
                            </div>
                        </div>
                    )}

                    {businessStep === 2 && (
                        <div>
                            <h4 style={{ marginBottom: '15px' }}>Step 2: Select Subscription Plan</h4>
                            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
                                Choose a subscription plan for your business
                            </p>

                            <div className={styles.subscriptionCard}>
                                {/* Free Trial */}
                                <div className={`${styles.planCard} ${businessForm.subscriptionPlan === 'free' ? styles.planCardActive : ''}`}>
                                    <h3 className={styles.planName}>Free Trial</h3>
                                    <p className={styles.planPrice}>PKR 0</p>
                                    <ul className={styles.planFeatures}>
                                        <li>✓ 30 Days Free</li>
                                        <li>✓ 50 Products</li>
                                        <li>✓ Basic Support</li>
                                    </ul>
                                    <button
                                        className={`${styles.primaryBtn} ${businessForm.subscriptionPlan === 'free' ? styles.planActive : ''}`}
                                        onClick={() => {
                                            setBusinessForm(prev => ({ ...prev, subscriptionPlan: 'free' }));
                                            setShowSubscriptionModal(false);
                                        }}
                                    >
                                        {businessForm.subscriptionPlan === 'free' ? '✅ Selected' : 'Select Free'}
                                    </button>
                                </div>

                                {/* Monthly */}
                                <div className={`${styles.planCard} ${businessForm.subscriptionPlan === 'monthly' ? styles.planCardActive : ''}`}>
                                    <h3 className={styles.planName}>Monthly</h3>
                                    <p className={styles.planPrice}>PKR 1,000 <span>/month</span></p>
                                    <ul className={styles.planFeatures}>
                                        <li>✓ Unlimited Products</li>
                                        <li>✓ Priority Support</li>
                                        <li>✓ Advanced Analytics</li>
                                    </ul>
                                    <button
                                        className={`${styles.primaryBtn} ${businessForm.subscriptionPlan === 'monthly' ? styles.planActive : ''}`}
                                        onClick={() => {
                                            setBusinessForm(prev => ({ ...prev, subscriptionPlan: 'monthly' }));
                                            setSubscriptionData(prev => ({ ...prev, plan: 'monthly', amount: 1000 }));
                                            setShowSubscriptionModal(true);
                                        }}
                                    >
                                        {businessForm.subscriptionPlan === 'monthly' ? '✅ Selected' : '💳 Select Monthly'}
                                    </button>
                                </div>

                                {/* Yearly */}
                                <div className={`${styles.planCard} ${businessForm.subscriptionPlan === 'yearly' ? styles.planCardActive : ''}`}>
                                    <h3 className={styles.planName}>Yearly</h3>
                                    <p className={styles.planPrice}>PKR 10,000 <span>/year</span></p>
                                    <ul className={styles.planFeatures}>
                                        <li>✓ Everything in Monthly</li>
                                        <li>✓ 2 Months Free</li>
                                        <li>✓ VIP Support</li>
                                    </ul>
                                    <button
                                        className={`${styles.primaryBtn} ${businessForm.subscriptionPlan === 'yearly' ? styles.planActive : ''}`}
                                        onClick={() => {
                                            setBusinessForm(prev => ({ ...prev, subscriptionPlan: 'yearly' }));
                                            setSubscriptionData(prev => ({ ...prev, plan: 'yearly', amount: 10000 }));
                                            setShowSubscriptionModal(true);
                                        }}
                                    >
                                        {businessForm.subscriptionPlan === 'yearly' ? '✅ Selected' : '💳 Select Yearly'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.buttonRow}>
                                <button type="button" className={styles.secondaryBtn} onClick={() => setBusinessStep(1)}>
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className={styles.successBtn}
                                    onClick={handleBusinessSubmit}
                                    disabled={businessLoading}
                                >
                                    {businessLoading ? '⏳ Submitting...' : '✅ Submit Business'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER WITHDRAWAL MODAL
    // ============================================
    const renderWithdrawalModal = () => {
        if (!showWithdrawalModal) return null;

        return (
            <div className={styles.modalOverlay} onClick={() => setShowWithdrawalModal(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>💰 Request Withdrawal</h3>
                        <button className={styles.modalClose} onClick={() => setShowWithdrawalModal(false)}>×</button>
                    </div>
                    
                    <form onSubmit={handleWithdrawalSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Available Balance</label>
                            <div style={{ 
                                fontSize: '22px', 
                                fontWeight: 'bold', 
                                color: '#4a6cf7',
                                padding: '10px',
                                background: '#f0f4ff',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                PKR {summary.availableBalance.toLocaleString()}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Amount (PKR) *</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                placeholder="Enter amount to withdraw"
                                value={withdrawalForm.amount}
                                onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                                min="5000"
                                max="1000000"
                                required
                            />
                            <small style={{ color: '#6c757d', display: 'block', marginTop: '4px' }}>
                                Minimum: PKR 5,000 | Maximum: PKR 1,000,000
                            </small>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Payment Method *</label>
                            <select
                                className={styles.formSelect}
                                value={withdrawalForm.method}
                                onChange={(e) => setWithdrawalForm({...withdrawalForm, method: e.target.value as any})}
                                required
                            >
                                <option value="easypaisa">💳 EasyPaisa</option>
                                <option value="jazzcash">💳 JazzCash</option>
                                <option value="bank">🏦 Bank Account</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                {withdrawalForm.method === 'easypaisa' ? 'EasyPaisa Number *' :
                                 withdrawalForm.method === 'jazzcash' ? 'JazzCash Number *' :
                                 'Bank Account Number *'}
                            </label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder={
                                    withdrawalForm.method === 'easypaisa' ? '03XX-XXXXXXX' :
                                    withdrawalForm.method === 'jazzcash' ? '03XX-XXXXXXX' :
                                    'IBAN or Account Number'
                                }
                                value={withdrawalForm.accountNumber}
                                onChange={(e) => setWithdrawalForm({...withdrawalForm, accountNumber: e.target.value})}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Account Holder Name *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Full name as per bank/account"
                                value={withdrawalForm.accountHolderName}
                                onChange={(e) => setWithdrawalForm({...withdrawalForm, accountHolderName: e.target.value})}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button type="submit" className={styles.primaryBtn} style={{ flex: 1 }}>
                                📤 Submit Request
                            </button>
                            <button type="button" className={styles.secondaryBtn} onClick={() => setShowWithdrawalModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER ADD PRODUCT MODAL
    // ============================================
    const renderAddProductModal = () => {
        if (!showAddProduct) return null;

        const commonColors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Gold', 'Silver', 'Gray'];
        const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

        return (
            <div className={styles.modalOverlay} onClick={() => setShowAddProduct(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>📦 Add New Product</h3>
                        <button className={styles.modalClose} onClick={() => setShowAddProduct(false)}>×</button>
                    </div>
                    <form onSubmit={handleAddProductSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Product Name *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Enter product name"
                                value={productForm.name}
                                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Price (PKR) *</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    placeholder="1000"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Stock Quantity *</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    placeholder="45"
                                    value={productForm.stock}
                                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Description *</label>
                            <textarea
                                className={styles.formTextarea}
                                rows={3}
                                placeholder="Product description"
                                value={productForm.description}
                                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Product Images * (Max 5)</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className={styles.formInput}
                                accept="image/*"
                                multiple
                                onChange={handleProductImages}
                                required
                            />
                            <small style={{ color: '#6c757d', display: 'block', marginTop: '4px' }}>
                                Upload at least 1 image (Max 5 images)
                            </small>
                            {productForm.imagePreviews.length > 0 && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    {productForm.imagePreviews.map((preview, index) => (
                                        <div key={index} style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}>
                                            <img 
                                                src={preview} 
                                                alt={`Product ${index + 1}`} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProductForm(prev => ({
                                                        ...prev,
                                                        imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
                                                        images: prev.images.filter((_, i) => i !== index)
                                                    }));
                                                    if (fileInputRef.current && productForm.images.length <= 1) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-5px',
                                                    right: '-5px',
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ×
                                            </button>
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '0',
                                                left: '0',
                                                right: '0',
                                                background: 'rgba(0,0,0,0.6)',
                                                color: 'white',
                                                fontSize: '10px',
                                                textAlign: 'center',
                                                padding: '2px'
                                            }}>
                                                Image {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Colors (Optional)</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                {productForm.colors.map(color => (
                                    <span key={color} style={{
                                        padding: '4px 12px',
                                        background: '#f0f2f5',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            background: color.toLowerCase(),
                                            border: '1px solid #ddd'
                                        }}></span>
                                        {color}
                                        <button
                                            type="button"
                                            onClick={() => handleColorRemove(color)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    className={styles.formSelect}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleColorAdd(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    <option value="">Select color...</option>
                                    {commonColors.map(color => (
                                        <option key={color} value={color}>{color}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Sizes (Optional)</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                {productForm.sizes.map(size => (
                                    <span key={size} style={{
                                        padding: '4px 12px',
                                        background: '#f0f2f5',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {size}
                                        <button
                                            type="button"
                                            onClick={() => handleSizeRemove(size)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    className={styles.formSelect}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleSizeAdd(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    <option value="">Select size...</option>
                                    {commonSizes.map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className={styles.primaryBtn} style={{ width: '100%' }}>
                            Add Product
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER ADD EMPLOYEE MODAL
    // ============================================
    const renderAddEmployeeModal = () => {
        if (!showAddEmployee) return null;
        return (
            <div className={styles.modalOverlay} onClick={() => setShowAddEmployee(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>Add Employee</h3>
                        <button className={styles.modalClose} onClick={() => setShowAddEmployee(false)}>×</button>
                    </div>
                    <form onSubmit={handleAddEmployeeSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Full Name</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Enter full name"
                                value={employeeForm.name}
                                onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Email</label>
                            <input
                                type="email"
                                className={styles.formInput}
                                placeholder="Enter email"
                                value={employeeForm.email}
                                onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Role</label>
                            <select
                                className={styles.formSelect}
                                value={employeeForm.role}
                                onChange={(e) => setEmployeeForm({...employeeForm, role: e.target.value})}
                            >
                                <option value="Inventory Manager">Inventory Manager</option>
                                <option value="Order Fulfillment">Order Fulfillment</option>
                                <option value="Customer Support">Customer Support</option>
                            </select>
                        </div>
                        <button type="submit" className={styles.primaryBtn}>Add Employee</button>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER TRIAL WARNING MODAL
    // ============================================
    const renderTrialWarningModal = () => {
        if (!showTrialWarning) return null;
        
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modal} style={{ maxWidth: '450px', border: '3px solid #ffc107' }}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle} style={{ color: '#856404' }}>⚠️ Trial Ending Soon!</h3>
                        <button className={styles.modalClose} onClick={() => setShowTrialWarning(false)}>×</button>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏰</div>
                        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                            Your free trial ends in <span style={{ color: '#dc3545' }}>{summary.subscription.daysRemaining}</span> days!
                        </p>
                        <p style={{ color: '#666', marginTop: '10px' }}>
                            Subscribe now to continue using all features without interruption.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                            <button 
                                className={styles.primaryBtn}
                                onClick={() => {
                                    setShowTrialWarning(false);
                                    setActiveTab('subscription');
                                }}
                            >
                                View Plans
                            </button>
                            {!summary.subscription.hasRequestedExtension && (
                                <button 
                                    className={styles.secondaryBtn}
                                    onClick={() => {
                                        setShowTrialWarning(false);
                                        setShowExtensionModal(true);
                                    }}
                                >
                                    Request Extension
                                </button>
                            )}
                            <button 
                                className={styles.dangerBtn}
                                onClick={() => setShowTrialWarning(false)}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER EXTENSION MODAL
    // ============================================
    const renderExtensionModal = () => {
        if (!showExtensionModal) return null;
        
        return (
            <div className={styles.modalOverlay} onClick={() => setShowExtensionModal(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>📅 Request Free Trial Extension</h3>
                        <button className={styles.modalClose} onClick={() => setShowExtensionModal(false)}>×</button>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔄</div>
                        <p style={{ fontSize: '16px' }}>
                            Your request will be sent to admin for approval.
                        </p>
                        <p style={{ color: '#666', marginTop: '5px' }}>
                            Once approved, your trial will be extended by 15 days.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button className={styles.primaryBtn} onClick={handleRequestExtension}>
                                Request Extension
                            </button>
                            <button className={styles.secondaryBtn} onClick={() => setShowExtensionModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER TOAST
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
    // RENDER PRODUCTS
    // ============================================
    const renderProducts = () => {
        const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const img = e.currentTarget;
            img.style.display = 'none';
            const parent = img.parentElement;
            if (parent) {
                const placeholder = document.createElement('div');
                placeholder.className = styles.productImagePlaceholder;
                placeholder.textContent = '📷 No Image';
                parent.appendChild(placeholder);
            }
        };

        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>📦 Products</h2>
                    <button className={styles.primaryBtn} onClick={() => setShowAddProduct(true)}>
                        + Add New Product
                    </button>
                </div>

                {products.length === 0 ? (
                    <div className={styles.emptyProducts}>
                        <p>No products found. Add your first product!</p>
                    </div>
                ) : (
                    <div className={styles.productGrid}>
                        {products.map((product) => (
                            <div 
                                key={product.id} 
                                className={styles.productCard}
                                onClick={() => setSelectedProduct(product)}
                            >
                                <div className={styles.productImageContainer}>
                                    {product.images && product.images.length > 0 ? (
                                        <img 
                                            src={product.images[0]} 
                                            alt={product.name}
                                            className={styles.productImage}
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        <div className={styles.productImagePlaceholder}>
                                            📷 No Image
                                        </div>
                                    )}
                                    <span className={`${styles.productStatus} ${product.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                                        {product.status}
                                    </span>
                                </div>
                                <div className={styles.productInfo}>
                                    <h3 className={styles.productName}>{product.name}</h3>
                                    <p className={styles.productPrice}>PKR {product.price}</p>
                                    <div className={styles.productMeta}>
                                        <span className={styles.productStock}>📦 {product.stock} in stock</span>
                                        {product.colors && product.colors.length > 0 && (
                                            <div className={styles.productColors}>
                                                {product.colors.slice(0, 3).map((color, i) => (
                                                    <span 
                                                        key={i} 
                                                        className={styles.colorDot} 
                                                        style={{ backgroundColor: color.toLowerCase() }}
                                                        title={color}
                                                    />
                                                ))}
                                                {product.colors.length > 3 && (
                                                    <span className={styles.moreColors}>+{product.colors.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.productActions}>
                                        <button 
                                            className={styles.dangerBtn} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProduct(product.id);
                                            }}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className={styles.secondaryBtn} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduct(product);
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedProduct && (
                    <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
                        <div className={`${styles.modal} ${styles.detailModal}`} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>📦 {selectedProduct.name}</h3>
                                <button className={styles.modalClose} onClick={() => setSelectedProduct(null)}>×</button>
                            </div>
                            <div className={styles.detailContent}>
                                <div className={styles.detailImages}>
                                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                        <div className={styles.detailImageGrid}>
                                            {selectedProduct.images.map((img, index) => (
                                                <img 
                                                    key={index} 
                                                    src={img} 
                                                    alt={`${selectedProduct.name} ${index + 1}`}
                                                    className={styles.detailImage}
                                                    onError={handleImageError}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.noImage}>No images available</div>
                                    )}
                                </div>
                                <div className={styles.detailInfo}>
                                    <p><strong>Price:</strong> PKR {selectedProduct.price}</p>
                                    <p><strong>Stock:</strong> {selectedProduct.stock} units</p>
                                    <p><strong>Status:</strong> {selectedProduct.status}</p>
                                    <p><strong>Description:</strong> {selectedProduct.description || 'No description'}</p>
                                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                                        <div className={styles.detailColors}>
                                            <strong>Colors:</strong>
                                            <div className={styles.colorList}>
                                                {selectedProduct.colors.map((color, i) => (
                                                    <span key={i} className={styles.detailColorDot} style={{ backgroundColor: color.toLowerCase() }}>
                                                        {color}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                        <div className={styles.detailSizes}>
                                            <strong>Sizes:</strong>
                                            <div className={styles.sizeList}>
                                                {selectedProduct.sizes.map((size, i) => (
                                                    <span key={i} className={styles.sizeTag}>{size}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button className={styles.dangerBtn} onClick={() => {
                                    handleDeleteProduct(selectedProduct.id);
                                    setSelectedProduct(null);
                                }}>
                                    Delete Product
                                </button>
                                <button className={styles.secondaryBtn} onClick={() => setSelectedProduct(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // RENDER ORDERS
    // ============================================
    const renderOrders = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📦 Orders</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{order.customer}</td>
                                <td>{order.date}</td>
                                <td>{order.amount}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${
                                        order.status === 'Delivered' ? styles.statusReady : 
                                        order.status === 'Pending' ? styles.statusPending : 
                                        order.status === 'Processing' ? styles.statusProcessing : ''
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td>
                                    <select 
                                        className={styles.formSelect} 
                                        value={order.status} 
                                        onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                                        style={{ padding: '5px 10px', fontSize: '12px', width: '130px' }}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Ready for Pickup">Ready for Pickup</option>
                                        <option value="Delivered">Delivered</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // ============================================
    // RENDER EARNINGS
    // ============================================
    const renderEarnings = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>💰 Earnings & Withdrawals</h2>
            
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Total Earnings</h3>
                    <p className={styles.statValue}>PKR {summary.totalEarnings.toLocaleString()}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Available Balance</h3>
                    <p className={styles.statValue}>PKR {summary.availableBalance.toLocaleString()}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Pending Withdrawals</h3>
                    <p className={styles.statValue}>PKR {summary.pendingWithdrawals.toLocaleString()}</p>
                </div>
            </div>

            <button 
                className={styles.primaryBtn} 
                style={{marginTop: '20px'}}
                onClick={() => setShowWithdrawalModal(true)}
            >
                💰 Request Withdrawal
            </button>
        </div>
    );

    // ============================================
    // RENDER EMPLOYEES
    // ============================================
    const renderEmployees = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>👥 Employees</h2>
            <button className={styles.primaryBtn} onClick={() => setShowAddEmployee(true)}>+ Add Employee</button>
            <div style={{ marginTop: '20px' }}>
                {employees.length > 0 ? employees.map((employee) => (
                    <div key={employee.id} className={styles.employeeItem}>
                        <div className={styles.employeeInfo}>
                            <span className={styles.employeeName}>{employee.name}</span>
                            <span className={styles.employeeRole}>{employee.role} • {employee.email}</span>
                        </div>
                        <button className={styles.dangerBtn} onClick={() => handleDeleteEmployee(employee.id)}>
                            Remove
                        </button>
                    </div>
                )) : (
                    <p className={styles.textMuted}>No employees registered yet.</p>
                )}
            </div>
        </div>
    );

    // ============================================
    // RENDER STORE HOURS
    // ============================================
    const renderStoreHours = () => (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🕐 Store Hours</h2>
            <div className={styles.hoursGrid}>
                {Object.entries(storeHours).map(([day, hours]) => (
                    <div key={day} className={styles.hoursRow}>
                        <span className={styles.hoursDay}>{day}</span>
                        <input 
                            type="time" 
                            className={styles.hoursInput} 
                            value={hours.open} 
                            onChange={(e) => handleStoreHoursChange(day, 'open', e.target.value)} 
                        />
                        <span className={styles.hoursSeparator}>to</span>
                        <input 
                            type="time" 
                            className={styles.hoursInput} 
                            value={hours.close} 
                            onChange={(e) => handleStoreHoursChange(day, 'close', e.target.value)} 
                        />
                    </div>
                ))}
            </div>
            <button className={styles.successBtn} onClick={handleSaveStoreHours}>
                Save Hours
            </button>
        </div>
    );

    // ============================================
    // RENDER BUSINESS SWITCHER
    // ============================================
    const renderBusinessSwitcher = () => {
        if (!summary.businesses || summary.businesses.length === 0) {
            return (
                <div className={styles.businessSwitcher} style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
                    <span>⚠️ No business registered yet.</span>
                </div>
            );
        }

        if (summary.businesses.length === 1) {
            const business = summary.businesses[0];
            const status = business.status || 'pending';
            const isApproved = status === 'approved';
            const isPending = status === 'pending';
            
            return (
                <div className={styles.businessSwitcher}>
                    <span>🏪 <strong>{business.businessName}</strong></span>
                    {!isApproved && (
                        <span className={styles.statusBadge} style={{
                            backgroundColor: isPending ? '#fff3cd' : '#f8d7da',
                            color: isPending ? '#856404' : '#721c24'
                        }}>
                            {status.toUpperCase()}
                        </span>
                    )}
                    {isApproved && (
                        <span className={styles.statusBadge} style={{
                            backgroundColor: '#d4edda',
                            color: '#155724'
                        }}>
                            ✅ APPROVED
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div className={styles.businessSwitcher}>
                <label>Switch Business:</label>
                <select 
                    className={styles.formSelect}
                    value={summary.selectedBusinessId || ''}
                    onChange={(e) => switchBusiness(e.target.value)}
                >
                    {summary.businesses.map((b: Business) => (
                        <option key={b._id} value={b._id}>
                            {b.businessName} {b.status === 'approved' ? '✅' : `(${b.status})`}
                            {b.isDefault && ' ★'}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    // ============================================
    // MAIN RENDER
    // ============================================
    if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <h2 className={styles.logo}>🏪 Vendor</h2>
                <ul className={styles.menu}>
                    <li className={activeTab === 'dashboard' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => handleTabChange('dashboard')}>
                        📊 Dashboard
                    </li>
                    <li className={activeTab === 'products' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => handleTabChange('products')}>
                        📦 Products
                    </li>
                    <li className={activeTab === 'orders' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => handleTabChange('orders')}>
                        📋 Orders
                    </li>
                    <li className={activeTab === 'earnings' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => handleTabChange('earnings')}>
                        💰 Earnings
                    </li>
                    <li className={activeTab === 'employees' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => handleTabChange('employees')}>
                        👥 Employees
                    </li>
                    <li className={activeTab === 'hours' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => handleTabChange('hours')}>
                        🕐 Store Hours
                    </li>
                    <li className={activeTab === 'subscription' ? styles.menuItemActive : styles.menuItem} 
                        onClick={() => handleTabChange('subscription')}>
                        📋 Subscription
                    </li>
                    <li className={styles.menuItemLogout} onClick={handleLogout}>
                        🚪 Logout
                    </li>
                </ul>
            </div>

            <div className={styles.main}>
                <div className={styles.header}>
                    <div>
                        <h1>Vendor Dashboard</h1>
                        <p>Welcome back, {user?.name || 'Vendor'}!</p>
                    </div>
                    <button 
                        className={styles.primaryBtn} 
                        onClick={() => setShowBusinessRegistration(true)}
                        style={{ fontSize: '14px' }}
                    >
                        + Register New Business
                    </button>
                </div>

                {renderBusinessSwitcher()}

                {activeTab === 'dashboard' && (
                    <>
                        <div className={styles.statsGrid}>
                            <div 
                                className={styles.statCard} 
                                onClick={() => setActiveTab('products')}
                                style={{ cursor: 'pointer' }}
                            >
                                <h3>Total Products</h3>
                                <p className={styles.statValue}>{summary.totalProducts}</p>
                            </div>
                            
                            <div 
                                className={styles.statCard} 
                                onClick={() => setActiveTab('orders')}
                                style={{ cursor: 'pointer' }}
                            >
                                <h3>Total Orders</h3>
                                <p className={styles.statValue}>{summary.totalOrders}</p>
                            </div>
                            
                            <div 
                                className={styles.statCard} 
                                onClick={() => setActiveTab('earnings')}
                                style={{ cursor: 'pointer' }}
                            >
                                <h3>Earnings</h3>
                                <p className={styles.statValue}>PKR {summary.totalEarnings.toLocaleString()}</p>
                            </div>
                            
                            <div 
                                className={styles.statCard} 
                                onClick={() => setActiveTab('orders')}
                                style={{ cursor: 'pointer' }}
                            >
                                <h3>Pending Orders</h3>
                                <p className={styles.statValue}>{summary.pendingOrders}</p>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'products' && renderProducts()}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'earnings' && renderEarnings()}
                {activeTab === 'employees' && renderEmployees()}
                {activeTab === 'hours' && renderStoreHours()}
                {activeTab === 'subscription' && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>📋 Subscription Plan</h2>
                        <p style={{ color: '#6c757d' }}>Manage your subscription from here.</p>
                    </div>
                )}
            </div>

            {renderAddProductModal()}
            {renderAddEmployeeModal()}
            {renderWithdrawalModal()}
            {renderSubscriptionModal()}
            {renderBusinessRegistrationModal()}
            {renderTrialWarningModal()}
            {renderExtensionModal()}
            {renderToast()}
        </div>
    );
}