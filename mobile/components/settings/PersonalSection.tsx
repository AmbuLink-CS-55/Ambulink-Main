import { View, Text, Pressable, TextInput, Image, StyleSheet } from
  "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

interface PersonalSectionProps {
  profileName: string;
  setProfileName: (name: string) => void;
  profileImage: string | null;
  onPickImage: () => void;
}


export default function PersonalSection({
  profileName,
  setProfileName,
  profileImage,
  onPickImage,
}: PersonalSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal</Text>

      <View style={styles.card}>
        <Pressable
          style={styles.profilePicContainer}
          onPress={onPickImage}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profilePic}
            />
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

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Enter name"
          />
        </View>

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
  );
}

const styles = StyleSheet.create({
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
});
