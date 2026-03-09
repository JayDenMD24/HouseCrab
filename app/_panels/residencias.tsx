import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ITEMS = [
  { label: "Mis Residencias", icon: "business-outline" as const },
  { label: "Registrar Residencia", icon: "add-circle-outline" as const },
];

export default function ResidenciasPanel() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Residencias</Text>
      {ITEMS.map(({ label, icon }) => (
        <TouchableOpacity key={label} style={styles.row} activeOpacity={0.7}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={20} color="#fff" />
          </View>
          <Text style={styles.rowLabel}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowLabel: {
    fontSize: 16,
    color: "#222",
    fontWeight: "500",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2196F3",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
});
