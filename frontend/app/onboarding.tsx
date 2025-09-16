import { Text, View, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Onboarding() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/(auth)/signin");
  };

  return (
    <View className="flex-1 bg-blue-500">
      {/* Main Content Container */}
      <View className="flex-1 justify-between px-8 pt-16 pb-16">
        {/* Top Section - Illustration */}
        <View className="flex-1 justify-center items-center">
          <View className="mt-7">
            <Image
              source={require("../assets/images/onboarding-graphic.png")}
              className="w-102 h-96"
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Middle Section - App Description */}
        <View className="flex-1 justify-center px-4">
          <Text
            className="text-white text-3xl text-center font-semibold mb-3"
            style={{ fontFamily: "Poppins-SemiBold" }}
          >
            Take full control of your money
          </Text>
          <Text
            className="text-white text-lg text-center leading-7 opacity-90"
            style={{ fontFamily: "Poppins-Light" }}
          >
            Smart insights, automated tracking, and effortless investing — all
            in one app.
          </Text>
        </View>

        {/* Bottom Section - Get Started Button */}
        <View className="justify-end">
          <TouchableOpacity
            onPress={handleGetStarted}
            className="bg-white rounded-full py-4 px-8 mx-4 shadow-lg"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              className="text-blue-500 text-lg text-center"
              style={{ fontFamily: "Poppins-SemiBold" }}
            >
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
