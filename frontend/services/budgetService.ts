import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthToken } from '../config/api';

// Budget Interface
export interface Budget {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  limit: number;
  spent: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  color?: string;
  icon?: string;
  status: 'active' | 'completed' | 'exceeded';
  alerts?: {
    enabled: boolean;
    thresholds: Array<{
      percentage: number;
      triggered: boolean;
    }>;
  };
  isRecurring?: boolean;
  recurringSettings?: {
    autoRenew: boolean;
    renewalDay?: number;
  };
  transactions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetOverview {
  budgets: Budget[];
  overview: {
    totalLimit: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
    categoriesAtRisk: number;
  };
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  category: string;
  threshold: number;
  currentPercentage: number;
  spent: number;
  limit: number;
}

// API Response Interface
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Configure axios instance with auth
const getAxiosConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  };
};

// ============================================
// BUDGET API CALLS
// ============================================

/**
 * Create a new budget
 */
export const createBudget = async (budgetData: {
  name?: string;
  description?: string;
  category: string;
  limit: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate?: string;
  endDate?: string;
  color?: string;
  icon?: string;
  alerts?: {
    enabled: boolean;
    thresholds: Array<{
      percentage: number;
      triggered: boolean;
    }>;
  };
}): Promise<ApiResponse<{ budget: Budget }>> => {
  try {
    const url = buildApiUrl(API_ENDPOINTS.BUDGETS);
    const response = await axios.post(url, budgetData, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Create Budget Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to create budget');
  }
};

/**
 * Get all budgets for the authenticated user
 */
export const getAllBudgets = async (params?: {
  status?: 'active' | 'completed' | 'exceeded';
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  category?: string;
}): Promise<ApiResponse<{ budgets: Budget[]; count: number }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.category) queryParams.append('category', params.category);

    const queryString = queryParams.toString();
    const url = buildApiUrl(`${API_ENDPOINTS.BUDGETS}${queryString ? `?${queryString}` : ''}`);

    const response = await axios.get(url, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Get All Budgets Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch budgets');
  }
};

/**
 * Get budget by ID
 */
export const getBudgetById = async (budgetId: string): Promise<ApiResponse<{ budget: Budget }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.BUDGETS}/${budgetId}`);
    const response = await axios.get(url, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Get Budget By ID Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch budget');
  }
};

/**
 * Get budgets by category
 */
export const getBudgetsByCategory = async (
  category: string
): Promise<ApiResponse<{ budgets: Budget[]; category: string; count: number }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.BUDGETS}/category/${category}`);
    const response = await axios.get(url, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Get Budgets By Category Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch budgets by category');
  }
};

/**
 * Update budget
 */
export const updateBudget = async (
  budgetId: string,
  updateData: Partial<Budget>
): Promise<ApiResponse<{ budget: Budget }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.BUDGETS}/${budgetId}`);
    const response = await axios.put(url, updateData, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Update Budget Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update budget');
  }
};

/**
 * Delete budget (soft delete)
 */
export const deleteBudget = async (budgetId: string): Promise<ApiResponse<{ budget: Budget }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.BUDGETS}/${budgetId}`);
    const response = await axios.delete(url, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Delete Budget Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to delete budget');
  }
};

/**
 * Get budget overview
 */
export const getBudgetOverview = async (
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' = 'monthly'
): Promise<ApiResponse<BudgetOverview>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.BUDGETS}/overview?period=${period}`);
    const response = await axios.get(url, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Get Budget Overview Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch budget overview');
  }
};

/**
 * Check budget alerts
 */
export const checkBudgetAlerts = async (): Promise<ApiResponse<{ alerts: BudgetAlert[] }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.BUDGETS}/alerts`);
    const response = await axios.get(url, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Check Budget Alerts Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to check budget alerts');
  }
};

/**
 * Renew recurring budgets
 */
export const renewBudgets = async (): Promise<ApiResponse<{ renewed: Budget[]; count: number }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.BUDGETS}/renew`);
    const response = await axios.post(url, {}, getAxiosConfig());
    return response.data;
  } catch (error: any) {
    console.error('Renew Budgets Error:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to renew budgets');
  }
};
