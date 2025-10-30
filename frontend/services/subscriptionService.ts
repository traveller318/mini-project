import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthToken } from '../config/api';

// Types
export interface Subscription {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category: 'Entertainment' | 'Bills' | 'EMI' | 'Other';
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  dueDate: string;
  nextDueDate?: string;
  icon?: string;
  logo?: string;
  color?: string;
  status: 'active' | 'paused' | 'cancelled';
  paymentHistory?: PaymentHistory[];
  analytics?: {
    totalPaid: number;
    paymentCount: number;
    averagePayment: number;
    lastPaymentDate?: string;
  };
  daysUntilDue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentHistory {
  amount: number;
  paidOn: string;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  note?: string;
}

export interface CreateSubscriptionData {
  name: string;
  description?: string;
  category: string;
  amount: number;
  frequency: string;
  startDate?: string;
  endDate?: string;
  dueDate: string;
  icon?: string;
  logo?: string;
  color?: string;
}

export interface UpdateSubscriptionData {
  name?: string;
  description?: string;
  category?: string;
  amount?: number;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  icon?: string;
  logo?: string;
  color?: string;
  status?: string;
}

export interface RecordPaymentData {
  amount?: number;
  paidOn?: string;
  status?: 'success' | 'failed' | 'pending';
  transactionId?: string;
  note?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Configure axios instance
const getAxiosConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };
};

// ============================================
// SUBSCRIPTION SERVICE FUNCTIONS
// ============================================

/**
 * Get all subscriptions for the current user
 */
export const getAllSubscriptions = async (status?: string, category?: string): Promise<ApiResponse<{ subscriptions: Subscription[] }>> => {
  try {
    const url = buildApiUrl(API_ENDPOINTS.SUBSCRIPTIONS);
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    const queryParam = params.toString() ? `?${params.toString()}` : '';
    
    console.log('🔵 Fetching subscriptions from:', url + queryParam);

    const response = await axios.get(url + queryParam, getAxiosConfig());
    console.log('✅ Subscriptions fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get subscriptions error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch subscriptions';
    throw new Error(errorMessage);
  }
};

/**
 * Get upcoming subscriptions
 */
export const getUpcomingSubscriptions = async (days: number = 30): Promise<ApiResponse<{ subscriptions: Subscription[] }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.SUBSCRIPTIONS}/upcoming?days=${days}`);
    console.log('🔵 Fetching upcoming subscriptions from:', url);

    const response = await axios.get(url, getAxiosConfig());
    console.log('✅ Upcoming subscriptions fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get upcoming subscriptions error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch upcoming subscriptions';
    throw new Error(errorMessage);
  }
};

/**
 * Get calendar data for subscriptions
 */
export const getCalendarData = async (month: number, year: number): Promise<ApiResponse<{ calendarData: any }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.SUBSCRIPTIONS}/calendar?month=${month}&year=${year}`);
    console.log('🔵 Fetching calendar data from:', url);

    const response = await axios.get(url, getAxiosConfig());
    console.log('✅ Calendar data fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get calendar data error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch calendar data';
    throw new Error(errorMessage);
  }
};

/**
 * Get a single subscription by ID
 */
export const getSubscription = async (id: string): Promise<ApiResponse<{ subscription: Subscription }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.SUBSCRIPTIONS}/${id}`);
    console.log('🔵 Fetching subscription from:', url);

    const response = await axios.get(url, getAxiosConfig());
    console.log('✅ Subscription fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get subscription error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch subscription';
    throw new Error(errorMessage);
  }
};

/**
 * Create a new subscription
 */
export const createSubscription = async (subscriptionData: CreateSubscriptionData): Promise<ApiResponse<{ subscription: Subscription }>> => {
  try {
    const url = buildApiUrl(API_ENDPOINTS.SUBSCRIPTIONS);
    console.log('🔵 Creating subscription at:', url);
    console.log('📤 Subscription data:', subscriptionData);

    const response = await axios.post(url, subscriptionData, getAxiosConfig());
    console.log('✅ Subscription created successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Create subscription error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create subscription';
    throw new Error(errorMessage);
  }
};

/**
 * Update a subscription
 */
export const updateSubscription = async (id: string, subscriptionData: UpdateSubscriptionData): Promise<ApiResponse<{ subscription: Subscription }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.SUBSCRIPTIONS}/${id}`);
    console.log('🔵 Updating subscription at:', url);
    console.log('📤 Update data:', subscriptionData);

    const response = await axios.put(url, subscriptionData, getAxiosConfig());
    console.log('✅ Subscription updated successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Update subscription error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update subscription';
    throw new Error(errorMessage);
  }
};

/**
 * Delete a subscription
 */
export const deleteSubscription = async (id: string): Promise<ApiResponse<any>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.SUBSCRIPTIONS}/${id}`);
    console.log('🔵 Deleting subscription at:', url);

    const response = await axios.delete(url, getAxiosConfig());
    console.log('✅ Subscription deleted successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Delete subscription error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete subscription';
    throw new Error(errorMessage);
  }
};

/**
 * Record a payment for a subscription
 */
export const recordPayment = async (id: string, paymentData: RecordPaymentData): Promise<ApiResponse<{ subscription: Subscription }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.SUBSCRIPTIONS}/${id}/payment`);
    console.log('🔵 Recording payment at:', url);
    console.log('📤 Payment data:', paymentData);

    const response = await axios.post(url, paymentData, getAxiosConfig());
    console.log('✅ Payment recorded successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Record payment error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to record payment';
    throw new Error(errorMessage);
  }
};
