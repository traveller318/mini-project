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
