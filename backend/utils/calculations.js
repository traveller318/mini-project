/**
 * Financial Calculation Utilities
 * Helper functions for financial calculations
 */

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};

/**
 * Calculate growth rate
 */
const calculateGrowthRate = (currentValue, previousValue) => {
  if (previousValue === 0) return 0;
  return Math.round(((currentValue - previousValue) / previousValue) * 100 * 100) / 100;
};

/**
 * Calculate compound interest
 */
const calculateCompoundInterest = (principal, rate, time, frequency = 12) => {
  const amount = principal * Math.pow((1 + rate / (100 * frequency)), frequency * time);
  return Math.round(amount * 100) / 100;
};

/**
 * Calculate simple interest
 */
const calculateSimpleInterest = (principal, rate, time) => {
  return Math.round((principal * rate * time / 100) * 100) / 100;
};

/**
 * Calculate EMI (Equated Monthly Installment)
 */
const calculateEMI = (principal, annualRate, months) => {
  const monthlyRate = annualRate / (12 * 100);
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi * 100) / 100;
};

/**
 * Calculate savings goal progress
 */
const calculateGoalProgress = (current, target) => {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100 * 100) / 100);
};

/**
 * Calculate budget utilization
 */
const calculateBudgetUtilization = (spent, limit) => {
  if (limit === 0) return 0;
  return Math.round((spent / limit) * 100 * 100) / 100;
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format number with commas
 */
const formatNumber = (number, decimals = 2) => {
  return number.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Calculate average
 */
const calculateAverage = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
};

/**
 * Calculate sum
 */
const calculateSum = (values) => {
  if (!values || values.length === 0) return 0;
  return values.reduce((acc, val) => acc + val, 0);
};

/**
 * Calculate variance
 */
const calculateVariance = (values) => {
  if (!values || values.length === 0) return 0;
  const avg = calculateAverage(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return calculateAverage(squareDiffs);
};

/**
 * Calculate standard deviation
 */
const calculateStandardDeviation = (values) => {
  return Math.sqrt(calculateVariance(values));
};

/**
 * Calculate income to expense ratio
 */
const calculateIncomeExpenseRatio = (income, expense) => {
  if (income === 0) return 0;
  return Math.round((expense / income) * 100 * 100) / 100;
};

/**
 * Calculate savings rate
 */
const calculateSavingsRate = (income, expense) => {
  if (income === 0) return 0;
  const savings = income - expense;
  return Math.round((savings / income) * 100 * 100) / 100;
};

/**
 * Calculate net worth
 */
const calculateNetWorth = (assets, liabilities) => {
  return assets - liabilities;
};

/**
 * Round to 2 decimal places
 */
const roundToTwo = (num) => {
  return Math.round(num * 100) / 100;
};

/**
 * Convert to Indian currency format
 */
const toIndianCurrency = (amount) => {
  const amountStr = Math.abs(amount).toString();
  const lastThree = amountStr.substring(amountStr.length - 3);
  const otherNumbers = amountStr.substring(0, amountStr.length - 3);
  
  const formatted = otherNumbers !== '' 
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  
  return amount < 0 ? '-₹' + formatted : '₹' + formatted;
};

module.exports = {
  calculatePercentage,
  calculateGrowthRate,
  calculateCompoundInterest,
  calculateSimpleInterest,
  calculateEMI,
  calculateGoalProgress,
  calculateBudgetUtilization,
  formatCurrency,
  formatNumber,
  calculateAverage,
  calculateSum,
  calculateVariance,
  calculateStandardDeviation,
  calculateIncomeExpenseRatio,
  calculateSavingsRate,
  calculateNetWorth,
  roundToTwo,
  toIndianCurrency
};
