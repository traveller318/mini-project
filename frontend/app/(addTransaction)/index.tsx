import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native'
import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Toast } from 'toastify-react-native'
import { router } from 'expo-router'
import { createTransaction } from '../../services/transactionService'

// Category options with icons
const categories = {
  income: [
    { name: 'Salary', icon: 'cash-outline' },
    { name: 'Business', icon: 'briefcase-outline' },
    { name: 'Investment', icon: 'trending-up-outline' },
    { name: 'Freelance', icon: 'laptop-outline' },
    { name: 'Gift', icon: 'gift-outline' },
    { name: 'Other', icon: 'ellipsis-horizontal-outline' }
  ],
  expense: [
    { name: 'Food', icon: 'fast-food-outline' },
    { name: 'Transport', icon: 'car-outline' },
    { name: 'Shopping', icon: 'cart-outline' },
    { name: 'Entertainment', icon: 'game-controller-outline' },
    { name: 'Bills', icon: 'receipt-outline' },
    { name: 'Health', icon: 'medical-outline' },
    { name: 'Education', icon: 'school-outline' },
    { name: 'Travel', icon: 'airplane-outline' },
    { name: 'Groceries', icon: 'basket-outline' },
    { name: 'Rent', icon: 'home-outline' },
    { name: 'Other', icon: 'ellipsis-horizontal-outline' }
  ]
}

const AddTransactionPage = () => {
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('debit')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(categories.expense[0])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'custom'>('monthly')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType)
    setTransactionType(newType === 'income' ? 'credit' : 'debit')
    setSelectedCategory(newType === 'income' ? categories.income[0] : categories.expense[0])
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios')
    if (selectedTime) {
      const newDate = new Date(date)
      newDate.setHours(selectedTime.getHours())
      newDate.setMinutes(selectedTime.getMinutes())
      setDate(newDate)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Toast.error('❌ Please enter a valid amount', 'top')
      return
    }

    if (!description.trim()) {
      Toast.error('❌ Please enter a description', 'top')
      return
    }

    setIsSubmitting(true)

    try {
      const transactionData = {
        name: description.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        type: type,
        category: selectedCategory.name,
        icon: selectedCategory.icon,
        color: '#3B82F6',
        date: date.toISOString(),
        isRecurring: isRecurring,
        recurringDetails: isRecurring ? {
          frequency: frequency,
          startDate: date.toISOString(),
        } : undefined,
      }

      console.log('Creating transaction:', transactionData)
      
      const response = await createTransaction(transactionData)
      
      console.log('Transaction created:', response)
      
      // Show success toast
      Toast.success('✅ Transaction added successfully!', 'top')
      
      // Navigate to Transactions tab
      router.push('/(tabs)/Transactions')
    } catch (error: any) {
      console.error('Error creating transaction:', error)
      Toast.error(`❌ ${error.response?.data?.message || error.message || 'Failed to add transaction'}`, 'top')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <LinearGradient
      colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8 mt-7">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Add New Transaction
            </Text>
            <Text className="text-sm text-gray-600">
              Easily log income or expenses with categories, notes, and attachments.
            </Text>
          </View>

          {/* Transaction Type Selector - Credit/Debit */}
          <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Transaction Type</Text>
            <View className="flex-row bg-gray-100 rounded-2xl p-1">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${transactionType === 'credit' ? 'bg-green-500' : ''}`}
                onPress={() => handleTypeChange('income')}
              >
                <Text className={`text-center font-semibold ${transactionType === 'credit' ? 'text-white' : 'text-gray-600'}`}>
                  Credit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${transactionType === 'debit' ? 'bg-red-500' : ''}`}
                onPress={() => handleTypeChange('expense')}
              >
                <Text className={`text-center font-semibold ${transactionType === 'debit' ? 'text-white' : 'text-gray-600'}`}>
                  Debit
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Fields Card */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            {/* Amount */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Amount</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <Text className="text-xl font-bold text-gray-700 mr-2">₹</Text>
                <TextInput
                  className="flex-1 text-lg font-semibold text-gray-800"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Description */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Name/Description</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <TextInput
                  className="text-base text-gray-800"
                  placeholder="e.g., Lunch at cafe"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Category */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Category</Text>
              <TouchableOpacity
                className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex-row items-center justify-between"
                onPress={() => setShowCategoryModal(true)}
              >
                <View className="flex-row items-center">
                  <View className="bg-blue-100 rounded-full p-2 mr-3">
                    <Ionicons name={selectedCategory.icon as any} size={20} color="#3B82F6" />
                  </View>
                  <Text className="text-base text-gray-800 font-medium">{selectedCategory.name}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Date & Time */}
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Date & Time</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex-row items-center justify-between"
                  onPress={() => setShowDatePicker(true)}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={20} color="#3B82F6" className="mr-2" />
                    <Text className="text-sm text-gray-800 ml-2">{formatDate(date)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex-row items-center justify-between"
                  onPress={() => setShowTimePicker(true)}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={20} color="#3B82F6" className="mr-2" />
                    <Text className="text-sm text-gray-800 ml-2">{formatTime(date)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Recurring Transaction */}
          <View className="bg-white rounded-3xl p-5 mb-6 shadow-lg">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-base font-semibold text-gray-800">Recurring Transaction</Text>
                <Text className="text-xs text-gray-500 mt-1">Set this transaction to repeat</Text>
              </View>
              <TouchableOpacity
                className={`w-14 h-8 rounded-full p-1 ${isRecurring ? 'bg-blue-500' : 'bg-gray-300'}`}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <View className={`w-6 h-6 rounded-full bg-white ${isRecurring ? 'ml-auto' : ''}`} />
              </TouchableOpacity>
            </View>

            {isRecurring && (
              <View className="flex-row gap-2 mt-3">
                {(['weekly', 'monthly', 'custom'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    className={`flex-1 py-2 rounded-xl border ${frequency === freq ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text className={`text-center text-sm font-medium capitalize ${frequency === freq ? 'text-blue-600' : 'text-gray-600'}`}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl py-4 shadow-lg mb-8"
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl py-4"
            >
              <Text className="text-white text-center text-lg font-bold">
                {isSubmitting ? 'Adding...' : 'Add Transaction'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-3">
                {(type === 'income' ? categories.income : categories.expense).map((category) => (
                  <TouchableOpacity
                    key={category.name}
                    className={`w-[30%] bg-gray-50 rounded-2xl p-4 items-center border-2 ${selectedCategory.name === category.name ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                    onPress={() => {
                      setSelectedCategory(category)
                      setShowCategoryModal(false)
                    }}
                  >
                    <View className={`rounded-full p-3 mb-2 ${selectedCategory.name === category.name ? 'bg-blue-500' : 'bg-gray-200'}`}>
                      <Ionicons 
                        name={category.icon as any} 
                        size={24} 
                        color={selectedCategory.name === category.name ? '#FFFFFF' : '#6B7280'} 
                      />
                    </View>
                    <Text className={`text-xs font-medium text-center ${selectedCategory.name === category.name ? 'text-blue-600' : 'text-gray-700'}`}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}
    </LinearGradient>
  )
}

export default AddTransactionPage