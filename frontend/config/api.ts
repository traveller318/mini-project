import { Platform } from 'react-native';

// API Configuration
// IMPORTANT: Update this based on your testing environment
// Option 1: Android Emulator - Use 10.0.2.2
// Option 2: iOS Simulator - Use localhost
// Option 3: Physical Device - Use your computer's IP (run 'ipconfig' on Windows)

const getBaseUrl = () => {
  return 'https://mini-project-a9ii.onrender.com/api/v1';
};


export const API_BASE_URL = getBaseUrl();

console.log('📡 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  SIGNUP: '/auth/signup',
  SIGNIN: '/auth/signin',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  
  // Users
  USERS: '/users',
  
  // Transactions
  TRANSACTIONS: '/transactions',
  
  // Goals
  GOALS: '/goals',
  
  // Budgets
  BUDGETS: '/budgets',
  
  // Subscriptions
  SUBSCRIPTIONS: '/subscriptions',
  
  // Insights
  INSIGHTS: '/insights',
  
  // Investments
  INVESTMENTS: '/investments',
  
  // Voice
  VOICE: '/voice',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Token storage
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = (): string | null => {
  return authToken;
};
