import { Modal, View, Text, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n/i18n";

interface BloodTypeModalProps {
  visible: boolean;
  onClose: () => void;
  bloodType: string;
  setBloodType: (type: string) => void;
  bloodTypes: string[];
}

export default function BloodTypeModal({
  visible,
  onClose,
  bloodType,
  setBloodType,
  bloodTypes,
}: BloodTypeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-2xl p-4 pb-8 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              {i18n.t("settings.medical.selectBloodType")}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <FlatList
            data={bloodTypes}
            renderItem={({ item }) => (
              <Pressable
                className={`flex-row justify-between items-center py-3 px-4 border-b border-gray-100 ${
                  bloodType === item && "bg-teal-50"
                }`}
                onPress={() => {
                  setBloodType(item);
                  onClose();
                }}
              >
                <Text
                  className={`text-base text-gray-800 ${
                    bloodType === item && "text-teal-500 font-semibold"
                  }`}
                >
                  {item}
                </Text>
                {bloodType === item && <Ionicons name="checkmark" size={20} color="#26A69A" />}
              </Pressable>
            )}
            keyExtractor={(item) => item}
            scrollEnabled={false}
          />
        </View>
      </View>
    </Modal>
  );
}
