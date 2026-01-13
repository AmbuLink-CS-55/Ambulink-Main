import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.searchContainer}>
          <Text style={styles.searchText}>Search</Text>
          <View style={{ flex: 1 }} />
          <Link href="/(patient)/settings">
            <Ionicons name="settings-outline" size={22} color="#333" />
          </Link>
        </View>

        <Text style={styles.sectionTitle}>Quick Action</Text>

        <View style={styles.quickActionContainer}>
          <View style={styles.leftColumn}>
            <View style={styles.bookCard}>
              <View style={styles.bookHeader}>
                <Text style={styles.cardTitle}>Bookings</Text>
              </View>
              <View style={styles.bookContent}>
                <View style={styles.heartBadge}>
                  <Ionicons name="heart" size={28} color="white" />
                </View>
                <View style={styles.bookInfo}>
                  <Text style={styles.keepCalm}>Keep Calm</Text>
                  <Text style={styles.timeAway}>10 min</Text>
                  <Text style={styles.awayText}>Away</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="water" size={14} color="#666" />
                  <Text style={styles.badgeText}>Blood</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="restaurant-outline" size={14} color="#666" />
                  <Text style={styles.badgeText}>Food</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <Text style={styles.subBadgeText}>Type: O+</Text>
                <Text style={styles.subBadgeText}>Alleges</Text>
              </View>

            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* First-Aid Card */}
            <View style={styles.smallCard}>
              <View>
                <Text style={styles.cardTitle}>First-Aid Guides</Text>
                <Text style={styles.cardSubtitle}>Critical</Text>
                <Text style={styles.cardSubtitle}>Steps</Text>
              </View>
              <Text style={styles.bandaidEmoji}>🩹</Text>
            </View>

            {/* Hospital Card */}
            <View style={styles.smallCard}>
              <View>
                <Text style={styles.cardTitle}>Nearest Hospital</Text>
                <Text style={styles.cardSubtitle}>2 km</Text>
                <Text style={styles.cardSubtitle}>20 min.</Text>
              </View>
              <Text style={styles.hospitalEmoji}>🏥</Text>
            </View>
          </View>
        </View>


        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About</Text>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Birthdate</Text>
            <Text style={styles.infoValue}>2nd Apr 1999</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height.</Text>
            <Text style={styles.infoValue}>181cm</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight</Text>
            <Text style={styles.infoValue}>72 kg</Text>
          </View>

          <Text style={[styles.infoTitle, { marginTop: 16 }]}>Contact</Text>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile</Text>
            <Text style={styles.infoLink}>0718844688</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lan</Text>
            <Text style={styles.infoLink}>011 256 7718</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoLink}>sutharakaf@gmail.com</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.medicalButton} onPress={() => router.push("/(patient)/map")}>
          <Text style={styles.medicalButtonText}>Book</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F4F8",
  },
  scrollContent: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 30,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  quickActionContainer: {
    flexDirection: "row",
    gap: 12,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    gap: 12,
  },
  bookCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bookTitle: {
    fontSize: 14,
    color: "#666",
  },
  bookContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  heartBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FFD93D",
    justifyContent: "center",
    alignItems: "center",
  },
  bookInfo: {
    flex: 1,
  },
  keepCalm: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  timeAway: {
    fontSize: 12,
    color: "#666",
  },
  awayText: {
    fontSize: 12,
    color: "#666",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: "#666",
  },
  subBadgeText: {
    fontSize: 10,
    color: "#999",
    marginLeft: 8,
  },
  smallCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  bandaidEmoji: {
    fontSize: 30,
  },
  hospitalEmoji: {
    fontSize: 30,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
  },
  infoLink: {
    fontSize: 14,
    color: "#26A69A",
  },
  medicalButton: {
    backgroundColor: "#26A69A",
    borderRadius: 30,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  medicalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
