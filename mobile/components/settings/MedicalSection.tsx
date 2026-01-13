import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MedicalSectionProps {
  bloodType: string;
  setBloodTypeModal: (visible: boolean) => void;
  selectedAllergies: string[];
  setAllergiesModal: (visible: boolean) => void;
}


export default function MedicalSection({
  bloodType,
  setBloodTypeModal,
  selectedAllergies,
  setAllergiesModal,
}: MedicalSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Medical Information</Text>

      <View style={styles.card}>
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

        <Pressable style={styles.selectRow}>
          <View>
            <Text style={styles.inputLabel}>Medical Documents</Text>
            <Text style={styles.placeholderText}>Upload documents</Text>
          </View>
          <Ionicons
            name="document-attach-outline"
            size={20}
            color="#26A69A"
          />
        </Pressable>
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
  selectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 6,
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
});
