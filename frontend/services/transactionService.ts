import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS, getAuthToken } from "../config/api";

/**
 * Transaction Service
 * 
 * This service handles all transaction-related API calls:
 * - Get all transactions (with filtering)
 * - Get transactions grouped by category
 * - Create new transaction
 * - Update existing transaction
 * - Delete transaction
 * - Scan receipt
 * 
 * Authentication:
 * The auth token is automatically added to all requests via the axios interceptor.
 * Make sure the user is signed in before making these calls.
 * 
 * Usage:
 * import { getAllTransactions, createTransaction, etc. } from '@/services/transactionService'
 * 
 * const response = await getAllTransactions();
 * if (response.success) {
 *   setTransactions(response.data.transactions);
 * }
 */

// Types
export interface Transaction {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  icon?: string;
  color?: string;
  date: string;
  timestamp: string;
  isRecurring?: boolean;
  recurringDetails?: {
    frequency: string;
    startDate: string;
    endDate?: string;
  };
  paymentMethod?: string;
  notes?: string;
}

export interface CreateTransactionData {
  name: string;
  description?: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  icon?: string;
  color?: string;
  date?: string;
  isRecurring?: boolean;
  recurringDetails?: {
    frequency: string;
    startDate?: string;
    endDate?: string;
  };
  paymentMethod?: string;
  notes?: string;
}

export interface UpdateTransactionData {
  name?: string;
  description?: string;
  amount?: number;
  type?: "income" | "expense";
  category?: string;
  icon?: string;
  color?: string;
  date?: string;
  isRecurring?: boolean;
  recurringDetails?: {
    frequency?: string;
    startDate?: string;
    endDate?: string;
  };
  paymentMethod?: string;
  notes?: string;
}

export interface TransactionCategory {
  name: string;
  icon: string;
  color: string;
  totalAmount: number;
  transactions: Transaction[];
}

export interface TransactionsResponse {
  success: boolean;
  message?: string;
  data: {
    transactions: Transaction[];
    totalPages?: number;
    currentPage?: number;
    totalTransactions?: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  message?: string;
  data: {
    categories: TransactionCategory[];
  };
}

export interface TransactionResponse {
  success: boolean;
  message?: string;
  data?: {
    transaction: Transaction;
  };
}

// Configure axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Add auth token to requests
axiosInstance.interceptors.request.use(
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

// ============================================
// TRANSACTION SERVICE FUNCTIONS
// ============================================

/**
 * Get all transactions
 */
export const getAllTransactions = async (
  page: number = 1,
  limit: number = 50,
  filters?: {
    type?: "income" | "expense";
    category?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<TransactionsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.type) params.append("type", filters.type);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const url = `${API_ENDPOINTS.TRANSACTIONS}?${params.toString()}`;
    console.log("🔵 Getting transactions from:", url);

    const response = await axiosInstance.get(url);
    console.log("✅ Transactions fetched successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Get transactions error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get transactions grouped by category
 */
export const getTransactionsByCategory = async (): Promise<CategoriesResponse> => {
  try {
    const url = `${API_ENDPOINTS.TRANSACTIONS}/by-category`;
    console.log("🔵 Getting transactions by category from:", url);

    const response = await axiosInstance.get(url);
    console.log("✅ Transaction categories fetched successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Get transactions by category error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (
  transactionData: CreateTransactionData
): Promise<TransactionResponse> => {
  try {
    const url = API_ENDPOINTS.TRANSACTIONS;
    console.log("🔵 Creating transaction at:", url);
    console.log("🔵 Transaction data:", transactionData);

    const response = await axiosInstance.post(url, transactionData);
    console.log("✅ Transaction created successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Create transaction error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update an existing transaction
 */
export const updateTransaction = async (
  transactionId: string,
  updateData: UpdateTransactionData
): Promise<TransactionResponse> => {
  try {
    const url = `${API_ENDPOINTS.TRANSACTIONS}/${transactionId}`;
    console.log("🔵 Updating transaction at:", url);
    console.log("🔵 Update data:", updateData);

    const response = await axiosInstance.put(url, updateData);
    console.log("✅ Transaction updated successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Update transaction error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (
  transactionId: string
): Promise<TransactionResponse> => {
  try {
    const url = `${API_ENDPOINTS.TRANSACTIONS}/${transactionId}`;
    console.log("🔵 Deleting transaction at:", url);

    const response = await axiosInstance.delete(url);
    console.log("✅ Transaction deleted successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Delete transaction error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Scan receipt (upload image)
 */
export const scanReceipt = async (imageUri: string): Promise<TransactionResponse> => {
  try {
    const url = `${API_ENDPOINTS.TRANSACTIONS}/scan-receipt`;
    console.log("🔵 Scanning receipt at:", url);

    // Create form data for file upload
    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "receipt.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("receipt", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await axiosInstance.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Receipt scanned successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Scan receipt error:", error.response?.data || error.message);
    throw error;
  }
};

export default {
  getAllTransactions,
  getTransactionsByCategory,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  scanReceipt,
};
