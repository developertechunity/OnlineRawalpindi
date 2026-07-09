// app/lib/payment.service.ts

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

export const paymentService = {
    // ============================================
    // 1. Create Payment - Customer
    // ============================================
    createPayment: async (data: any, token: string) => {
        try {
            const response = await axios.post(`${API_BASE}/payment/create`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Payment Error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Payment failed'
            };
        }
    },

    // ============================================
    // 2. Vendor Subscription - Vendor
    // ============================================
    subscribe: async (plan: 'monthly' | 'yearly', token: string) => {
        try {
            const response = await axios.post(`${API_BASE}/payment/subscription`, 
                { plan },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            console.error('Subscription Error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Subscription failed'
            };
        }
    },

    // ============================================
    // 3. Confirm COD - Rider
    // ============================================
    confirmCOD: async (orderId: string, amount: number, token: string) => {
        try {
            const response = await axios.post(`${API_BASE}/payment/confirm-cod`, 
                { orderId, amount },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            console.error('Confirm COD Error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to confirm COD'
            };
        }
    },

    // ============================================
    // 4. Deposit COD - Rider
    // ============================================
    depositCOD: async (orderId: string, token: string) => {
        try {
            const response = await axios.post(`${API_BASE}/payment/deposit-cod`, 
                { orderId },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            console.error('Deposit COD Error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to deposit COD'
            };
        }
    },

    // ============================================
    // 5. Process Refund - Admin
    // ============================================
    processRefund: async (paymentId: string, reason: string, token: string, amount?: number) => {
        try {
            const response = await axios.post(`${API_BASE}/payment/refund/${paymentId}`, 
                { reason, amount },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            console.error('Refund Error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to process refund'
            };
        }
    },

    // ============================================
    // 6. Get Payment History - All Roles
    // ============================================
    getPaymentHistory: async (token: string, filters?: any) => {
        try {
            const params = new URLSearchParams(filters || {}).toString();
            const url = params ? `${API_BASE}/payment/history?${params}` : `${API_BASE}/payment/history`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Get History Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ============================================
    // 7. Get Payment Details - All Roles
    // ============================================
    getPaymentDetails: async (paymentId: string, token: string) => {
        try {
            const response = await axios.get(`${API_BASE}/payment/details/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Get Details Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ============================================
    // 8. Get Payment Statistics - Admin Only
    // ============================================
    getPaymentStatistics: async (token: string) => {
        try {
            const response = await axios.get(`${API_BASE}/payment/statistics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Get Statistics Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ============================================
    // 9. Get Payment Status
    // ============================================
    getPaymentStatus: async (transactionId: string, token: string) => {
        try {
            const response = await axios.get(`${API_BASE}/payment/status/${transactionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Get Status Error:', error);
            return { success: false, message: error.message };
        }
    }
};

export default paymentService;