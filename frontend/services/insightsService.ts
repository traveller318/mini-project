import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, getAuthToken } from '../config/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for AI-powered insights
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

interface ExpenseDistributionData {
  expenseData: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  totalExpense: number;
}

interface IncomeProgressionData {
  progressionData: Array<{
    month: string;
    income: number;
  }>;
  insufficientData?: boolean;
}

interface SpendingOverTimeData {
  spendingData: Array<{
    day: number;
    amount: number;
    cumulative: number;
  }>;
  totalSpent: number;
  month: string;
}

interface CategoryTrendsData {
  trendData: Array<{
    month: string;
    [key: string]: number | string;
  }>;
  categories: string[];
  insufficientData?: boolean;
}

interface FinancialHealthData {
  score: number;
  breakdown: {
    incomeExpenseRatio: number;
    savingsRate: number;
    monthlyIncome: number;
    monthlyExpense: number;
    balance: number;
  };
}

interface Insight {
  type: 'warning' | 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  icon: string;
}

interface InsightsData {
  insights: Insight[];
}

class InsightsService {
  /**
   * Get expense distribution (Pie Chart data)
   */
  async getExpenseDistribution(startDate?: string, endDate?: string): Promise<ExpenseDistributionData> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get(`${API_ENDPOINTS.INSIGHTS}/expense-distribution`, {
      params,
    });

    return response.data.data;
  }

  /**
   * Get income progression (Line Chart data)
   */
  async getIncomeProgression(months: number = 6): Promise<IncomeProgressionData> {
    const response = await api.get(`${API_ENDPOINTS.INSIGHTS}/income-progression`, {
      params: { months },
    });

    return response.data.data;
  }

  /**
   * Get spending over time (Cumulative spending chart)
   */
  async getSpendingOverTime(month?: number, year?: number): Promise<SpendingOverTimeData> {
    const params: any = {};
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;

    const response = await api.get(`${API_ENDPOINTS.INSIGHTS}/spending-over-time`, {
      params,
    });

    return response.data.data;
  }

  /**
   * Get category trends (Stacked Area Chart data)
   */
  async getCategoryTrends(months: number = 6, categories?: string[]): Promise<CategoryTrendsData> {
    const params: any = { months };
    if (categories && categories.length > 0) {
      params.categories = categories.join(',');
    }

    const response = await api.get(`${API_ENDPOINTS.INSIGHTS}/category-trends`, {
      params,
    });

    return response.data.data;
  }

  /**
   * Get financial health score
   */
  async getFinancialHealthScore(): Promise<FinancialHealthData> {
    const response = await api.get(`${API_ENDPOINTS.INSIGHTS}/financial-health`);

    return response.data.data;
  }

  /**
   * Get insights and recommendations
   */
  async getInsights(): Promise<InsightsData> {
    try {
      const response = await api.get(`${API_ENDPOINTS.INSIGHTS}/recommendations`);
      console.log('🔍 Insights Service Raw Response:', JSON.stringify(response.data, null, 2));
      
      if (!response.data || !response.data.data) {
        console.error('❌ Invalid response structure:', response.data);
        return { insights: [] };
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error in getInsights:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new InsightsService();
