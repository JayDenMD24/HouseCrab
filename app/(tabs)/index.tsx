import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../../assets/images/hc_logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Título */}
      <Text style={styles.title}>¡Bienvenido!</Text>

      {/* Botón Iniciar sesión */}
      <Text style={styles.subtitle}>¿Ya tienes una cuenta?</Text>
      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => router.push("/(tabs)/login")}
      >
        <Text style={styles.buttonPrimaryText}>Iniciar sesión</Text>
      </TouchableOpacity>

      {/* Botón Regístrate */}
      <Text style={styles.subtitle}>¿Primera vez?</Text>
      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => router.push("/(tabs)/registro")}
      >
        <Text style={styles.buttonSecondaryText}>Regístrate</Text>
      </TouchableOpacity>

      {/* Botón Google */}
      <Text style={styles.subtitle}>también puedes</Text>
      <TouchableOpacity style={styles.buttonGoogle}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.buttonGoogleText}>Continuar con Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: "center",
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
  },
  buttonPrimary: {
    backgroundColor: "#2196F3",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonPrimaryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonSecondary: {
    backgroundColor: "#E0E0E0",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonSecondaryText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "#ccc",
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4285F4",
  },
  buttonGoogleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
