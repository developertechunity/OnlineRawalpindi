// app/dashboard/vendor/page.tsx

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './vendor.module.css';

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

interface DashboardSummary {
    totalProducts: number;
    totalOrders: number;
    totalEarnings: number;
    pendingOrders: number;
    availableBalance: number;
    pendingWithdrawals: number;
    productsList: Product[];
    employeesList: Employee[];
    subscription: {
        plan: string;
        status: string;
        daysRemaining: number;
        showTrialWarning: boolean;
        hasRequestedExtension: boolean;
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

const API_BASE = 'http://localhost:5002/api/vendor';

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
        subscription: {
            plan: 'free',
            status: 'active',
            daysRemaining: 0,
            showTrialWarning: false,
            hasRequestedExtension: false
        }
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

    // Product Form with Images & Variations
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

    // ✅ SELECTED PRODUCT STATE - Top level pe
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // File input ref for clearing
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    const showToast = (text: string, type: 'success' | 'error') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 5000);
    };

    // ============================================
    // FETCH DASHBOARD DATA
    // ============================================
    const fetchDashboardData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE}/dashboard-summary`, config);

            if (response.data && response.data.success) {
                const data = response.data.data;
                setSummary(data);
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
    // FETCH PRODUCTS
    // ============================================
    const fetchProducts = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE}/products`, config);

            if (response.data && response.data.success) {
                console.log('📦 Products fetched:', response.data.products);
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
        } catch (error) {
            console.error('Error parsing user data:', error);
        } finally {
            setLoading(false);
        }
    }, [router, fetchDashboardData]);

    // ============================================
    // ADD PRODUCT - WITH IMAGE VALIDATION
    // ============================================
    const handleAddProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        // ✅ Validate required fields
        if (!productForm.name || !productForm.price || !productForm.stock || !productForm.description) {
            showToast('Please fill all required fields (Name, Price, Stock, Description)', 'error');
            return;
        }

        // ✅ Validate at least 1 image
        if (productForm.images.length === 0) {
            showToast('⚠️ Please upload at least 1 product image', 'error');
            return;
        }

        // ✅ Validate max 5 images
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
            console.error('❌ Response data:', error.response?.data);
            showToast(error.response?.data?.message || 'Failed to add product', 'error');
        }
    };

    // ============================================
    // HANDLE PRODUCT IMAGES
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
    // HANDLE PRODUCT VARIATIONS
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

 const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
        showToast('Session expired. Please login again.', 'error');
        return;
    }

    const amount = Number(withdrawalForm.amount);
    
    // ✅ Validation
    if (amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    if (amount < 5000) {
        showToast('Minimum withdrawal amount is PKR 5,000', 'error');
        return;
    }

    if (amount > 1000000) {
        showToast('Maximum withdrawal amount is PKR 1,000,000 (1 Million)', 'error');
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
            showToast('✅ Withdrawal request sent successfully! Admin will review and process.', 'success');
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
                showToast('✅ Subscription request cancelled. You are back on Free Trial.', 'success');
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Cancel subscription error:', error);
            showToast(error.response?.data?.message || 'Failed to cancel request', 'error');
        }
    };

    const handleSubscribe = async (plan: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Session expired. Please login again.', 'error');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`${API_BASE}/subscription/upgrade`, { plan }, config);

            if (response.data.success) {
                showToast('✅ Subscription request sent for admin approval!', 'success');
                await fetchDashboardData();
            }
        } catch (error: any) {
            console.error('Subscription error:', error);
            showToast(error.response?.data?.message || 'Failed to process subscription', 'error');
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
    // ORDER STATUS HANDLER
    // ============================================
    const handleOrderStatusChange = (orderId: string, newStatus: string) => {
        setOrders(prev => prev.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
        ));
        showToast(`✅ Order ${orderId} status updated to: ${newStatus}`, 'success');
    };

    // ============================================
    // STORE HOURS HANDLER
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
    // UTILITY HANDLERS
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
                            min="5000"      // ✅ Minimum 5000
                            max="1000000"   // ✅ Maximum 1,000,000 (1 Million)
                            required
                        />
                        <small style={{ color: '#6c757d', display: 'block', marginTop: '4px' }}>
                            Minimum: PKR 5,000 | Maximum: PKR 1,000,000 (1 Million)
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
    // ADD PRODUCT MODAL
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

                        {/* Product Images - REQUIRED */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                Product Images <span style={{ color: '#dc3545', fontSize: '12px' }}>* (Required, Max 5)</span>
                            </label>
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
                                                    if (fileInputRef.current && prev.images.length <= 1) {
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

                        {/* Colors - OPTIONAL */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                Colors <span style={{ color: '#6c757d', fontSize: '12px' }}>(Optional)</span>
                            </label>
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

                        {/* Sizes - OPTIONAL */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                Sizes <span style={{ color: '#6c757d', fontSize: '12px' }}>(Optional)</span>
                            </label>
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

    const renderToast = () => {
        if (!toastMessage) return null;
        return (
            <div className={`${styles.toast} ${toastMessage.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                {toastMessage.text}
            </div>
        );
    };

    // ============================================
    // SECTION RENDER FUNCTIONS
    // ============================================

    const renderSubscription = () => {
        const isFreeTrialActive = summary.subscription.plan === 'free' && summary.subscription.status === 'active';
        const isPaidPlanActive = summary.subscription.plan !== 'free' && summary.subscription.status === 'active';
        const isPendingApproval = summary.subscription.status === 'pending_approval';

        return (
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📋 Subscription Plan</h2>
                
                {summary.subscription.showTrialWarning && summary.subscription.daysRemaining <= 3 && (
                    <div style={{ 
                        backgroundColor: '#fff3cd', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        border: '1px solid #ffc107'
                    }}>
                        <p style={{ margin: 0, color: '#856404' }}>
                            ⚠️ Your trial ends in <strong>{summary.subscription.daysRemaining}</strong> days! 
                            <button 
                                style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#856404', textDecoration: 'underline', cursor: 'pointer' }}
                                onClick={() => setShowExtensionModal(true)}
                            >
                                Request Extension
                            </button>
                        </p>
                    </div>
                )}

                {isPendingApproval && (
                    <div style={{ 
                        backgroundColor: '#cce5ff', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        border: '1px solid #004085'
                    }}>
                        <p style={{ margin: 0, color: '#004085' }}>
                            ⏳ Your subscription request is pending admin approval. Please wait.
                        </p>
                    </div>
                )}

                <div className={styles.subscriptionCard}>
                    {/* Free Trial */}
                    <div className={`${styles.planCard} ${isFreeTrialActive ? styles.planCardActive : ''}`}>
                        {isFreeTrialActive && <div className={styles.planBadge}>Current Plan</div>}
                        <h3 className={styles.planName}>Free Trial</h3>
                        <p className={styles.planPrice}>PKR 0</p>
                        <ul className={styles.planFeatures}>
                            <li>✓ 30 Days Free</li>
                            <li>✓ 50 Products</li>
                            <li>✓ Basic Support</li>
                        </ul>
                        
                        {isFreeTrialActive ? (
                            <button className={styles.secondaryBtn} disabled>
                                ✅ Active ({summary.subscription.daysRemaining} days left)
                            </button>
                        ) : isPendingApproval && summary.subscription.plan === 'free' ? (
                            <button className={styles.secondaryBtn} disabled>
                                ⏳ Pending Approval
                            </button>
                        ) : (
                            <button 
                                className={styles.primaryBtn}
                                onClick={handleStartFreeTrial}
                            >
                                🚀 Start Free Trial
                            </button>
                        )}
                    </div>

                    {/* Monthly */}
                    <div className={`${styles.planCard} ${summary.subscription.plan === 'monthly' && isPaidPlanActive ? styles.planCardActive : ''}`}>
                        {(summary.subscription.plan === 'monthly' && isPaidPlanActive) && <div className={styles.planBadge}>Current Plan</div>}
                        <h3 className={styles.planName}>Monthly</h3>
                        <p className={styles.planPrice}>PKR 1,000 <span>/month</span></p>
                        <ul className={styles.planFeatures}>
                            <li>✓ Unlimited Products</li>
                            <li>✓ Priority Support</li>
                            <li>✓ Advanced Analytics</li>
                        </ul>
                        
                        {isPaidPlanActive && summary.subscription.plan === 'monthly' ? (
                            <button className={styles.secondaryBtn} disabled>
                                ✅ Active
                            </button>
                        ) : isPendingApproval && summary.subscription.plan === 'monthly' ? (
                            <>
                                <button className={styles.secondaryBtn} disabled>
                                    ⏳ Pending Approval
                                </button>
                                <button 
                                    className={styles.dangerBtn}
                                    onClick={handleCancelSubscriptionRequest}
                                    style={{ marginTop: '8px', width: '100%' }}
                                >
                                    ❌ Cancel Request
                                </button>
                            </>
                        ) : (
                            <button 
                                className={styles.primaryBtn}
                                onClick={() => handleSubscribe('monthly')}
                                disabled={isPendingApproval}
                            >
                                Subscribe
                            </button>
                        )}
                    </div>

                    {/* Yearly */}
                    <div className={`${styles.planCard} ${summary.subscription.plan === 'yearly' && isPaidPlanActive ? styles.planCardActive : ''}`}>
                        {(summary.subscription.plan === 'yearly' && isPaidPlanActive) && <div className={styles.planBadge}>Current Plan</div>}
                        <h3 className={styles.planName}>Yearly</h3>
                        <p className={styles.planPrice}>PKR 10,000 <span>/year</span></p>
                        <ul className={styles.planFeatures}>
                            <li>✓ Everything in Monthly</li>
                            <li>✓ 2 Months Free</li>
                            <li>✓ VIP Support</li>
                        </ul>
                        
                        {isPaidPlanActive && summary.subscription.plan === 'yearly' ? (
                            <button className={styles.secondaryBtn} disabled>
                                ✅ Active
                            </button>
                        ) : isPendingApproval && summary.subscription.plan === 'yearly' ? (
                            <>
                                <button className={styles.secondaryBtn} disabled>
                                    ⏳ Pending Approval
                                </button>
                                <button 
                                    className={styles.dangerBtn}
                                    onClick={handleCancelSubscriptionRequest}
                                    style={{ marginTop: '8px', width: '100%' }}
                                >
                                    ❌ Cancel Request
                                </button>
                            </>
                        ) : (
                            <button 
                                className={styles.primaryBtn}
                                onClick={() => handleSubscribe('yearly')}
                                disabled={isPendingApproval}
                            >
                                Subscribe
                            </button>
                        )}
                    </div>
                </div>

                {summary.subscription.hasRequestedExtension && (
                    <div style={{ 
                        backgroundColor: '#d4edda', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginTop: '20px',
                        border: '1px solid #28a745'
                    }}>
                        <p style={{ margin: 0, color: '#155724' }}>
                            ✅ Extension request sent to admin. Please wait for approval.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // ✅ RENDER PRODUCTS - WITH IMAGE ERROR HANDLING
    // ============================================
    const renderProducts = () => {
        // Function to handle image load error
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

                {/* Product Detail Modal */}
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
    // MAIN RENDER
    // ============================================
    if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

    return (
        <div className={styles.container}>
            {/* Sidebar */}
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

            {/* Main Content */}
            <div className={styles.main}>
                <div className={styles.header}>
                    <h1>Vendor Dashboard</h1>
                    <p>Welcome back, {user?.name || 'Vendor'}!</p>
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <h3>Total Products</h3>
                                <p className={styles.statValue}>{summary.totalProducts}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Total Orders</h3>
                                <p className={styles.statValue}>{summary.totalOrders}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Earnings</h3>
                                <p className={styles.statValue}>PKR {summary.totalEarnings.toLocaleString()}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Pending Orders</h3>
                                <p className={styles.statValue}>{summary.pendingOrders}</p>
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap'}}>
                            <button className={styles.primaryBtn} onClick={() => setShowAddProduct(true)}>
                                + Add New Product
                            </button>
                            <button className={styles.secondaryBtn} onClick={() => setActiveTab('orders')}>
                                View All Orders
                            </button>
                            <button className={styles.successBtn} onClick={() => setActiveTab('subscription')}>
                                View Subscription
                            </button>
                        </div>

                        {renderSubscription()}
                    </>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && renderProducts()}

                {/* Orders Tab */}
                {activeTab === 'orders' && renderOrders()}

                {/* Earnings Tab */}
                {activeTab === 'earnings' && renderEarnings()}

                {/* Employees Tab */}
                {activeTab === 'employees' && renderEmployees()}

                {/* Store Hours Tab */}
                {activeTab === 'hours' && renderStoreHours()}

                {/* Subscription Tab */}
                {activeTab === 'subscription' && renderSubscription()}
            </div>

            {/* Modals */}
            {renderAddProductModal()}
            {renderAddEmployeeModal()}
            {renderWithdrawalModal()}
            {renderTrialWarningModal()}
            {renderExtensionModal()}
            {renderToast()}
        </div>
    );
}