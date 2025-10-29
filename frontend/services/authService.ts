import axios from "axios";
import { buildApiUrl, API_ENDPOINTS } from "../config/api";

// Types
export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      balance: number;
      profileImage?: string;
    };
    token: string;
  };
}

// Configure axios
const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================
// AUTH SERVICE FUNCTIONS
// ============================================

/**
 * Sign Up a new user
 */
export const signUp = async (userData: SignUpData): Promise<AuthResponse> => {
  try {
    const url = buildApiUrl(API_ENDPOINTS.SIGNUP);
    console.log("🔵 Sign up URL:", url);
    console.log("🔵 Sign up data:", { ...userData, password: "***" });

    const response = await axiosInstance.post(url, userData);
    console.log("✅ Sign up successful:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ Sign up error:", error);
    const errorMessage = error.response?.data?.message || error.message || "An error occurred during sign up";
    throw new Error(errorMessage);
  }
};

/**
 * Sign In an existing user
 */
export const signIn = async (
  credentials: SignInData
): Promise<AuthResponse> => {
  try {
    const url = buildApiUrl(API_ENDPOINTS.SIGNIN);
    console.log("🔵 Sign in URL:", url);
    console.log("🔵 Sign in data:", { ...credentials, password: "***" });

    const response = await axiosInstance.post(url, credentials);
    console.log("✅ Sign in successful:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ Sign in error:", error);
    const errorMessage = error.response?.data?.message || error.message || "An error occurred during sign in";
    throw new Error(errorMessage);
  }
};

/**
 * Sign Out the current user
 */
export const signOut = async (token?: string): Promise<void> => {
  try {
    if (token) {
      // Call logout endpoint
      await axiosInstance.post(
        buildApiUrl(API_ENDPOINTS.LOGOUT),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

/**
 * Get current user from API
 */
export const getCurrentUser = async (token: string): Promise<any> => {
  try {
    if (!token) {
      throw new Error("No token provided");
    }

    const response = await axiosInstance.get(buildApiUrl(API_ENDPOINTS.ME), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Get current user error:", error);
    const errorMessage = error.response?.data?.message || error.message || "An error occurred while fetching user data";
    throw new Error(errorMessage);
  }
};
