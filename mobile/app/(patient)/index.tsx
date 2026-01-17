import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "@/src/languages/i18n";;

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-sky-50">
      <ScrollView contentContainerStyle={{}} showsVerticalScrollIndicator={false} className="px-4 py-7">

        <View className="flex-row items-center justify-between bg-white rounded-full px-4 py-3 mb-5">
          <Text className="text-base text-gray-800 ml-2">{i18n.t("common.search")}</Text>
          <View className="flex-1" />
          <Link href="/(patient)/settings">
            <Ionicons name="settings-outline" size={22} color="#333" />
          </Link>
        </View>

        <Text className="text-lg font-semibold text-gray-800 mb-3">{i18n.t("home.quickAction")}</Text>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <View className="bg-white rounded-2xl p-3">
              <View className="mb-2">
                <Text className="text-sm font-medium text-gray-800">{i18n.t("home.bookings")}</Text>
              </View>
              <View className="flex-row items-center gap-2 mb-3">
                <View className="w-12 h-12 rounded-xl bg-yellow-300 justify-center items-center">
                  <Ionicons name="heart" size={28} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">{i18n.t("home.keepCalm")}</Text>
                  <Text className="text-xs text-gray-500">10 min</Text>
                  <Text className="text-xs text-gray-500">{i18n.t("home.away")}</Text>
                </View>
              </View>

              <View className="flex-row gap-2 mb-2">
                <View className="flex-row items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
                  <MaterialCommunityIcons name="water" size={14} color="#666" />
                  <Text className="text-xs text-gray-600">{i18n.t("home.blood")}</Text>
                </View>
                <View className="flex-row items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Ionicons name="restaurant-outline" size={14} color="#666" />
                  <Text className="text-xs text-gray-600">{i18n.t("home.food")}</Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <Text className="text-xs text-gray-400">{i18n.t("home.type")}: O+</Text>
                <Text className="text-xs text-gray-400">{i18n.t("home.allergies")}</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 gap-3">
            <View className="bg-white rounded-2xl p-3 flex-row justify-between items-center">
              <View>
                <Text className="text-sm font-medium text-gray-800">{i18n.t("home.firstAidGuides")}</Text>
                <Text className="text-xs text-gray-600">{i18n.t("home.critical")}</Text>
                <Text className="text-xs text-gray-600">{i18n.t("home.steps")}</Text>
              </View>
              <Text className="text-3xl">🩹</Text>
            </View>

            <View className="bg-white rounded-2xl p-3 flex-row justify-between items-center">
              <View>
                <Text className="text-sm font-medium text-gray-800">{i18n.t("home.nearestHospital")}</Text>
                <Text className="text-xs text-gray-600">2 km</Text>
                <Text className="text-xs text-gray-600">20 min.</Text>
              </View>
              <Text className="text-3xl">🏥</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-5 mt-5">
          <Text className="text-base font-semibold text-gray-800 mb-2.5">{i18n.t("home.about")}</Text>
          <View className="h-px bg-gray-200 mb-2.5" />

          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-gray-600">{i18n.t("home.birthdate")}</Text>
            <Text className="text-sm text-gray-800">2nd Apr 1999</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-gray-600">{i18n.t("home.height")}</Text>
            <Text className="text-sm text-gray-800">181cm</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-gray-600">{i18n.t("home.weight")}</Text>
            <Text className="text-sm text-gray-800">72 kg</Text>
          </View>

          <Text className="text-base font-semibold text-gray-800 mt-4 mb-2.5">{i18n.t("home.contact")}</Text>
          <View className="h-px bg-gray-200 mb-2.5" />

          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-gray-600">{i18n.t("home.mobile")}</Text>
            <Text className="text-sm text-teal-600">0718844688</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-gray-600">{i18n.t("home.landline")}</Text>
            <Text className="text-sm text-teal-600">011 256 7718</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-gray-600">{i18n.t("home.email")}</Text>
            <Text className="text-sm text-teal-600">sutharakaf@gmail.com</Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-teal-600 rounded-full px-8 py-4 flex-row justify-center items-center gap-2 mt-5"
          onPress={() => router.push("/(patient)/map")}
        >
          <Text className="text-white text-base font-semibold">{i18n.t("home.book")}</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
