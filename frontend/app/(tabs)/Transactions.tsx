import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Toast } from 'toastify-react-native';
import { userData, allTransactions, transactionCategories } from '../../data/data';

const { width } = Dimensions.get('window');

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleScanPress = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Toast.error('📷 Camera permission required to scan receipts', 'top');
        return;
      }

      // Show loading toast while preparing camera
      Toast.info('📸 Opening camera...', 'top');

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Navigate to afterTake screen with the image data
        router.push({
          pathname: '/(afterTake)' as any,
          params: {
            imageUri: asset.uri,
            fileName: asset.fileName || 'captured_image.jpg',
            fileSize: asset.fileSize?.toString() || '0',
            width: asset.width?.toString() || '0',
            height: asset.height?.toString() || '0'
          }
        });
      }
    } catch (error) {
      console.log('Camera Error: ', error);
      Toast.error('❌ Unable to access camera. Please try again.', 'top');
    }
  };

  const ActionButton = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="items-center mx-4">
      <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-gray-600 text-xs mt-2 font-medium">{label}</Text>
    </TouchableOpacity>
  );

  const TransactionItem = ({ item }: { item: any }) => (
    <View className="bg-white mx-4 mb-3 p-4 rounded-2xl shadow-sm border border-gray-50">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
            <Text className="text-lg">{item.icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-800 text-base">{item.name}</Text>
            <Text className="text-gray-500 text-sm">{item.timestamp}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className={`font-bold text-lg ${
            item.type === 'income' ? 'text-green-500' : 'text-red-500'
          }`}>
            {item.type === 'income' ? '+' : '-'} ₹{Math.abs(item.amount).toLocaleString()}
          </Text>
          <Text className="text-gray-400 text-xs">{item.category}</Text>
        </View>
      </View>
    </View>
  );

  const CategoryItem = ({ category }: { category: any }) => {
    const isExpanded = expandedCategories.includes(category.name);
    
    return (
      <View className="bg-white mx-4 mb-3 rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <TouchableOpacity 
          onPress={() => toggleCategory(category.name)}
          className="p-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1">
            <View 
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: category.color + '20' }}
            >
              <Text className="text-lg">{category.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 text-base">{category.name}</Text>
              <Text className="text-gray-500 text-sm">{category.transactions.length} transactions</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className={`font-bold text-lg ${
              category.totalAmount >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {category.totalAmount >= 0 ? '+' : ''} ₹{category.totalAmount.toLocaleString()}
            </Text>
            <Text className="text-gray-400 text-xs">
              {isExpanded ? '▲' : '▼'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View className="border-t border-gray-100">
            {category.transactions.map((transaction: any) => (
              <View key={transaction.id} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-sm">{transaction.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-700 text-sm">{transaction.name}</Text>
                      <Text className="text-gray-400 text-xs">{transaction.date}</Text>
                    </View>
                  </View>
                  <Text className={`font-semibold text-sm ${
                    transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} ₹{Math.abs(transaction.amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#e0f2fe", "#bae6fd", "#7dd3fc"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="pb-8">
          <View className="pt-5 pb-6">
            <Text className="text-center text-gray-800 text-xl font-bold">Transactions</Text>
          </View>

          {/* Total Balance Section */}
          <View className="px-6 pb-4">
            <View className="bg-white rounded-2xl p-4 shadow-lg">
              <View className="items-center mb-4">
                <Text className="text-gray-500 text-xs mb-1">Total Balance</Text>
                <Text className="text-gray-800 text-2xl font-bold">₹ 2,548.00</Text>
                <Text className="text-gray-400 text-xs mt-1">as of today</Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-around items-center">
                <ActionButton 
                  icon="➕" 
                  label="Add" 
                  onPress={() => console.log('Add transaction')} 
                />
                <ActionButton 
                  icon="📷" 
                  label="Scan" 
                  onPress={handleScanPress} 
                />
                <ActionButton 
                  icon="📄" 
                  label="Upload" 
                  onPress={() => console.log('Upload document')} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* White Container Section with Tabs and Content */}
        <View 
          className="bg-white shadow-lg"
          style={{
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            marginTop: -10,
            flex: 1,
            paddingBottom: 0,
            marginBottom: -50
          }}
        >
          {/* Tab Section */}
          <View className="px-4 pt-2 pb-4">
            <View 
              className="bg-gray-50 rounded-2xl p-2"
              style={{ elevation: 1 }}
            >
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setActiveTab('transactions')}
                  className={`flex-1 py-3 px-4 rounded-xl ${
                    activeTab === 'transactions' 
                      ? 'bg-white shadow-sm' 
                      : 'bg-transparent'
                  }`}
                  style={activeTab === 'transactions' ? { elevation: 2 } : {}}
                >
                  <Text className={`text-center font-semibold ${
                    activeTab === 'transactions' 
                      ? 'text-blue-600' 
                      : 'text-gray-600'
                  }`}>
                    Transactions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab('groups')}
                  className={`flex-1 py-3 px-4 rounded-xl ${
                    activeTab === 'groups' 
                      ? 'bg-white shadow-sm' 
                      : 'bg-transparent'
                  }`}
                  style={activeTab === 'groups' ? { elevation: 2 } : {}}
                >
                  <Text className={`text-center font-semibold ${
                    activeTab === 'groups' 
                      ? 'text-blue-600' 
                      : 'text-gray-600'
                  }`}>
                    Groups
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Content Section */}
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0, flexGrow: 1 }}
          >
            {activeTab === 'transactions' ? (
              <FlatList
                data={allTransactions}
                renderItem={({ item }) => <TransactionItem item={item} />}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View>
                {transactionCategories.map((category) => (
                  <CategoryItem key={category.name} category={category} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}