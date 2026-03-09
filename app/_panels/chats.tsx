import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const CHATS = [
  { id: "soporte", nombre: "Soporte", mensajes: 3, activo: true },
  { id: "jose", nombre: "José Medrano", mensajes: 1, activo: false },
  { id: "sebastian", nombre: "Sebastián Arroyo", mensajes: 0, activo: false },
];

const RobotIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="9" width="18" height="11" rx="2" />
    <path d="M8 9V7a4 4 0 018 0v2" />
    <circle cx="9" cy="14" r="1.2" fill="#fff" />
    <circle cx="15" cy="14" r="1.2" fill="#fff" />
    <path d="M9.5 17.5c.8.7 4.2.7 5 0" />
  </svg>
);

const PersonIcon = ({ color }: { color: string }) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const AVATAR_COLORS = ["#E53935", "#8E24AA", "#00897B", "#F4511E"];

export default function ChatsPanel({ onClose }: { onClose?: () => void }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#555"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </TouchableOpacity>
        <Text style={styles.title}>Chats</Text>
        <View style={styles.backBtn} /> {/* spacer */}
      </View>

      {/* Lista */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {CHATS.map(({ id, nombre, mensajes, activo }, index) => (
          <TouchableOpacity
            key={id}
            style={[styles.row, activo && styles.rowActivo]}
            activeOpacity={0.75}
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View
                style={[
                  styles.avatar,
                  id === "soporte"
                    ? styles.avatarSoporte
                    : {
                        backgroundColor:
                          AVATAR_COLORS[index % AVATAR_COLORS.length],
                      },
                ]}
              >
                {id === "soporte" ? (
                  /* @ts-ignore */ <RobotIcon />
                ) : (
                  /* @ts-ignore */ <PersonIcon color="#fff" />
                )}
              </View>
              {/* Punto online */}
              <View style={styles.onlineDot} />
            </View>

            {/* Nombre */}
            <Text style={[styles.nombre, activo && styles.nombreActivo]}>
              {nombre}
            </Text>

            {/* Badge */}
            {mensajes > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{mensajes}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2196F3",
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowActivo: {
    backgroundColor: "#2196F3",
  },
  avatarWrap: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSoporte: {
    backgroundColor: "#2196F3",
    borderWidth: 2,
    borderColor: "#fff",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  nombre: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  nombreActivo: {
    color: "#fff",
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F44336",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
