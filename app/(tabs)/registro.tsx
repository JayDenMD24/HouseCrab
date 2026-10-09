import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Campo, MensajeError, PantallaAuth, Separador } from "@/components/auth-ui";
import { Boton } from "@/components/ui";
import { Rol, useAuth } from "@/lib/auth";
import { fechaISO } from "@/lib/fechas";
import { radios, useColores } from "@/lib/tema";

const ROLES: { rol: Rol; titulo: string; detalle: string; icono: keyof typeof Ionicons.glyphMap }[] = [
  { rol: "estudiante", titulo: "Estudiante", detalle: "Busco una pensión", icono: "school-outline" },
  { rol: "arrendatario", titulo: "Arrendatario", detalle: "Ofrezco una pensión", icono: "business-outline" },
];

export default function RegistroScreen() {
  const router = useRouter();
  const styles = useStyles();
  const col = useColores();
  const { signUp, signInWithGoogle } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [fecha, setFecha] = useState("");
  const [rol, setRol] = useState<Rol>("estudiante");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const registrar = async () => {
    const iso = fechaISO(fecha);
    if (!nombre.trim() || !email.trim() || !password) return setError("Completa todos los campos.");
    if (password !== confirmar) return setError("Las contraseñas no coinciden.");
    if (!iso) return setError("La fecha debe tener el formato dd/mm/aaaa.");
    setEnviando(true);
    setError(null);
    const err = await signUp({
      email: email.trim(),
      password,
      nombre: nombre.trim(),
      rol,
      fechaNacimiento: iso,
    });
    setEnviando(false);
    if (err) setError(err);
    // Si todo sale bien, AuthGate redirige al mapa.
  };

  return (
    <PantallaAuth
      titulo="Crear cuenta"
      subtitulo="Únete a HouseCrab en un minuto."
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
    >
      <View style={styles.roles}>
        {ROLES.map((r) => {
          const activo = rol === r.rol;
          return (
            <TouchableOpacity
              key={r.rol}
              style={[styles.rol, activo && styles.rolActivo]}
              onPress={() => setRol(r.rol)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
            >
              <Ionicons name={r.icono} size={26} color={activo ? col.primario : col.textoTer} />
              <Text style={[styles.rolTitulo, activo && { color: col.primario }]}>{r.titulo}</Text>
              <Text style={styles.rolDetalle}>{r.detalle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Campo icono="person-outline" etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
      <Campo
        icono="mail-outline"
        etiqueta="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="tucorreo@ejemplo.com"
      />
      <Campo
        icono="lock-closed-outline"
        etiqueta="Contraseña"
        value={password}
        onChangeText={setPassword}
        password
        placeholder="Mínimo 6 caracteres"
      />
      <Campo
        icono="lock-closed-outline"
        etiqueta="Confirmar contraseña"
        value={confirmar}
        onChangeText={setConfirmar}
        password
        placeholder="Repite tu contraseña"
      />
      <Campo
        icono="calendar-outline"
        etiqueta="Fecha de nacimiento"
        value={fecha}
        onChangeText={setFecha}
        placeholder="dd/mm/aaaa"
      />

      {error && <MensajeError texto={error} />}

      <Boton titulo="Crear cuenta" onPress={registrar} cargando={enviando} />
      <Separador texto={`o regístrate como ${rol} con Google`} />
      <Boton
        titulo="Continuar con Google"
        icono="logo-google"
        variante="secundario"
        onPress={async () => setError(await signInWithGoogle(rol))}
      />
    </PantallaAuth>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        roles: { flexDirection: "row", gap: 12 },
        rol: {
          flex: 1,
          alignItems: "center",
          gap: 4,
          paddingVertical: 14,
          paddingHorizontal: 8,
          borderRadius: radios.lg,
          borderWidth: 2,
          borderColor: col.borde,
          backgroundColor: col.tarjeta,
        },
        rolActivo: { borderColor: col.primario, backgroundColor: col.azulSuave },
        rolTitulo: { fontSize: 15, fontWeight: "800", color: col.texto },
        rolDetalle: { fontSize: 12, color: col.textoTer, textAlign: "center" },
      }),
    [col],
  );
};
