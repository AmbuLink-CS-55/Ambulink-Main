import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n/i18n";

interface EmergencyContactModalProps {
  visible: boolean;
  onClose: () => void;
  contactName: string;
  setContactName: (name: string) => void;
  emergencyContactNumber: string;
  setEmergencyContactNumber: (number: string) => void;
  isEditing: boolean;
  onSubmit: () => void;
}


export default function EmergencyContactModal({
  visible,
  onClose,
  contactName,
  setContactName,
  emergencyContactNumber,
  setEmergencyContactNumber,
  isEditing,
  onSubmit,
}: EmergencyContactModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-2xl p-4 pb-8 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              {isEditing ? i18n.t("common.edit") + " " + i18n.t("settings.emergency.title") : i18n.t("settings.emergency.addEmergencyContact")}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-1.5">{i18n.t("settings.emergency.contactName")}</Text>
            <TextInput
              className="border border-gray-200 rounded-xl p-3 text-sm text-gray-800"
              placeholder={i18n.t("settings.emergency.exampleName")}
              value={contactName}
              onChangeText={setContactName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-1.5">{i18n.t("settings.emergency.phoneNumber")}</Text>
            <TextInput
              className="border border-gray-200 rounded-xl p-3 text-sm text-gray-800"
              placeholder={i18n.t("settings.emergency.enterPhoneNumber")}
              value={emergencyContactNumber}
              onChangeText={setEmergencyContactNumber}
              keyboardType="phone-pad"
            />
          </View>

          <Pressable
            className="bg-teal-500 rounded-full p-3.5 justify-center items-center mt-4"
            onPress={onSubmit}
          >
            <Text className="text-white text-base font-semibold">
              {isEditing ? i18n.t("common.update") : i18n.t("common.add")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
