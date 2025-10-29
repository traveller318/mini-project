import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native'
import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { signIn } from '../../services/authService'
 
const SignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      const response = await signIn({ email, password })
      
      if (response.success) {
        router.replace('/(tabs)')
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      Alert.alert('Error', error.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#e0f2fe" />
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-12">
            
            {/* Graphic */}
            <View className="items-center mt-12 mb-10">
              <Image
                source={require('../../assets/images/login-graphic.jpg')}
                className="w-72 h-72"
                resizeMode="contain"
              />
            </View>

            {/* Welcome Text */}
            <View className="items-center mb-12">
              <Text 
                style={{ fontFamily: 'Poppins-Bold' }} 
                className="text-4xl text-blue-600 text-center mb-2"
              >
                Welcome Back!
              </Text>
              <Text 
                style={{ fontFamily: 'Poppins-Regular' }} 
                className="text-gray-600 text-center text-base"
              >
                Sign in to manage your finances
              </Text>
            </View>

            {/* Input Fields */}
            <View className="mb-10">
              {/* Email Input */}
              <View className="relative mb-6">
                <View className="absolute left-4 top-4 z-10">
                  <Ionicons name="mail-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full h-14 bg-white rounded-2xl pl-12 pr-4 text-gray-800 shadow-sm shadow-gray-200"
                  placeholder="Email address"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>

              {/* Password Input */}
              <View className="relative mb-6">
                <View className="absolute left-4 top-4 z-10">
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="w-full h-14 bg-white rounded-2xl pl-12 pr-12 text-gray-800 shadow-sm shadow-gray-200"
                  placeholder="Password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              className="mb-8" 
              onPress={handleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#94a3b8', '#cbd5e1'] : ['#2563eb', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full h-14 rounded-full items-center justify-center shadow-lg shadow-blue-200"
                style={{ borderRadius: 28 }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text 
                    style={{ fontFamily: 'Poppins-SemiBold' }} 
                    className="text-white text-lg"
                  >
                    Login
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="items-center pb-10">
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600">
                  Don't have an account?{' '}
                  <Text 
                    style={{ fontFamily: 'Poppins-SemiBold' }} 
                    className="text-blue-500"
                  >
                    Sign Up
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

export default SignIn
