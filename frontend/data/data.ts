export const userData = {
  name: "John Doe",
  balance: 24592.89,
  cardNumber: "**** 2112",
  income: {
    amount: 2840.50,
    percentage: 12.5
  },
  expense: {
    amount: 1650.25,
    percentage: 8.3
  }
};

export const savingGoals = [
  {
    id: 1,
    title: "PlayStation 5",
    current: 420.21,
    target: 609.95,
    color: "#3B82F6"
  },
  {
    id: 2,
    title: "New Laptop",
    current: 1250.00,
    target: 2500.00,
    color: "#10B981"
  },
  {
    id: 3,
    title: "Vacation Fund",
    current: 800.50,
    target: 1500.00,
    color: "#F59E0B"
  }
];

export const recentTransactions = [
  {
    id: 1,
    name: "Google LLC",
    category: "Work",
    amount: 2500.00,
    type: "income",
    timestamp: "2h ago",
    icon: "logo-google"
  },
  {
    id: 2,
    name: "Netflix",
    category: "Subscription",
    amount: -15.99,
    type: "expense",
    timestamp: "1d ago",
    icon: "film-outline"
  },
  {
    id: 3,
    name: "Starbucks",
    category: "Food & Drink",
    amount: -12.50,
    type: "expense",
    timestamp: "2d ago",
    icon: "cafe-outline"
  },
  {
    id: 4,
    name: "Amazon",
    category: "Shopping",
    amount: -89.99,
    type: "expense",
    timestamp: "3d ago",
    icon: "bag-outline"
  },
  {
    id: 5,
    name: "Salary Deposit",
    category: "Work",
    amount: 3500.00,
    type: "income",
    timestamp: "1w ago",
    icon: "card-outline"
  }
];

export const spendingInsights = {
  totalSpent: 2845.73,
  totalReceived: 6000.00,
  weeklySpending: 425.80,
  monthlySpending: 1850.25,
  weeklyReceived: 750.00,
  monthlyReceived: 3500.00,
  spendingByCategory: [
    { name: 'Food & Drink', amount: 567.50, color: '#FF6B6B', percentage: 25 },
    { name: 'Shopping', amount: 890.23, color: '#4ECDC4', percentage: 35 },
    { name: 'Transport', amount: 234.60, color: '#45B7D1', percentage: 12 },
    { name: 'Entertainment', amount: 345.80, color: '#F9CA24', percentage: 18 },
    { name: 'Bills & Utilities', amount: 456.90, color: '#6C5CE7', percentage: 20 },    { name: 'Others', amount: 350.70, color: '#A0A0A0', percentage: 15 }
  ]
};

export const upcomingBillsAndSubscriptions = [
  {
    id: 1,
    name: 'Spotify',
    icon: 'musical-notes',
    logo: 'spotify',
    amount: 199,
    frequency: 'mo',
    dueDate: '12 Oct, 2025',
    daysUntilDue: 1,
    category: 'Entertainment'
  },
  {
    id: 2,
    name: 'Netflix',
    icon: 'film',
    logo: 'netflix',
    amount: 649,
    frequency: 'mo',
    dueDate: '15 Oct, 2025',
    daysUntilDue: 4,
    category: 'Entertainment'
  },
  {
    id: 3,
    name: 'Amazon Prime',
    icon: 'cart',
    logo: 'amazon',
    amount: 179,
    frequency: 'mo',
    dueDate: '18 Oct, 2025',
    daysUntilDue: 7,
    category: 'Shopping'
  },
  {
    id: 4,
    name: 'Electricity Bill',
    icon: 'flash',
    logo: 'electricity',
    amount: 2350,
    frequency: 'mo',
    dueDate: '20 Oct, 2025',
    daysUntilDue: 9,
    category: 'Utilities'
  },
  {
    id: 5,
    name: 'Internet Bill',
    icon: 'wifi',
    logo: 'internet',
    amount: 999,
    frequency: 'mo',
    dueDate: '22 Oct, 2025',
    daysUntilDue: 11,
    category: 'Utilities'
  },
  {
    id: 6,
    name: 'Home Loan EMI',
    icon: 'home',
    logo: 'loan',
    amount: 15000,
    frequency: 'mo',
    dueDate: '05 Nov, 2025',
    daysUntilDue: 25,
    category: 'Loans'
  }
];

// Enhanced Transactions Data
export const allTransactions = [
  {
    id: 1,
    name: "Upwork",
    category: "Work",
    amount: 850.00,
    type: "income",
    timestamp: "Today",
    date: "13 Oct, 2025",
    icon: "💼",
    description: "Freelance payment"
  },
  {
    id: 2,
    name: "Transfer",
    category: "Transfer",
    amount: -85.00,
    type: "expense",
    timestamp: "Yesterday",
    date: "12 Oct, 2025",
    icon: "💸",
    description: "Bank transfer"
  },
  {
    id: 3,
    name: "PayPal",
    category: "Work",
    amount: 1406.00,
    type: "income",
    timestamp: "Jan 30, 2022",
    date: "30 Jan, 2022",
    icon: "💳",
    description: "Online payment received"
  },
  {
    id: 4,
    name: "YouTube",
    category: "Entertainment",
    amount: -11.99,
    type: "expense",
    timestamp: "Jan 16, 2022",
    date: "16 Jan, 2022",
    icon: "📺",
    description: "Premium subscription"
  },
  {
    id: 5,
    name: "Spotify",
    category: "Entertainment",
    amount: -199.00,
    type: "expense",
    timestamp: "3d ago",
    date: "10 Oct, 2025",
    icon: "🎵",
    description: "Music streaming"
  },
  {
    id: 6,
    name: "Swiggy",
    category: "Food & Drink",
    amount: -450.00,
    type: "expense",
    timestamp: "5d ago",
    date: "08 Oct, 2025",
    icon: "🍕",
    description: "Food delivery"
  },
  {
    id: 7,
    name: "Salary Deposit",
    category: "Work",
    amount: 45000.00,
    type: "income",
    timestamp: "1w ago",
    date: "06 Oct, 2025",
    icon: "💰",
    description: "Monthly salary"
  },
  {
    id: 8,
    name: "Amazon",
    category: "Shopping",
    amount: -1299.00,
    type: "expense",
    timestamp: "1w ago",
    date: "05 Oct, 2025",
    icon: "🛒",
    description: "Online shopping"
  },
  {
    id: 9,
    name: "Electricity Bill",
    category: "Utilities",
    amount: -2350.00,
    type: "expense",
    timestamp: "2w ago",
    date: "28 Sep, 2025",
    icon: "⚡",
    description: "Monthly electricity bill"
  },
  {
    id: 10,
    name: "Uber",
    category: "Transport",
    amount: -285.00,
    type: "expense",
    timestamp: "2w ago",
    date: "27 Sep, 2025",
    icon: "🚗",
    description: "Ride booking"
  },
  {
    id: 11,
    name: "Zomato",
    category: "Food & Drink",
    amount: -320.00,
    type: "expense",
    timestamp: "3d ago",
    date: "10 Oct, 2025",
    icon: "🍽️",
    description: "Food delivery"
  },
  {
    id: 12,
    name: "Starbucks",
    category: "Food & Drink",
    amount: -245.00,
    type: "expense",
    timestamp: "1w ago",
    date: "06 Oct, 2025",
    icon: "☕",
    description: "Coffee"
  },
  {
    id: 13,
    name: "Flipkart",
    category: "Shopping",
    amount: -899.00,
    type: "expense",
    timestamp: "4d ago",
    date: "09 Oct, 2025",
    icon: "🛍️",
    description: "Online shopping"
  },
  {
    id: 14,
    name: "Myntra",
    category: "Shopping",
    amount: -1599.00,
    type: "expense",
    timestamp: "1w ago",
    date: "06 Oct, 2025",
    icon: "👕",
    description: "Clothing"
  },
  {
    id: 15,
    name: "Ola",
    category: "Transport",
    amount: -150.00,
    type: "expense",
    timestamp: "2d ago",
    date: "11 Oct, 2025",
    icon: "🚕",
    description: "Cab ride"
  },
  {
    id: 16,
    name: "Metro Card Recharge",
    category: "Transport",
    amount: -500.00,
    type: "expense",
    timestamp: "1w ago",
    date: "06 Oct, 2025",
    icon: "🚇",
    description: "Public transport"
  },
  {
    id: 17,
    name: "Netflix",
    category: "Entertainment",
    amount: -649.00,
    type: "expense",
    timestamp: "2w ago",
    date: "01 Oct, 2025",
    icon: "🎬",
    description: "Streaming subscription"
  },
  {
    id: 18,
    name: "Amazon Prime",
    category: "Entertainment",
    amount: -179.00,
    type: "expense",
    timestamp: "2w ago",
    date: "30 Sep, 2025",
    icon: "📺",
    description: "Subscription"
  },
  {
    id: 19,
    name: "Water Bill",
    category: "Utilities",
    amount: -450.00,
    type: "expense",
    timestamp: "3w ago",
    date: "20 Sep, 2025",
    icon: "💧",
    description: "Monthly water bill"
  },
  {
    id: 20,
    name: "Internet Bill",
    category: "Utilities",
    amount: -999.00,
    type: "expense",
    timestamp: "3w ago",
    date: "22 Sep, 2025",
    icon: "📶",
    description: "Broadband"
  },
  {
    id: 21,
    name: "Freelance Project",
    category: "Work",
    amount: 2500.00,
    type: "income",
    timestamp: "1w ago",
    date: "04 Oct, 2025",
    icon: "💻",
    description: "Web development"
  },
  {
    id: 22,
    name: "Bank Transfer",
    category: "Transfer",
    amount: -200.00,
    type: "expense",
    timestamp: "5d ago",
    date: "08 Oct, 2025",
    icon: "💳",
    description: "Transfer to friend"
  }
];

// Transaction Categories for Groups Tab
export const transactionCategories = [
  {
    name: "Work",
    icon: "💼",
    color: "#10B981",
    totalAmount: 47256.00,
    transactions: allTransactions.filter(t => t.category === "Work")
  },
  {
    name: "Entertainment",
    icon: "🎬",
    color: "#F59E0B",
    totalAmount: -210.99,
    transactions: allTransactions.filter(t => t.category === "Entertainment")
  },
  {
    name: "Food & Drink",
    icon: "🍔",
    color: "#EF4444",
    totalAmount: -450.00,
    transactions: allTransactions.filter(t => t.category === "Food & Drink")
  },
  {
    name: "Shopping",
    icon: "🛒",
    color: "#8B5CF6",
    totalAmount: -1299.00,
    transactions: allTransactions.filter(t => t.category === "Shopping")
  },
  {
    name: "Utilities",
    icon: "⚡",
    color: "#06B6D4",
    totalAmount: -2350.00,
    transactions: allTransactions.filter(t => t.category === "Utilities")
  },
  {
    name: "Transport",
    icon: "🚗",
    color: "#F97316",
    totalAmount: -285.00,
    transactions: allTransactions.filter(t => t.category === "Transport")
  },
  {
    name: "Transfer",
    icon: "💸",
    color: "#6B7280",
    totalAmount: -85.00,
    transactions: allTransactions.filter(t => t.category === "Transfer")
  }
];

// Insights Page Data
export const expenseDomainData = [
  {
    name: 'Food & Drink',
    amount: 1015,
    color: '#FF6B6B',
    percentage: 22,
    legendFontColor: '#1e293b',
    legendFontSize: 12
  },
  {
    name: 'Shopping',
    amount: 3797,
    color: '#8B5CF6',
    percentage: 28,
    legendFontColor: '#1e293b',
    legendFontSize: 12
  },
  {
    name: 'Transport',
    amount: 935,
    color: '#F97316',
    percentage: 14,
    legendFontColor: '#1e293b',
    legendFontSize: 12
  },
  {
    name: 'Entertainment',
    amount: 1038,
    color: '#F59E0B',
    percentage: 18,
    legendFontColor: '#1e293b',
    legendFontSize: 12
  },
  {
    name: 'Utilities',
    amount: 3799,
    color: '#06B6D4',
    percentage: 18,
    legendFontColor: '#1e293b',
    legendFontSize: 12
  }
];

export const salaryProgressionData = [
  { month: 'Apr', salary: 38000 },
  { month: 'May', salary: 40000 },
  { month: 'Jun', salary: 39500 },
  { month: 'Jul', salary: 42000 },
  { month: 'Aug', salary: 41500 },
  { month: 'Sep', salary: 45000 },
  { month: 'Oct', salary: 45000 }
];

export const financialHealthScore = 78;

export const categoryTrendData = [
  { month: 'May', food: 850, shopping: 1200, travel: 500, entertainment: 400 },
  { month: 'Jun', food: 920, shopping: 1350, travel: 800, entertainment: 450 },
  { month: 'Jul', food: 880, shopping: 1500, travel: 1200, entertainment: 500 },
  { month: 'Aug', food: 1050, shopping: 2100, travel: 2500, entertainment: 650 },
  { month: 'Sep', food: 1100, shopping: 1800, travel: 900, entertainment: 550 },
  { month: 'Oct', food: 1015, shopping: 1600, travel: 935, entertainment: 480 }
];

export const spendingOverTimeData = [
  { day: '1', amount: 850, cumulative: 850, budget: 15000 },
  { day: '5', amount: 1200, cumulative: 6050, budget: 15000 },
  { day: '8', amount: 950, cumulative: 3000, budget: 15000 },
  { day: '12', amount: 1500, cumulative: 2500, budget: 15000 },
  { day: '15', amount: 900, cumulative: 5400, budget: 15000 },
  { day: '18', amount: 1350, cumulative: 1750, budget: 15000 },
  { day: '20', amount: 1800, cumulative: 5550, budget: 15000 },
  { day: '23', amount: 1250, cumulative: 9800, budget: 15000 },
  { day: '26', amount: 950, cumulative: 10750, budget: 15000 },
  { day: '28', amount: 1134, cumulative: 11884, budget: 15000 }
];

export const monthlyBudget = 15000;
export const currentDayOfMonth = 20;
export const spentTillDate = 8550;
export const budgetUsedPercentage = 57;
export const dailyAverageIncrease = 12;

export const insightsCards = {
  spendingOverTimeInsight: {
    title: 'Budget Alert: On Track',
    description: `You spent 57% of your monthly budget by the 20th — your daily average increased by 12% compared to last month. Consider slowing down to stay within budget.`,
    icon: '⚡',
    trend: 'warning'
  },
  expenseInsight: {
    title: 'Top Spending Category',
    description: 'Utilities and Shopping dominate your expenses at 28% and 18% respectively. Consider reviewing subscription services and look for better deals on regular purchases.',
    icon: '💡',
    trend: 'neutral'
  },
  salaryInsight: {
    title: 'Salary Growth Trend',
    description: 'Your salary has grown by 18.4% over the last 6 months, showing consistent career progression. This positive trend reflects your professional development.',
    icon: '📈',
    trend: 'positive'
  },
  healthInsight: {
    title: 'Financial Health',
    description: 'Your score of 78/100 indicates good financial health. You maintain a healthy income-to-expense ratio and consistent savings. Focus on emergency fund growth.',
    icon: '❤️',
    trend: 'positive'
  },
  categoryTrendInsight: {
    title: 'Spending Pattern Analysis',
    description: 'Travel and Shopping expenses peaked in August at ₹2,500 and ₹2,100 respectively — possibly due to festive season or vacations. Your spending has normalized in recent months.',
    icon: '📊',
    trend: 'neutral'
  }
};
