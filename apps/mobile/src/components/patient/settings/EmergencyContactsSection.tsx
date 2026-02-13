import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n/i18n";

interface Contact {
  id: number;
  number: string;
  name: string;
}

interface EmergencyContactsSectionProps {
  emergencyContacts: Contact[];
  setEmergencyContactModal: (visible: boolean) => void;
  resetForm: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number) => void;
}

export default function EmergencyContactsSection({
  emergencyContacts,
  setEmergencyContactModal,
  resetForm,
  onEdit,
  onDelete,
}: EmergencyContactsSectionProps) {
  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-gray-800">
          {i18n.t("settings.emergency.title")}
        </Text>
        <Pressable
          className="w-10 h-10 rounded-full bg-teal-500 justify-center items-center"
          onPress={() => {
            resetForm();
            setEmergencyContactModal(true);
          }}
        >
          <Ionicons name="add" size={20} color="white" />
        </Pressable>
      </View>

      <View className="bg-white rounded-2xl p-4">
        {emergencyContacts.map((contact, index) => (
          <View key={contact.id}>
            <View className="flex-row justify-between items-center py-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">{contact.name}</Text>
                <Text className="text-xs text-gray-600 mt-1">{contact.number}</Text>
              </View>
              <Pressable onPress={() => onEdit(contact)} className="p-2">
                <Ionicons name="pencil" size={18} color="#26A69A" />
              </Pressable>
              <Pressable onPress={() => onDelete(contact.id)} className="p-2">
                <Ionicons name="trash" size={18} color="#E74C3C" />
              </Pressable>
            </View>
            {index !== emergencyContacts.length - 1 && <View className="h-px bg-gray-200" />}
          </View>
        ))}
      </View>
    </View>
  );
}
