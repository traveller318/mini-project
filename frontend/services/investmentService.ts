import axios from "axios";
import { buildApiUrl, API_ENDPOINTS, getAuthToken } from "../config/api";

// Types
export interface Investment {
  id: number;
  name: string;
  description: string;
  performance: string;
  buttonText: string;
  confidence: number;
  icon: string;
  color: string;
  type: string;
  minInvestment: number;
}

export interface Insight {
  message: string;
  icon: string;
  color: string;
  gradient: string[];
  type: string;
}

export interface InvestmentRecommendationsResponse {
  success: boolean;
  message?: string;
  data?: {
    recommendations: Investment[];
    riskProfile: string;
    balance: number;
    insights: Insight[];
  };
}

export interface PersonalizedInsightsResponse {
  success: boolean;
  message?: string;
  data?: {
    insights: Insight[];
  };
}

export interface UpdateRiskProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    riskProfile: string;
    recommendations: Investment[];
  };
}

// ============================================
// INVESTMENT SERVICE FUNCTIONS
// ============================================

/**
 * Get investment recommendations based on user's risk profile
 */
export const getInvestmentRecommendations = async (): Promise<InvestmentRecommendationsResponse> => {
  try {
    const token = await getAuthToken();
    const url = buildApiUrl('/investments/recommendations');
    
    console.log('🔵 Fetching investment recommendations from:', url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Investment recommendations fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching investment recommendations:', error.response?.data || error.message);
    throw error.response?.data || { success: false, message: 'Failed to fetch investment recommendations' };
  }
};

/**
 * Get personalized investment insights
 */
export const getPersonalizedInsights = async (): Promise<PersonalizedInsightsResponse> => {
  try {
    const token = await getAuthToken();
    const url = buildApiUrl('/investments/insights');
    
    console.log('🔵 Fetching personalized insights from:', url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Personalized insights fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching personalized insights:', error.response?.data || error.message);
    throw error.response?.data || { success: false, message: 'Failed to fetch personalized insights' };
  }
};

/**
 * Update user's risk profile
 */
export const updateRiskProfile = async (riskProfile: 'Low' | 'Moderate' | 'High'): Promise<UpdateRiskProfileResponse> => {
  try {
    const token = await getAuthToken();
    const url = buildApiUrl('/investments/risk-profile');
    
    console.log('🔵 Updating risk profile to:', riskProfile);

    const response = await axios.put(
      url,
      { riskProfile },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Risk profile updated successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating risk profile:', error.response?.data || error.message);
    throw error.response?.data || { success: false, message: 'Failed to update risk profile' };
  }
};

export default {
  getInvestmentRecommendations,
  getPersonalizedInsights,
  updateRiskProfile,
};
