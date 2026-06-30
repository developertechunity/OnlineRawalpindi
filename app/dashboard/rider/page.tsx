'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './rider.module.css';

// ============================================
// TYPES
// ============================================
interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
}

interface Delivery {
    id: string;
    orderId: string;
    customer: string;
    customerPhone: string;
    address: string;
    amount: number;
    status: 'pending' | 'picked' | 'delivered' | 'cancelled';
    createdAt: string;
    codAmount?: number;
    deliveryFee?: number;
    pickupAddress?: string;
    deliveryTime?: string;
    lat?: number;
    lng?: number;
}

interface RiderStats {
    todayDeliveries: number;
    totalDeliveries: number;
    earningsToday: number;
    weeklyEarnings: number;
    totalEarnings: number;
    pendingDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
}

interface RiderProfile {
    id: string;
    userId: User;
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
    zone: string[];
    status: 'online' | 'offline' | 'busy';
    totalDeliveries: number;
    totalEarnings: number;
    rating: number;
    isActive: boolean;
    phone: string;
    address: string;
    joinedDate: string;
    currentLocation?: { lat: number; lng: number };
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'payment' | 'system';
    read: boolean;
    createdAt: string;
}

// ============================================
// SIDEBAR MENU ITEMS
// ============================================
const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'deliveries', label: '📦 My Deliveries' },
    { id: 'history', label: '📋 Delivery History' },
    { id: 'earnings', label: '💰 Earnings' },
    { id: 'profile', label: '👤 My Profile' },
    { id: 'reports', label: '📊 Reports' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'map', label: '🗺️ Live Map' },
    { id: 'withdraw', label: '💳 Withdraw' },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function RiderDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);
    const [stats, setStats] = useState<RiderStats>({
        todayDeliveries: 0,
        totalDeliveries: 0,
        earningsToday: 0,
        weeklyEarnings: 0,
        totalEarnings: 0,
        pendingDeliveries: 0,
        completedDeliveries: 0,
        cancelledDeliveries: 0
    });
    const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
    const [riderStatus, setRiderStatus] = useState<'online' | 'offline' | 'busy'>('offline');
    const [showDeliveryDetail, setShowDeliveryDetail] = useState<Delivery | null>(null);
    const [loadingAction, setLoadingAction] = useState(false);
    
    // Withdrawal States
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('bank');
    const [withdrawAccount, setWithdrawAccount] = useState('');
    
    // Notification States
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Profile Edit States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editProfile, setEditProfile] = useState({
        phone: '',
        address: '',
        vehicleType: '',
        vehicleNumber: ''
    });

    // Map States
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<any>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

    // ============================================
    // FETCH ALL DATA
    // ============================================
    const fetchAllRiderData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/auth/login');
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            // 1. Get Rider Profile
            const profileRes = await axios.get(`${API_URL}/api/auth/rider/profile`, { headers });
            if (profileRes.data.success) {
                setRiderProfile(profileRes.data.rider);
                setRiderStatus(profileRes.data.rider.status);
                setEditProfile({
                    phone: profileRes.data.rider.phone || '',
                    address: profileRes.data.rider.address || '',
                    vehicleType: profileRes.data.rider.vehicleType || 'bike',
                    vehicleNumber: profileRes.data.rider.vehicleNumber || ''
                });
            }

            // 2. Get Rider Deliveries
            const deliveriesRes = await axios.get(`${API_URL}/api/auth/rider/deliveries`, { headers });
            if (deliveriesRes.data.success) {
                setDeliveries(deliveriesRes.data.deliveries);
            }

            // 3. Get Rider Stats
            const statsRes = await axios.get(`${API_URL}/api/auth/rider/stats`, { headers });
            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
            }

            // 4. Get Delivery History
            const historyRes = await axios.get(`${API_URL}/api/auth/rider/delivery-history`, { headers });
            if (historyRes.data.success) {
                setDeliveryHistory(historyRes.data.history);
            }

            // 5. Get Notifications
            const notifRes = await axios.get(`${API_URL}/api/auth/rider/notifications`, { headers });
            if (notifRes.data.success) {
                setNotifications(notifRes.data.notifications);
            }

        } catch (error: any) {
            console.error('Error fetching rider data:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL, router]);

    // ============================================
    // USE EFFECT
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
            const parsedUser = JSON.parse(userData || '{}');
            if (parsedUser.role !== 'rider') {
                router.push('/auth/login');
                setLoading(false);
                return;
            }
            setUser(parsedUser);
            fetchAllRiderData();
        } catch {
            router.push('/auth/login');
        }
    }, [router, fetchAllRiderData]);

    // ============================================
    // GET USER LOCATION FOR MAP
    // ============================================
    useEffect(() => {
        if (activeTab === 'map' && navigator.geolocation) {
            setMapLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setMapLoading(false);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setMapLoading(false);
                },
                { enableHighAccuracy: true }
            );
        }
    }, [activeTab]);

    // ============================================
    // UPDATE RIDER STATUS
    // ============================================
    const updateRiderStatus = useCallback(async (status: 'online' | 'offline' | 'busy') => {
        try {
            setLoadingAction(true);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/auth/rider/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setRiderStatus(status);
                if (riderProfile) {
                    setRiderProfile({ ...riderProfile, status });
                }
                alert(`✅ Status updated to ${status}`);
            }
        } catch (error: any) {
            alert('❌ Failed to update status: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoadingAction(false);
        }
    }, [API_URL, riderProfile]);

    // ============================================
    // UPDATE DELIVERY STATUS
    // ============================================
    const updateDeliveryStatus = useCallback(async (deliveryId: string, status: 'picked' | 'delivered' | 'cancelled') => {
        try {
            setLoadingAction(true);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/auth/rider/delivery/${deliveryId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert(status === 'picked' ? '📦 Order picked up!' : 
                      status === 'delivered' ? '✅ Order delivered!' : 
                      '❌ Order cancelled');
                setShowDeliveryDetail(null);
                fetchAllRiderData();
            }
        } catch (error: any) {
            alert('❌ Failed to update delivery: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoadingAction(false);
        }
    }, [API_URL, fetchAllRiderData]);

    // ============================================
    // REQUEST WITHDRAWAL
    // ============================================
    const requestWithdrawal = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoadingAction(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/rider/withdraw`,
                {
                    amount: parseFloat(withdrawAmount),
                    method: withdrawMethod,
                    accountDetails: withdrawAccount
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert('✅ Withdrawal request submitted!');
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                setWithdrawMethod('bank');
                setWithdrawAccount('');
                fetchAllRiderData();
            }
        } catch (error: any) {
            alert('❌ Failed to request withdrawal: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoadingAction(false);
        }
    }, [API_URL, fetchAllRiderData, withdrawAmount, withdrawMethod, withdrawAccount]);

    // ============================================
    // UPDATE PROFILE
    // ============================================
    const updateProfile = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoadingAction(true);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/auth/rider/profile`,
                editProfile,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                alert('✅ Profile updated successfully!');
                setIsEditingProfile(false);
                fetchAllRiderData();
            }
        } catch (error: any) {
            alert('❌ Failed to update profile: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoadingAction(false);
        }
    }, [API_URL, fetchAllRiderData, editProfile]);

    // ============================================
    // MARK NOTIFICATION READ
    // ============================================
    const markNotificationRead = useCallback(async (notifId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/auth/rider/notification/${notifId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications(prev => prev.map(n => 
                n.id === notifId ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification read:', error);
        }
    }, [API_URL]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
    }, [router]);

    const handleViewDeliveryDetail = useCallback((delivery: Delivery) => {
        setShowDeliveryDetail(delivery);
    }, []);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return styles.statusPending;
            case 'picked': return styles.statusProcessing;
            case 'delivered': return styles.statusCompleted;
            case 'cancelled': return styles.statusRejected;
            default: return styles.statusPending;
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'pending': return 'Pending';
            case 'picked': return 'Picked Up';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'pending': return '⏳';
            case 'picked': return '📦';
            case 'delivered': return '✅';
            case 'cancelled': return '❌';
            default: return '📋';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch(type) {
            case 'order': return '📦';
            case 'payment': return '💰';
            case 'system': return '🔔';
            default: return '📢';
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // ============================================
    // RENDER FUNCTIONS
    // ============================================

    // Render Dashboard
    const renderDashboard = () => (
        <>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Today's Deliveries</h3>
                    <p className={styles.statValue}>{stats.todayDeliveries}</p>
                    <span className={styles.statChange}>+{stats.completedDeliveries} completed</span>
                </div>
                <div className={styles.statCard}>
                    <h3>Earnings Today</h3>
                    <p className={styles.statValue}>PKR {stats.earningsToday.toLocaleString()}</p>
                    <span className={styles.statChange}>↑ 12%</span>
                </div>
                <div className={styles.statCard}>
                    <h3>Weekly Earnings</h3>
                    <p className={styles.statValue}>PKR {stats.weeklyEarnings.toLocaleString()}</p>
                    <span className={styles.statChange}>↑ 8%</span>
                </div>
                <div className={styles.statCard}>
                    <h3>Total Deliveries</h3>
                    <p className={styles.statValue}>{stats.totalDeliveries}</p>
                    <span className={styles.statChange}>+{stats.pendingDeliveries} pending</span>
                </div>
            </div>

            {/* Assigned Deliveries */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3>📦 Assigned Deliveries</h3>
                    <span className={styles.deliveryCount}>{deliveries.length} orders</span>
                </div>
                {deliveries.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No deliveries assigned yet.</p>
                    </div>
                ) : (
                    deliveries.map((delivery) => (
                        <div 
                            key={delivery.id} 
                            className={styles.deliveryItem} 
                            onClick={() => handleViewDeliveryDetail(delivery)}
                        >
                            <div className={styles.deliveryInfo}>
                                <div className={styles.deliveryHeader}>
                                    <strong className={styles.orderId}>{delivery.orderId}</strong>
                                    <span className={styles.deliveryCustomer}>{delivery.customer}</span>
                                    {delivery.codAmount && (
                                        <span className={styles.codBadge}>💵 COD</span>
                                    )}
                                </div>
                                <div className={styles.deliveryAddress}>
                                    <span>📍 {delivery.address}</span>
                                </div>
                                <div className={styles.deliveryMeta}>
                                    <span>{new Date(delivery.createdAt).toLocaleDateString()}</span>
                                    <span>📞 {delivery.customerPhone}</span>
                                </div>
                            </div>
                            <div className={styles.deliveryRight}>
                                <span className={styles.amount}>PKR {delivery.amount}</span>
                                <span className={`${styles.statusBadge} ${getStatusColor(delivery.status)}`}>
                                    {getStatusIcon(delivery.status)} {getStatusText(delivery.status)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    // Render Delivery History
    const renderDeliveryHistory = () => (
        <div className={styles.card}>
            <h3>📋 Delivery History</h3>
            {deliveryHistory.length === 0 ? (
                <div className={styles.emptyState}><p>No delivery history yet.</p></div>
            ) : (
                <div className={styles.historyTable}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryHistory.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.orderId}</td>
                                    <td>{item.customer}</td>
                                    <td>PKR {item.amount}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${getStatusColor(item.status)}`}>
                                            {getStatusText(item.status)}
                                        </span>
                                    </td>
                                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    // Render Earnings
    const renderEarnings = () => (
        <div className={styles.card}>
            <h3>💰 Earnings Overview</h3>
            <div className={styles.earningsGrid}>
                <div className={styles.earningCard}>
                    <h4>Today</h4>
                    <p className={styles.earningAmount}>PKR {stats.earningsToday.toLocaleString()}</p>
                </div>
                <div className={styles.earningCard}>
                    <h4>This Week</h4>
                    <p className={styles.earningAmount}>PKR {stats.weeklyEarnings.toLocaleString()}</p>
                </div>
                <div className={styles.earningCard}>
                    <h4>Total</h4>
                    <p className={styles.earningAmount}>PKR {stats.totalEarnings.toLocaleString()}</p>
                </div>
            </div>
            <button 
                className={styles.primaryBtn}
                onClick={() => setShowWithdrawModal(true)}
                disabled={stats.totalEarnings < 500}
            >
                {stats.totalEarnings < 500 ? 'Minimum PKR 500 required' : '💳 Request Withdrawal'}
            </button>
        </div>
    );

    // Render Profile
    const renderProfile = () => (
        <div className={styles.card}>
            <h3>👤 My Profile</h3>
            {!isEditingProfile ? (
                <div className={styles.profileView}>
                    <div className={styles.profileInfo}>
                        <div><strong>Name:</strong> {riderProfile?.userId?.name || user?.name}</div>
                        <div><strong>Email:</strong> {riderProfile?.userId?.email || user?.email}</div>
                        <div><strong>Phone:</strong> {riderProfile?.phone || 'Not set'}</div>
                        <div><strong>Address:</strong> {riderProfile?.address || 'Not set'}</div>
                        <div><strong>Vehicle:</strong> {riderProfile?.vehicleType || 'Not set'}</div>
                        <div><strong>Vehicle Number:</strong> {riderProfile?.vehicleNumber || 'Not set'}</div>
                        <div><strong>License:</strong> {riderProfile?.licenseNumber || 'Not set'}</div>
                        <div><strong>Zone:</strong> {riderProfile?.zone?.join(', ') || 'Not set'}</div>
                        <div><strong>Total Deliveries:</strong> {riderProfile?.totalDeliveries || 0}</div>
                        <div><strong>Rating:</strong> ⭐ {riderProfile?.rating || 0}/5</div>
                        <div><strong>Status:</strong> 
                            <span className={riderStatus === 'online' ? styles.statusOnline : 
                                           riderStatus === 'busy' ? styles.statusBusy : 
                                           styles.statusOffline}
                                  style={{ padding: '2px 12px', borderRadius: '12px', fontSize: '12px' }}>
                                {riderStatus === 'online' ? '🟢 Online' : 
                                 riderStatus === 'busy' ? '🟡 Busy' : 
                                 '🔴 Offline'}
                            </span>
                        </div>
                    </div>
                    <button className={styles.primaryBtn} onClick={() => setIsEditingProfile(true)}>
                        ✏️ Edit Profile
                    </button>
                </div>
            ) : (
                <form onSubmit={updateProfile} className={styles.profileForm}>
                    <div className={styles.fieldGroup}>
                        <label>Phone</label>
                        <input 
                            type="text" 
                            value={editProfile.phone} 
                            onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label>Address</label>
                        <input 
                            type="text" 
                            value={editProfile.address} 
                            onChange={(e) => setEditProfile({...editProfile, address: e.target.value})}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label>Vehicle Type</label>
                        <select 
                            value={editProfile.vehicleType} 
                            onChange={(e) => setEditProfile({...editProfile, vehicleType: e.target.value})}
                            className={styles.select}
                        >
                            <option value="bike">Bike</option>
                            <option value="car">Car</option>
                            <option value="van">Van</option>
                            <option value="cycle">Cycle</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label>Vehicle Number</label>
                        <input 
                            type="text" 
                            value={editProfile.vehicleNumber} 
                            onChange={(e) => setEditProfile({...editProfile, vehicleNumber: e.target.value})}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="submit" className={styles.successBtn} disabled={loadingAction}>
                            {loadingAction ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className={styles.secondaryBtn} onClick={() => setIsEditingProfile(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );

    // Render Reports
    const renderReports = () => (
        <div className={styles.card}>
            <h3>📊 Reports</h3>
            <div className={styles.emptyState}>
                <p>Reports will be available soon.</p>
            </div>
        </div>
    );

    // Render Notifications
    const renderNotifications = () => (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h3>🔔 Notifications {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}</h3>
                <button className={styles.secondaryBtn} onClick={() => setShowNotifications(!showNotifications)}>
                    {showNotifications ? 'Hide' : 'Show'}
                </button>
            </div>
            {showNotifications && (
                <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                        <div className={styles.emptyState}><p>No notifications.</p></div>
                    ) : (
                        notifications.map((notif) => (
                            <div 
                                key={notif.id} 
                                className={`${styles.notificationItem} ${!notif.read ? styles.unread : ''}`}
                                onClick={() => markNotificationRead(notif.id)}
                            >
                                <div className={styles.notificationIcon}>{getNotificationIcon(notif.type)}</div>
                                <div className={styles.notificationContent}>
                                    <div className={styles.notificationTitle}>{notif.title}</div>
                                    <div className={styles.notificationMessage}>{notif.message}</div>
                                    <div className={styles.notificationTime}>{new Date(notif.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );

    // Render Map - Live Tracking
    const renderMap = () => (
        <div className={styles.card}>
            <h3>🗺️ Live Location Tracking</h3>
            <div className={styles.mapContainer}>
                {mapLoading ? (
                    <div className={styles.mapLoading}>Fetching your location...</div>
                ) : userLocation ? (
                    <div className={styles.mapContent}>
                        <div className={styles.mapPlaceholder}>
                            <div className={styles.mapIndicator}>
                                <span className={styles.pulseDot}></span>
                                <span className={styles.locationLabel}>You are here</span>
                            </div>
                            <div className={styles.mapLocationInfo}>
                                <p><strong>Latitude:</strong> {userLocation.lat.toFixed(6)}</p>
                                <p><strong>Longitude:</strong> {userLocation.lng.toFixed(6)}</p>
                                <p><strong>Status:</strong> 
                                    <span className={riderStatus === 'online' ? styles.statusOnline : styles.statusOffline}
                                          style={{ padding: '2px 12px', borderRadius: '12px', fontSize: '12px' }}>
                                        {riderStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
                                    </span>
                                </p>
                                <p><strong>Zone:</strong> {riderProfile?.zone?.join(', ') || 'Not assigned'}</p>
                            </div>
                            <div className={styles.mapActions}>
                                <button 
                                    className={styles.primaryBtn}
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            setMapLoading(true);
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    setUserLocation({
                                                        lat: position.coords.latitude,
                                                        lng: position.coords.longitude
                                                    });
                                                    setMapLoading(false);
                                                    alert('📍 Location updated!');
                                                },
                                                (error) => {
                                                    setMapLoading(false);
                                                    alert('❌ Could not get location. Please enable GPS.');
                                                },
                                                { enableHighAccuracy: true }
                                            );
                                        }
                                    }}
                                    disabled={mapLoading}
                                >
                                    {mapLoading ? 'Updating...' : '🔄 Update Location'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.mapPlaceholder}>
                        <p>Please enable location access to see your live position</p>
                        <button 
                            className={styles.primaryBtn}
                            onClick={() => {
                                if (navigator.geolocation) {
                                    setMapLoading(true);
                                    navigator.geolocation.getCurrentPosition(
                                        (position) => {
                                            setUserLocation({
                                                lat: position.coords.latitude,
                                                lng: position.coords.longitude
                                            });
                                            setMapLoading(false);
                                        },
                                        (error) => {
                                            setMapLoading(false);
                                            alert('❌ Please enable location access in your browser.');
                                        },
                                        { enableHighAccuracy: true }
                                    );
                                } else {
                                    alert('❌ Geolocation is not supported by your browser.');
                                }
                            }}
                        >
                            📍 Enable Location
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // Render Withdraw
    const renderWithdraw = () => (
        <div className={styles.card}>
            <h3>💳 Withdraw Earnings</h3>
            <div className={styles.earningsGrid}>
                <div className={styles.earningCard}>
                    <h4>Available Balance</h4>
                    <p className={styles.earningAmount}>PKR {stats.totalEarnings.toLocaleString()}</p>
                </div>
            </div>
            <button 
                className={styles.primaryBtn}
                onClick={() => setShowWithdrawModal(true)}
                disabled={stats.totalEarnings < 500}
            >
                {stats.totalEarnings < 500 ? 'Minimum PKR 500 required' : '💳 Request Withdrawal'}
            </button>
        </div>
    );

    // ============================================
    // MODALS
    // ============================================
    const renderWithdrawModal = () => {
        if (!showWithdrawModal) return null;
        return (
            <div className={styles.modalOverlay} onClick={() => setShowWithdrawModal(false)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>💰 Request Withdrawal</h3>
                        <button className={styles.modalClose} onClick={() => setShowWithdrawModal(false)}>×</button>
                    </div>
                    <form onSubmit={requestWithdrawal}>
                        <div className={styles.fieldGroup}>
                            <label>Available Balance</label>
                            <p className={styles.balanceAmount}>PKR {stats.totalEarnings.toLocaleString()}</p>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label>Amount</label>
                            <input 
                                type="number" 
                                className={styles.input} 
                                placeholder="Enter amount"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                required
                                min="500"
                                max={stats.totalEarnings}
                            />
                            <small>Minimum: PKR 500</small>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label>Method</label>
                            <select 
                                className={styles.select}
                                value={withdrawMethod}
                                onChange={(e) => setWithdrawMethod(e.target.value)}
                            >
                                <option value="bank">Bank Transfer</option>
                                <option value="easypaisa">EasyPaisa</option>
                                <option value="jazzcash">JazzCash</option>
                            </select>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label>Account Details</label>
                            <input 
                                type="text" 
                                className={styles.input} 
                                placeholder="IBAN / EasyPaisa Number"
                                value={withdrawAccount}
                                onChange={(e) => setWithdrawAccount(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button type="submit" className={styles.successBtn} disabled={loadingAction}>
                                {loadingAction ? 'Processing...' : 'Submit Request'}
                            </button>
                            <button type="button" className={styles.secondaryBtn} onClick={() => setShowWithdrawModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const renderDeliveryDetailModal = () => {
        if (!showDeliveryDetail) return null;
        return (
            <div className={styles.modalOverlay} onClick={() => setShowDeliveryDetail(null)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>📦 Delivery Details</h3>
                        <button className={styles.modalClose} onClick={() => setShowDeliveryDetail(null)}>×</button>
                    </div>
                    <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                            <label>Order ID</label>
                            <p>{showDeliveryDetail.orderId}</p>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Customer</label>
                            <p>{showDeliveryDetail.customer}</p>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Phone</label>
                            <p>{showDeliveryDetail.customerPhone}</p>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Amount</label>
                            <p>PKR {showDeliveryDetail.amount}</p>
                        </div>
                        {showDeliveryDetail.codAmount && (
                            <div className={styles.detailItem}>
                                <label>COD Amount</label>
                                <p>PKR {showDeliveryDetail.codAmount}</p>
                            </div>
                        )}
                        <div className={styles.detailFull}>
                            <label>Address</label>
                            <p>{showDeliveryDetail.address}</p>
                        </div>
                        <div className={styles.detailFull}>
                            <label>Status</label>
                            <p className={getStatusColor(showDeliveryDetail.status)} style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px' }}>
                                {getStatusText(showDeliveryDetail.status)}
                            </p>
                        </div>
                    </div>
                    <div className={styles.modalActions}>
                        {showDeliveryDetail.status === 'pending' && (
                            <button 
                                className={styles.primaryBtn} 
                                onClick={() => updateDeliveryStatus(showDeliveryDetail.id, 'picked')}
                                disabled={loadingAction}
                            >
                                📦 Pick Up
                            </button>
                        )}
                        {showDeliveryDetail.status === 'picked' && (
                            <button 
                                className={styles.successBtn} 
                                onClick={() => updateDeliveryStatus(showDeliveryDetail.id, 'delivered')}
                                disabled={loadingAction}
                            >
                                ✅ Deliver
                            </button>
                        )}
                        {showDeliveryDetail.status === 'pending' && (
                            <button 
                                className={styles.dangerBtn} 
                                onClick={() => updateDeliveryStatus(showDeliveryDetail.id, 'cancelled')}
                                disabled={loadingAction}
                            >
                                ❌ Cancel
                            </button>
                        )}
                    </div>
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

    if (!user) {
        return <div className={styles.loading}>No user data...</div>;
    }

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.logo}>🛵 Rider</h2>
                    <div className={styles.sidebarUser}>
                        <span className={styles.sidebarUserName}>{user.name}</span>
                        <span className={styles.sidebarUserRole}>Delivery Partner</span>
                    </div>
                </div>
                <nav className={styles.sidebarNav}>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`${styles.sidebarLink} ${activeTab === item.id ? styles.sidebarLinkActive : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span className={styles.sidebarIcon}>{item.label.split(' ')[0]}</span>
                            <span className={styles.sidebarLabel}>{item.label.split(' ').slice(1).join(' ') || item.label}</span>
                        </button>
                    ))}
                    <button className={`${styles.sidebarLink} ${styles.sidebarLinkLogout}`} onClick={handleLogout}>
                        <span className={styles.sidebarIcon}>🔒</span>
                        <span className={styles.sidebarLabel}>Logout</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Header */}
                <div className={styles.contentHeader}>
                    <div>
                        <h1 className={styles.contentTitle}>Rider Dashboard</h1>
                        <p className={styles.contentSubtitle}>Welcome back, {user.name}!</p>
                    </div>
                    <div className={styles.statusContainer}>
                        <span className={styles.statusLabel}>Status:</span>
                        <button
                            className={`${styles.statusBtn} ${
                                riderStatus === 'online' ? styles.statusOnline : 
                                riderStatus === 'busy' ? styles.statusBusy : 
                                styles.statusOffline
                            }`}
                            onClick={() => {
                                if (riderStatus === 'online') updateRiderStatus('busy');
                                else if (riderStatus === 'busy') updateRiderStatus('offline');
                                else updateRiderStatus('online');
                            }}
                            disabled={loadingAction}
                        >
                            {riderStatus === 'online' ? '🟢 Online' : 
                             riderStatus === 'busy' ? '🟡 Busy' : 
                             '🔴 Offline'}
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'deliveries' && renderDashboard()}
                    {activeTab === 'history' && renderDeliveryHistory()}
                    {activeTab === 'earnings' && renderEarnings()}
                    {activeTab === 'profile' && renderProfile()}
                    {activeTab === 'reports' && renderReports()}
                    {activeTab === 'notifications' && renderNotifications()}
                    {activeTab === 'map' && renderMap()}
                    {activeTab === 'withdraw' && renderWithdraw()}
                </div>
            </div>

            {/* Modals */}
            {renderWithdrawModal()}
            {renderDeliveryDetailModal()}
        </div>
    );
}