import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/common/i18n/i18n";
import { useSettings } from "@/common/hooks/SettingsContext";

export default function EmergencyContactsSection() {
  const {
    settings,
    setActiveModal,
    resetEmergencyContactForm,
    handleEditEmergencyContact,
    handleDeleteEmergencyContact,
  } = useSettings();

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-foreground">
          {i18n.t("settings.emergency.title")}
        </Text>
        <Pressable
          className="w-10 h-10 rounded-full bg-teal-500 justify-center items-center"
          onPress={() => {
            resetEmergencyContactForm();
            setActiveModal("contact");
          }}
        >
          <Ionicons name="add" size={20} color="white" />
        </Pressable>
      </View>

      <View className="bg-card rounded-2xl p-4">
        {settings.emergencyContacts.map((contact, index) => (
          <View key={contact.id}>
            <View className="flex-row justify-between items-center py-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{contact.name}</Text>
                <Text className="text-xs text-muted-foreground mt-1">{contact.number}</Text>
              </View>
              <Pressable onPress={() => handleEditEmergencyContact(contact)} className="p-2">
                <Ionicons name="pencil" size={18} color="#26A69A" />
              </Pressable>
              <Pressable onPress={() => handleDeleteEmergencyContact(contact.id)} className="p-2">
                <Ionicons name="trash" size={18} color="#E74C3C" />
              </Pressable>
            </View>
            {index !== settings.emergencyContacts.length - 1 && <View className="h-px bg-muted" />}
          </View>
        ))}
      </View>
    </View>
  );
}
