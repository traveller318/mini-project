import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { setAuthToken } from '../../config/api';
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  profileImage?: string;
  balance: number;
  cardNumber?: string;
  riskProfile: 'Low' | 'Moderate' | 'High';
  preferences: {
    currency: string;
    language: string;
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
      billReminders: boolean;
      goalReminders: boolean;
    };
  };
  income: {
    monthlyAmount: number;
    totalAmount: number;
  };
  expense: {
    monthlyAmount: number;
    totalAmount: number;
  };
  subscriptionPlan: string;
  createdAt: string;
}

const UserProfilePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Editable fields
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedDOB, setEditedDOB] = useState('');
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<'Low' | 'Moderate' | 'High'>('Moderate');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      
      if (response.success && response.data?.user) {
        const userData = response.data.user as any;
        setProfile(userData);
        setEditedName(userData.name || '');
        setEditedPhone(userData.phoneNumber || '');
        setEditedDOB(userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '');
        setSelectedRiskProfile(userData.riskProfile || 'Moderate');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const updateData: any = {
        name: editedName,
        phoneNumber: editedPhone,
        riskProfile: selectedRiskProfile,
      };

      if (editedDOB) {
        updateData.dateOfBirth = editedDOB;
      }

      const response = await updateUserProfile(updateData);
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
        fetchProfile();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear the auth token
      setAuthToken(null);
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant camera roll permissions to change your profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // In a real app, you would upload this to your server
        Alert.alert('Info', 'Profile image upload feature will be implemented with backend support');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient
        colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
        className="flex-1 justify-center items-center"
      >
        <Text className="text-gray-700 text-lg">Failed to load profile</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/30 justify-center items-center"
            >
              <Ionicons name="arrow-back" size={24} color="#1e40af" />
            </TouchableOpacity>
            
            <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800">
              My Profile
            </Text>
            
            <TouchableOpacity 
              onPress={() => setShowLogoutModal(true)}
              className="w-10 h-10 rounded-full bg-red-100 justify-center items-center"
            >
              <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* Profile Picture Section */}
            <View className="items-center mt-6 mb-6">
              <View className="relative">
                {profile.profileImage ? (
                  <Image
                    source={{ uri: profile.profileImage }}
                    className="w-32 h-32 rounded-full"
                  />
                ) : (
                  <View className="w-32 h-32 rounded-full bg-blue-600 justify-center items-center">
                    <Text className="text-white text-5xl font-bold">
                      {profile.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  onPress={pickImage}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-500 justify-center items-center border-4 border-white"
                >
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              </View>
              
              <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-2xl text-gray-800 mt-4">
                {profile.name}
              </Text>
              <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-base">
                {profile.email}
              </Text>
              <View className="mt-2 px-4 py-1 bg-blue-100 rounded-full">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-blue-700 text-sm capitalize">
                  {profile.subscriptionPlan} Plan
                </Text>
              </View>
            </View>

            {/* Financial Overview Card */}
            <View className="mx-6 mb-6 p-5 bg-white/95 rounded-2xl shadow-lg">
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-lg text-gray-800 mb-4">
                Financial Overview
              </Text>
              
              <View className="flex-row justify-between mb-3">
                <View className="items-center flex-1">
                  <Ionicons name="wallet" size={24} color="#3b82f6" />
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs mt-1">Balance</Text>
                  <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-blue-600 text-lg">
                    ${profile.balance.toLocaleString()}
                  </Text>
                </View>
                
                <View className="w-px bg-gray-200" />
                
                <View className="items-center flex-1">
                  <Ionicons name="trending-up" size={24} color="#10b981" />
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs mt-1">Income</Text>
                  <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-green-600 text-lg">
                    ${profile.income.monthlyAmount.toLocaleString()}
                  </Text>
                </View>
                
                <View className="w-px bg-gray-200" />
                
                <View className="items-center flex-1">
                  <Ionicons name="trending-down" size={24} color="#ef4444" />
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs mt-1">Expenses</Text>
                  <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-red-600 text-lg">
                    ${profile.expense.monthlyAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Personal Information Card */}
            <View className="mx-6 mb-6 p-5 bg-white/95 rounded-2xl shadow-lg">
              <View className="flex-row justify-between items-center mb-4">
                <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-lg text-gray-800">
                  Personal Information
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    if (isEditing && !saving) {
                      handleSaveProfile();
                    } else {
                      setIsEditing(!isEditing);
                    }
                  }}
                  className={`px-4 py-2 rounded-full ${isEditing ? 'bg-blue-500' : 'bg-gray-200'}`}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ fontFamily: 'Poppins-Medium' }} className={`${isEditing ? 'text-white' : 'text-gray-700'}`}>
                      {isEditing ? 'Save' : 'Edit'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-600 text-sm mb-2">
                  Full Name
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editedName}
                    onChangeText={setEditedName}
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="person-outline" size={20} color="#6b7280" />
                    <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-800 text-base ml-3">
                      {profile.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Phone */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-600 text-sm mb-2">
                  Phone Number
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editedPhone}
                    onChangeText={setEditedPhone}
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Poppins-Regular' }}
                    keyboardType="phone-pad"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="call-outline" size={20} color="#6b7280" />
                    <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-800 text-base ml-3">
                      {profile.phoneNumber || 'Not provided'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Date of Birth */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-600 text-sm mb-2">
                  Date of Birth
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editedDOB}
                    onChangeText={setEditedDOB}
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
                    style={{ fontFamily: 'Poppins-Regular' }}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-800 text-base ml-3">
                      {profile.dateOfBirth 
                        ? new Date(profile.dateOfBirth).toLocaleDateString()
                        : 'Not provided'
                      }
                    </Text>
                  </View>
                )}
              </View>

              {/* Card Number */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-600 text-sm mb-2">
                  Card Number
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="card-outline" size={20} color="#6b7280" />
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-800 text-base ml-3">
                    {profile.cardNumber || 'Not linked'}
                  </Text>
                </View>
              </View>

              {/* Member Since */}
              <View>
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-600 text-sm mb-2">
                  Member Since
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="#6b7280" />
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-800 text-base ml-3">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Investment Risk Profile */}
            <View className="mx-6 mb-6 p-5 bg-white/95 rounded-2xl shadow-lg">
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-lg text-gray-800 mb-4">
                Investment Risk Profile
              </Text>
              
              <View className="flex-row justify-between">
                {(['Low', 'Moderate', 'High'] as const).map((risk) => (
                  <TouchableOpacity
                    key={risk}
                    onPress={() => isEditing && setSelectedRiskProfile(risk)}
                    disabled={!isEditing}
                    className={`flex-1 mx-1 py-3 rounded-xl items-center ${
                      selectedRiskProfile === risk 
                        ? 'bg-blue-500' 
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text 
                      style={{ fontFamily: 'Poppins-SemiBold' }} 
                      className={`${
                        selectedRiskProfile === risk 
                          ? 'text-white' 
                          : 'text-gray-600'
                      }`}
                    >
                      {risk}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preferences Section */}
            <View className="mx-6 mb-6 p-5 bg-white/95 rounded-2xl shadow-lg">
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-lg text-gray-800 mb-4">
                Preferences
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row justify-between items-center py-2">
                  <View className="flex-row items-center">
                    <Ionicons name="globe-outline" size={20} color="#6b7280" />
                    <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-700 ml-3">
                      Currency
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-800">
                    {profile.preferences.currency}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center py-2">
                  <View className="flex-row items-center">
                    <Ionicons name="contrast-outline" size={20} color="#6b7280" />
                    <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-700 ml-3">
                      Theme
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-800 capitalize">
                    {profile.preferences.theme}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mx-6 mb-6">
              <TouchableOpacity 
                onPress={() => setShowLogoutModal(true)}
                className="bg-red-500 rounded-2xl py-4 items-center shadow-lg"
              >
                <View className="flex-row items-center">
                  <Ionicons name="log-out-outline" size={24} color="white" />
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white text-lg ml-2">
                    Logout
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Logout Confirmation Modal */}
        <Modal
          transparent
          visible={showLogoutModal}
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white rounded-3xl p-6 mx-6 w-11/12">
              <View className="items-center mb-4">
                <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="log-out-outline" size={32} color="#dc2626" />
                </View>
                <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-xl text-gray-800 mb-2">
                  Logout
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-center">
                  Are you sure you want to logout from your account?
                </Text>
              </View>

              <View className="flex-row justify-between mt-4">
                <TouchableOpacity
                  onPress={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-200 rounded-xl py-3 mr-2"
                >
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-700 text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleLogout}
                  className="flex-1 bg-red-500 rounded-xl py-3 ml-2"
                >
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white text-center">
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default UserProfilePage;
