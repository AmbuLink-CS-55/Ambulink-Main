import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";


const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const ALLERGIES_LIST = [
  "Peanuts",
  "Tree nuts",
  "Shellfish",
  "Fish",
  "Eggs",
  "Milk",
  "Soy",
  "Wheat",
  "Sesame",
  "Sulfites",
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Latex",
];

export default function Settings() {
  const [profileName, setProfileName] = useState("Sutharaka F");
  const [profileImage, setProfileImage] = useState(null);
  const [bloodType, setBloodType] = useState("O+");
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, number: "119", name: "Bro" },
  ]);
  const [contactName, setContactName] = useState("");

  const [bloodTypeModal, setBloodTypeModal] = useState(false);
  const [allergiesModal, setAllergiesModal] = useState(false);
  const [allergiesSearch, setAllergiesSearch] = useState("");
  const [emergencyContactModal, setEmergencyContactModal] = useState(false);
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [editingContactId, setEditingContactId] = useState(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleAddAllergy = (allergy) => {
    if (!selectedAllergies.includes(allergy)) {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };

  const handleRemoveAllergy = (allergy) => {
    setSelectedAllergies(selectedAllergies.filter((a) => a !== allergy));
  };

  const handleAddEmergencyContact = () => {
    if (!emergencyContactNumber.trim()) {
      Alert.alert("Error", "Please enter a contact number");
      return;
    }

    if (editingContactId) {
      setEmergencyContacts(
        emergencyContacts.map((c) =>
          c.id === editingContactId
            ? { ...c, number: emergencyContactNumber, name: contactName }
            : c
        )
      );
      setEditingContactId(null);
    } else {
      setEmergencyContacts([
        ...emergencyContacts,
        {
          id: Date.now(),
          number: emergencyContactNumber,
          name: contactName || "Contact",
        },
      ]);
    }

    setEmergencyContactNumber("");
    setContactName("");
    setEmergencyContactModal(false);
  };

  const handleDeleteEmergencyContact = (id) => {
    setEmergencyContacts(emergencyContacts.filter((c) => c.id !== id));
  };

  const handleEditEmergencyContact = (contact) => {
    setEmergencyContactNumber(contact.number);
    setContactName(contact.name);
    setEditingContactId(contact.id);
    setEmergencyContactModal(true);
  };

  const filteredAllergies = ALLERGIES_LIST.filter((allergy) =>
    allergy.toLowerCase().includes(allergiesSearch.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Personal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal</Text>

        <View style={styles.card}>
          {/* Profile Picture */}
          <Pressable style={styles.profilePicContainer} onPress={handlePickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profilePic} />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={60}
                  color="#26A69A"
                />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="white" />
            </View>
          </Pressable>

          {/* Profile Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Enter name"
            />
          </View>

          {/* Contact Details */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile</Text>
            <View style={styles.staticInput}>
              <Text style={styles.staticInputText}>0718844688</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.staticInput}>
              <Text style={styles.staticInputText}>sutharakaf@gmail.com</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Medical Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>

        <View style={styles.card}>
          {/* Blood Type */}
          <Pressable
            style={styles.selectRow}
            onPress={() => setBloodTypeModal(true)}
          >
            <View>
              <Text style={styles.inputLabel}>Blood Type</Text>
              <Text style={styles.selectedValue}>{bloodType}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#26A69A" />
          </Pressable>

          <View style={styles.divider} />

          {/* Allergies */}
          <Pressable
            style={styles.selectRow}
            onPress={() => setAllergiesModal(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Allergies</Text>
              {selectedAllergies.length > 0 ? (
                <View style={styles.allergyTags}>
                  {selectedAllergies.map((allergy) => (
                    <View key={allergy} style={styles.allergyTag}>
                      <Text style={styles.allergyTagText}>{allergy}</Text>
                      <Pressable
                        onPress={() => handleRemoveAllergy(allergy)}
                        style={styles.allergyRemove}
                      >
                        <Ionicons name="close" size={14} color="white" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.placeholderText}>Add allergies</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#26A69A" />
          </Pressable>

          <View style={styles.divider} />

          {/* Medical Documents */}
          <Pressable style={styles.selectRow}>
            <View>
              <Text style={styles.inputLabel}>Medical Documents</Text>
              <Text style={styles.placeholderText}>Upload documents</Text>
            </View>
            <Ionicons name="document-attach-outline" size={20} color="#26A69A" />
          </Pressable>
        </View>
      </View>

      {/* Emergency Contacts Section */}
      <View style={styles.section}>
        <View style={styles.emergencyHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              setEmergencyContactNumber("");
              setContactName("");
              setEditingContactId(null);
              setEmergencyContactModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="white" />
          </Pressable>
        </View>

        <View style={styles.card}>
          {emergencyContacts.map((contact) => (
            <View key={contact.id}>
              <View style={styles.contactRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                </View>
                <Pressable
                  onPress={() => handleEditEmergencyContact(contact)}
                  style={styles.iconButton}
                >
                  <Ionicons name="pencil" size={18} color="#26A69A" />
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteEmergencyContact(contact.id)}
                  style={styles.iconButton}
                >
                  <Ionicons name="trash" size={18} color="#E74C3C" />
                </Pressable>
              </View>
              {emergencyContacts.indexOf(contact) !== emergencyContacts.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <Pressable style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </Pressable>

      <View style={{ height: 40 }} />

      {/* Blood Type Modal */}
      <Modal
        visible={bloodTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setBloodTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Blood Type</Text>
              <Pressable onPress={() => setBloodTypeModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <FlatList
              data={BLOOD_TYPES}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalOption,
                    bloodType === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setBloodType(item);
                    setBloodTypeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      bloodType === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {bloodType === item && (
                    <Ionicons name="checkmark" size={20} color="#26A69A" />
                  )}
                </Pressable>
              )}
              keyExtractor={(item) => item}
              scrollEnabled={false}
            />
          </View>
        </View>
      </Modal>

      {/* Allergies Modal */}
      <Modal
        visible={allergiesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAllergiesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Allergies</Text>
              <Pressable onPress={() => setAllergiesModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search allergies..."
              value={allergiesSearch}
              onChangeText={setAllergiesSearch}
            />

            <FlatList
              data={filteredAllergies}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.allergyOption}
                  onPress={() =>
                    selectedAllergies.includes(item)
                      ? handleRemoveAllergy(item)
                      : handleAddAllergy(item)
                  }
                >
                  <View style={styles.checkbox}>
                    {selectedAllergies.includes(item) && (
                      <Ionicons name="checkmark" size={16} color="#26A69A" />
                    )}
                  </View>
                  <Text style={styles.allergyOptionText}>{item}</Text>
                </Pressable>
              )}
              keyExtractor={(item) => item}
              scrollEnabled={false}
            />

            <Pressable
              style={styles.modalConfirmButton}
              onPress={() => setAllergiesModal(false)}
            >
              <Text style={styles.modalConfirmButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Emergency Contact Modal */}
      <Modal
        visible={emergencyContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEmergencyContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContactId ? "Edit Contact" : "Add Emergency Contact"}
              </Text>
              <Pressable onPress={() => setEmergencyContactModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mom, Dad, Brother"
                value={contactName}
                onChangeText={setContactName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={emergencyContactNumber}
                onChangeText={setEmergencyContactNumber}
                keyboardType="phone-pad"
              />
            </View>

            <Pressable
              style={styles.modalConfirmButton}
              onPress={handleAddEmergencyContact}
            >
              <Text style={styles.modalConfirmButtonText}>
                {editingContactId ? "Update" : "Add"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F4F8",
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  profilePicContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#26A69A",
    justifyContent: "center",
    alignItems: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  staticInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F8F8F8",
  },
  staticInputText: {
    fontSize: 14,
    color: "#666",
  },
  selectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  selectedValue: {
    fontSize: 16,
    color: "#26A69A",
    fontWeight: "500",
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  allergyTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  allergyTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  allergyTagText: {
    fontSize: 12,
    color: "#26A69A",
    fontWeight: "500",
  },
  allergyRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#26A69A",
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#26A69A",
    justifyContent: "center",
    alignItems: "center",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  contactNumber: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  iconButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: "#26A69A",
    borderRadius: 30,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalOptionSelected: {
    backgroundColor: "#E0F2F1",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalOptionTextSelected: {
    color: "#26A69A",
    fontWeight: "600",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  allergyOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#26A69A",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  allergyOptionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  modalConfirmButton: {
    backgroundColor: "#26A69A",
    borderRadius: 30,
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  modalConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
