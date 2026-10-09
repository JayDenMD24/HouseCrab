import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColores } from "@/lib/tema";

export function Encabezado({ titulo, onBack }: { titulo: string; onBack: () => void }) {
  const col = useColores();
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.back} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={col.textoSec} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: col.texto }]}>{titulo}</Text>
      <View style={styles.back} />
    </View>
  );
}

// Estilos compartidos por las pantallas de Configuración.
export const useEstilosConfig = () => {
  const col = useColores();
  return useMemo(() => StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  label: { fontSize: 13, color: col.textoSec, marginBottom: -4 },
  input: {
    borderWidth: 1,
    borderColor: col.borde,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: col.tarjeta,
    color: col.texto,
  },
  inputOff: { backgroundColor: col.superficie, color: col.textoTer },
  seccion: { fontSize: 16, fontWeight: "700", color: col.texto, marginTop: 8 },
  error: { color: "#D32F2F", fontSize: 13 },
  ok: { color: "#2E7D32", fontSize: 13 },
  boton: { backgroundColor: "#2196F3", borderRadius: 24, paddingVertical: 12, alignItems: "center" },
  botonTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  botonRojo: { backgroundColor: "#E53935", borderRadius: 24, paddingVertical: 12, alignItems: "center" },
  botonBorde: { borderWidth: 1.5, borderColor: "#E53935", borderRadius: 24, paddingVertical: 12, alignItems: "center" },
  botonBordeTexto: { color: "#E53935", fontWeight: "700", fontSize: 15 },
  texto: { fontSize: 14, color: col.textoSec, lineHeight: 21 },
}), [col]);
};

const useStyles = () => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800" },
});
