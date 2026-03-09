import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegistroScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Registrarse</Text>

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput style={styles.input} secureTextEntry />

        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput style={styles.input} secureTextEntry />

        <Text style={styles.label}>Fecha de nacimiento</Text>
        <TextInput style={styles.input} placeholder="dd/mm/aaaa" />

        <TouchableOpacity style={styles.buttonPrimary}>
          <Text style={styles.buttonPrimaryText}>Registrarse</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>también puedes</Text>
        <TouchableOpacity style={styles.buttonGoogle}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.buttonGoogleText}>Continuar con Google</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inner: {
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 32,
  },
  back: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 22,
    color: "#333",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 15,
  },
  buttonPrimary: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 32,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  buttonPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 8,
  },
  buttonGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
