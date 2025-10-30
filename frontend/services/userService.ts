import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthToken } from '../config/api';

// Types
export interface UserData {
  name: string;
  email: string;
  balance: number;
  cardNumber?: string;
  profileImage?: string;
  income: {
    amount: number;
    percentage: number;
  };
  expense: {
    amount: number;
    percentage: number;
  };
}

export interface DashboardTransaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  timestamp: string;
  icon?: string;
}

export interface DashboardGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  color?: string;
  isMainGoal?: boolean;
}

export interface DashboardSubscription {
  id: string;
  name: string;
  icon?: string;
  logo?: string;
  amount: number;
  frequency: string;
  dueDate: string;
  daysUntilDue: number;
  category: string;
}

export interface DashboardData {
  userData: UserData;
  savingGoals: DashboardGoal[];
  recentTransactions: DashboardTransaction[];
  upcomingBillsAndSubscriptions: DashboardSubscription[];
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
// USER SERVICE FUNCTIONS
// ============================================

/**
 * Get dashboard data (user info, goals, transactions, subscriptions)
 */
export const getDashboardData = async (): Promise<ApiResponse<DashboardData>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.USERS}/dashboard`);
    console.log('🔵 Fetching dashboard data from:', url);

    const response = await axios.get(url, getAxiosConfig());
    console.log('✅ Dashboard data fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get dashboard data error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';
    throw new Error(errorMessage);
  }
};

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.USERS}/profile`);
    console.log('🔵 Fetching user profile from:', url);

    const response = await axios.get(url, getAxiosConfig());
    console.log('✅ User profile fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get user profile error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user profile';
    throw new Error(errorMessage);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updateData: Partial<UserData>): Promise<ApiResponse<{ user: UserData }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.USERS}/profile`);
    console.log('🔵 Updating user profile at:', url);
    console.log('📤 Update data:', updateData);

    const response = await axios.put(url, updateData, getAxiosConfig());
    console.log('✅ User profile updated successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Update user profile error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update user profile';
    throw new Error(errorMessage);
  }
};

/**
 * Update user risk profile
 */
export const updateRiskProfile = async (riskProfile: 'Low' | 'Moderate' | 'High'): Promise<ApiResponse<any>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.USERS}/risk-profile`);
    console.log('🔵 Updating risk profile at:', url);

    const response = await axios.put(url, { riskProfile }, getAxiosConfig());
    console.log('✅ Risk profile updated successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Update risk profile error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update risk profile';
    throw new Error(errorMessage);
  }
};

/**
 * Get financial summary
 */
export const getFinancialSummary = async (): Promise<ApiResponse<any>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.USERS}/financial-summary`);
    console.log('🔵 Fetching financial summary from:', url);

    const response = await axios.get(url, getAxiosConfig());
    console.log('✅ Financial summary fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get financial summary error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch financial summary';
    throw new Error(errorMessage);
  }
};

export default {
  getDashboardData,
  getUserProfile,
  updateUserProfile,
  updateRiskProfile,
  getFinancialSummary,
};
