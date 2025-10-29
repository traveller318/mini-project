import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthToken } from '../config/api';

// Types
export interface Goal {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  startDate: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  isMainGoal: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  color?: string;
  icon?: string;
  imageUrl?: string;
  category?: string;
  contributions?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalData {
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  monthlyContribution: number;
  estimatedCompletion: string;
  category?: string;
  color?: string;
  icon?: string;
}

export interface UpdateGoalData {
  name?: string;
  description?: string;
  targetAmount?: number;
  monthlyContribution?: number;
  estimatedCompletion?: string;
  category?: string;
  color?: string;
  icon?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface ContributeData {
  amount: number;
  date?: string;
  note?: string;
  source?: 'manual' | 'automatic' | 'bonus' | 'gift';
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
// GOAL SERVICE FUNCTIONS
// ============================================

/**
 * Get all goals for the current user
 */
export const getAllGoals = async (status?: string): Promise<ApiResponse<{ goals: Goal[] }>> => {
  try {
    const url = buildApiUrl(API_ENDPOINTS.GOALS);
    const queryParam = status ? `?status=${status}` : '';
    console.log('🔵 Fetching goals from:', url + queryParam);

    const response = await axios.get(url + queryParam, getAxiosConfig());
    console.log('✅ Goals fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get goals error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch goals';
    throw new Error(errorMessage);
  }
};

/**
 * Get a single goal by ID
 */
export const getGoal = async (goalId: string): Promise<ApiResponse<{ goal: Goal }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.GOALS}/${goalId}`);
    console.log('🔵 Fetching goal from:', url);

    const response = await axios.get(url, getAxiosConfig());
    console.log('✅ Goal fetched successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Get goal error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch goal';
    throw new Error(errorMessage);
  }
};

/**
 * Create a new goal
 */
export const createGoal = async (goalData: CreateGoalData): Promise<ApiResponse<{ goal: Goal }>> => {
  try {
    const url = buildApiUrl(API_ENDPOINTS.GOALS);
    console.log('🔵 Creating goal at:', url);
    console.log('🔵 Goal data:', goalData);

    const response = await axios.post(url, goalData, getAxiosConfig());
    console.log('✅ Goal created successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Create goal error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create goal';
    throw new Error(errorMessage);
  }
};

/**
 * Update an existing goal
 */
export const updateGoal = async (
  goalId: string,
  updateData: UpdateGoalData
): Promise<ApiResponse<{ goal: Goal }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.GOALS}/${goalId}`);
    console.log('🔵 Updating goal at:', url);
    console.log('🔵 Update data:', updateData);

    const response = await axios.put(url, updateData, getAxiosConfig());
    console.log('✅ Goal updated successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Update goal error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update goal';
    throw new Error(errorMessage);
  }
};

/**
 * Delete a goal (soft delete)
 */
export const deleteGoal = async (goalId: string): Promise<ApiResponse<void>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.GOALS}/${goalId}`);
    console.log('🔵 Deleting goal at:', url);

    const response = await axios.delete(url, getAxiosConfig());
    console.log('✅ Goal deleted successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Delete goal error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete goal';
    throw new Error(errorMessage);
  }
};

/**
 * Contribute money to a goal
 */
export const contributeToGoal = async (
  goalId: string,
  contributeData: ContributeData
): Promise<ApiResponse<{ goal: Goal }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.GOALS}/${goalId}/contribute`);
    console.log('🔵 Contributing to goal at:', url);
    console.log('🔵 Contribution data:', contributeData);

    const response = await axios.post(url, contributeData, getAxiosConfig());
    console.log('✅ Contribution added successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Contribute to goal error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add contribution';
    throw new Error(errorMessage);
  }
};

/**
 * Set a goal as the main goal
 */
export const setMainGoal = async (goalId: string): Promise<ApiResponse<{ goal: Goal }>> => {
  try {
    const url = buildApiUrl(`${API_ENDPOINTS.GOALS}/${goalId}/set-main`);
    console.log('🔵 Setting main goal at:', url);

    const response = await axios.put(url, {}, getAxiosConfig());
    console.log('✅ Main goal set successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Set main goal error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to set main goal';
    throw new Error(errorMessage);
  }
};
