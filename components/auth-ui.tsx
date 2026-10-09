import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { radios, useColores } from "@/lib/tema";

// Contenedor de las pantallas de acceso: centrado, con ancho máximo para que no se estire en pantallas grandes.
export function PantallaAuth({
  titulo,
  subtitulo,
  onBack,
  grande,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  onBack?: () => void;
  grande?: boolean; // logo grande (pantalla de bienvenida)
  children: React.ReactNode;
}) {
  const styles = useStyles();
  const col = useColores();
  const { width } = useWindowDimensions();

  // Escritorio: pantalla dividida (marca a la izquierda, formulario a la derecha).
  if (width >= 900) {
    return (
      <View style={styles.dividido}>
        <View style={styles.marca}>
          <View style={styles.marcaLogoCaja}>
            <Image source={require("../assets/images/hc_logo.png")} style={styles.marcaLogo} resizeMode="contain" />
          </View>
          <Text style={styles.marcaTitulo}>HouseCrab</Text>
          <Text style={styles.marcaTexto}>Encuentra y publica pensiones universitarias en el mapa.</Text>
          <View style={styles.marcaLista}>
            {[
              ["map-outline", "Explora pensiones en un mapa interactivo"],
              ["chatbubbles-outline", "Chatea directamente con los propietarios"],
              ["shield-checkmark-outline", "Pensiones verificadas por un administrador"],
            ].map(([icono, texto]) => (
              <View key={texto} style={styles.marcaItem}>
                <Ionicons name={icono as keyof typeof Ionicons.glyphMap} size={22} color="#fff" />
                <Text style={styles.marcaItemTexto}>{texto}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ladoFormulario}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.columna}>
              {onBack && (
                <TouchableOpacity onPress={onBack} style={styles.atras} accessibilityLabel="Volver">
                  <Ionicons name="arrow-back" size={22} color={col.texto} />
                </TouchableOpacity>
              )}
              <Text style={[styles.titulo, { textAlign: "left" }]}>{grande ? "Bienvenido" : titulo}</Text>
              {grande ? (
                <Text style={[styles.subtitulo, { textAlign: "left" }]}>Inicia sesión o crea tu cuenta para continuar.</Text>
              ) : subtitulo ? (
                <Text style={[styles.subtitulo, { textAlign: "left" }]}>{subtitulo}</Text>
              ) : null}
              <View style={styles.contenido}>{children}</View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fondo}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.columna}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.atras} accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={22} color={col.texto} />
            </TouchableOpacity>
          )}
          <Image
            source={require("../assets/images/hc_logo.png")}
            style={grande ? styles.logoGrande : styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titulo}>{titulo}</Text>
          {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
          <View style={styles.contenido}>{children}</View>
        </View>
      </ScrollView>
    </View>
  );
}

// Campo de texto con ícono; las contraseñas tienen botón para mostrar u ocultar.
export function Campo({
  icono,
  etiqueta,
  password,
  ...props
}: TextInputProps & {
  icono: keyof typeof Ionicons.glyphMap;
  etiqueta: string;
  password?: boolean;
}) {
  const styles = useStyles();
  const col = useColores();
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={styles.caja}>
        <Ionicons name={icono} size={19} color={col.textoTer} />
        <TextInput
          style={styles.input}
          placeholderTextColor={col.textoTer}
          secureTextEntry={password && !visible}
          autoCapitalize={password ? "none" : props.autoCapitalize}
          {...props}
        />
        {password && (
          <TouchableOpacity onPress={() => setVisible(!visible)} accessibilityLabel="Mostrar u ocultar contraseña">
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={col.textoTer} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function Separador({ texto }: { texto: string }) {
  const styles = useStyles();
  return (
    <View style={styles.separador}>
      <View style={styles.linea} />
      <Text style={styles.separadorTexto}>{texto}</Text>
      <View style={styles.linea} />
    </View>
  );
}

export function MensajeError({ texto }: { texto: string }) {
  const styles = useStyles();
  return (
    <View style={styles.error}>
      <Ionicons name="alert-circle" size={18} color="#D32F2F" />
      <Text style={styles.errorTexto}>{texto}</Text>
    </View>
  );
}

const useStyles = () => {
  const col = useColores();
  return useMemo(
    () =>
      StyleSheet.create({
        fondo: { flex: 1, backgroundColor: col.fondo },
        dividido: { flex: 1, flexDirection: "row", backgroundColor: col.fondo },
        marca: {
          flex: 1,
          backgroundColor: col.primario,
          alignItems: "flex-start",
          justifyContent: "center",
          paddingHorizontal: 72,
          gap: 16,
        },
        marcaLogoCaja: {
          width: 120,
          height: 120,
          borderRadius: 28,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        },
        marcaLogo: { width: 90, height: 90 },
        marcaTitulo: { fontSize: 44, fontWeight: "800", color: "#fff" },
        marcaTexto: { fontSize: 19, color: "rgba(255,255,255,0.9)", lineHeight: 28, maxWidth: 440 },
        marcaLista: { gap: 14, marginTop: 20 },
        marcaItem: { flexDirection: "row", alignItems: "center", gap: 12 },
        marcaItemTexto: { fontSize: 16, color: "#fff" },
        ladoFormulario: { flex: 1, backgroundColor: col.fondo },
        scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
        columna: { width: "100%", maxWidth: 420 },
        atras: { alignSelf: "flex-start", padding: 4, marginBottom: 8, marginLeft: -4 },
        logo: { width: 84, height: 84, alignSelf: "center", marginBottom: 8 },
        logoGrande: { width: 150, height: 150, alignSelf: "center", marginBottom: 8 },
        titulo: { fontSize: 28, fontWeight: "800", color: col.texto, textAlign: "center" },
        subtitulo: { fontSize: 15, color: col.textoSec, textAlign: "center", marginTop: 6, lineHeight: 22 },
        contenido: { marginTop: 24, gap: 14 },
        campo: { gap: 6 },
        etiqueta: { fontSize: 13, fontWeight: "700", color: col.textoSec },
        caja: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: col.tarjeta,
          borderWidth: 1,
          borderColor: col.borde,
          borderRadius: radios.md,
          paddingHorizontal: 14,
          minHeight: 50,
        },
        input: { flex: 1, fontSize: 15, color: col.texto, paddingVertical: 12 },
        separador: { flexDirection: "row", alignItems: "center", gap: 12 },
        linea: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: col.borde },
        separadorTexto: { fontSize: 13, color: col.textoTer },
        error: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: col.oscuro ? "#3A1515" : "#FDECEA",
          borderRadius: radios.md,
          padding: 12,
        },
        errorTexto: { flex: 1, fontSize: 13, color: col.oscuro ? "#FF8A80" : "#C62828" },
      }),
    [col],
  );
};
